import * as DG from 'datagrok-api/dg';
import {getRdKitModule, getRdKitService} from './chem_common_rdkit';
import {rdKitFingerprintToBitArray, tanimoto} from './chem_common';
import BitArray from "@datagrok-libraries/utils/src/bit-array";

async function _chemFindSimilar(molStringsColumn: DG.Column,
    queryMolString: string, settings: { [name: string]: any }) {
  const len = molStringsColumn.length;
  const distances =  await _chemGetSimilarities(queryMolString);
  const limit = Math.min((settings.hasOwnProperty('limit') ? settings.limit : len), len);
  const minScore = settings.hasOwnProperty('minScore') ? settings.minScore : 0.0;
  let sortedIndices = Array.from(Array(len).keys()).sort((i1, i2) => {
    const a1 = distances[i1];
    const a2 = distances[i2];
    if (a2 < a1) return -1;
    if (a2 > a1) return +1;
    return 0; // a2.compareTo(a1)
  });
  let sortedMolStrings = DG.Column.fromType(DG.TYPE.STRING, 'molecule', limit);
  let sortedMolInd = DG.Column.fromType(DG.TYPE.INT, 'index', limit);
  sortedMolStrings.semType = DG.SEMTYPE.MOLECULE;
  let sortedScores = DG.Column.fromType(DG.TYPE.FLOAT, 'score', limit);
  for (let n = 0; n < limit; n++) {
    const idx = sortedIndices[n];
    const score = distances[idx];
    if (score < minScore) {
      sortedMolStrings.dataFrame.rows.removeAt(n, limit - n);
      sortedScores.dataFrame.rows.removeAt(n, limit - n);
      break;
    }
    sortedMolStrings.set(n, molStringsColumn.get(idx));
    sortedScores.set(n, score);
    sortedMolInd.set(n, idx);
  }
  return DG.DataFrame.fromColumns([sortedMolStrings, sortedScores, sortedMolInd]);
}

// Only this function receives {sorted} in settings
async function _chemGetSimilarities(queryMolString: string) {
  const fingerprints = _chemCache.tanimotoFingerprints!;
  let distances = new Array(fingerprints.length).fill(0.0);
  const sample = chemGetMorganFingerprint(queryMolString);
  for (let i = 0; i < fingerprints.length; ++i) {
    distances[i] = tanimoto(fingerprints[i], sample);
  }
  return distances;
}

interface CacheParams {
  cachedForCol : DG.Column | null;
  cachedForColVersion: number | null;
  column: DG.Column | null;
  query: string | null;
  moleculesWereIndexed: boolean | null;
  tanimotoFingerprintsWereIndexed: boolean | null;
  tanimotoFingerprints: BitArray[] | null;
};

const cacheParamsDefaults: CacheParams = {
  cachedForCol: null,
  cachedForColVersion: null,
  column: null,
  query: null,
  moleculesWereIndexed: false,
  tanimotoFingerprintsWereIndexed: false,
  tanimotoFingerprints: null
};

let _chemCache = { ...cacheParamsDefaults };

async function _invalidate(molStringsColumn: DG.Column, queryMolString: string | null, includeFingerprints: boolean) {
  const sameColumnAndVersion = () =>
    molStringsColumn === _chemCache.cachedForCol &&
    molStringsColumn.version === _chemCache.cachedForColVersion;
  if (!sameColumnAndVersion() || queryMolString === null || queryMolString.length === 0) {
    _chemCache.cachedForCol = molStringsColumn;
    _chemCache.cachedForColVersion = molStringsColumn.version;
    _chemCache.moleculesWereIndexed = false;
    _chemCache.tanimotoFingerprintsWereIndexed = false;
    _chemCache.tanimotoFingerprints = null;
  }
  if (sameColumnAndVersion() && !_chemCache.moleculesWereIndexed) {
    // TODO: avoid creating an additional array here
    const { molIdxToHash, hashToMolblock }
      = await getRdKitService().initMoleculesStructures(molStringsColumn.toList());
    let i = 0;
    let needsUpdate = false;
    for (const item of molIdxToHash) {
      const notify = (i === molIdxToHash.length - 1);
      const molStr = hashToMolblock[item];
      if (molStr) {
        molStringsColumn.setString(i, molStr, notify);
        needsUpdate = true;
      }
      ++i;
    }
    if (needsUpdate) {
      // This seems to be the only way to trigger re-calculation of categories
      molStringsColumn.compact();
    }
    _chemCache.moleculesWereIndexed = true;
    _chemCache.tanimotoFingerprintsWereIndexed = false;
    _chemCache.tanimotoFingerprints = null;
    console.log(`RdKit molecules for a dataset ${_chemCache.cachedForCol?.name} invalidated`);
  }
  if (includeFingerprints) {
    if (sameColumnAndVersion() && !_chemCache.tanimotoFingerprintsWereIndexed) {
      await getRdKitService().initMorganFingerprints();
      _chemCache.tanimotoFingerprintsWereIndexed = true;
      _chemCache.tanimotoFingerprints = await getRdKitService().getMorganFingerprints();
      console.log(`Morgan fingerprints for a dataset ${_chemCache.cachedForCol?.name} invalidated`);
    }
  }
}

// molStringsColumn and molString can be anything  RDKit supports:
// smiles, cxsmiles, molblock, v3Kmolblock, and inchi;
// see https://github.com/rdkit/rdkit/blob/master/Code/MinimalLib/minilib.h

export async function chemGetSimilarities(
    molStringsColumn: DG.Column, queryMolString = "",
    settings: { [name: string]: any } = {}) {
  await _invalidate(molStringsColumn, queryMolString, true);
  const result = queryMolString.length != 0 ?
    await DG.Column.fromList(DG.COLUMN_TYPE.FLOAT, 'distances',
      await _chemGetSimilarities(queryMolString))  : null;
  return result;
}

export async function chemFindSimilar(
    molStringsColumn: DG.Column, queryMolString = "", settings: { [name: string]: any } = {}) {
  await _invalidate(molStringsColumn, queryMolString, true);
  const result = queryMolString.length != 0 ?
    _chemFindSimilar(molStringsColumn, queryMolString, settings) : null;
  return result;
}

export function chemSubstructureSearchGraph(molStringsColumn: DG.Column, molString: string) {
  const len = molStringsColumn.length;
  let result = DG.BitSet.create(len);
  if (molString.length == 0) {
    return result;
  }
  let subMol = getRdKitModule().get_mol(molString);
  for (let i = 0; i < len; ++i) {
    let item = molStringsColumn.get(i);
    try {
      let mol = getRdKitModule().get_mol(item);
      let match = mol.get_substruct_match(subMol);
      if (match !== "{}")
        result.set(i, true, false);
      mol.delete();
    } catch (e) {
      console.error(
        "Possibly a malformed molString: `" + item + "`");
      // Won't rethrow
    }
  }
  subMol.delete();
  return result;
}

export async function chemSubstructureSearchLibrary(
    molStringsColumn: DG.Column, molString: string, molStringSmarts: string) {
  await _invalidate(molStringsColumn, molString, false);
  let result = DG.BitSet.create(molStringsColumn.length);
  if (molString.length != 0) {
    const matches = await getRdKitService().searchSubstructure(molString, molStringSmarts);
    for (let match of matches)
      result.set(match, true, false);
  }
  return result;
}

export async function chemGetMorganFingerprints(molStringsColumn: DG.Column) {
  await _invalidate(molStringsColumn, null, true);
  const fingerprints = _chemCache.tanimotoFingerprints!;
  return fingerprints;
}

export function chemGetMorganFingerprint(molString: string): BitArray {
  try {
    const mol = getRdKitModule().get_mol(molString);
    const fp = mol.get_morgan_fp(2, 128);
    return rdKitFingerprintToBitArray(fp, 128);
  } catch {
    throw new Error(`Possibly a malformed molString: ${molString}`);
  }
}

