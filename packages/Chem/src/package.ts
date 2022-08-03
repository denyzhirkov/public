import * as grok from 'datagrok-api/grok';
import {chem} from 'datagrok-api/grok';
import * as ui from 'datagrok-api/ui';
import * as DG from 'datagrok-api/dg';
import {getMolColumnPropertyPanel} from './panels/chem-column-property-panel';
import * as chemSearches from './chem-searches';
import {SubstructureFilter} from './widgets/chem-substructure-filter';
import {GridCellRendererProxy, RDKitCellRenderer} from './rendering/rdkit-cell-renderer';
import {drugLikenessWidget} from './widgets/drug-likeness';
import {molfileWidget} from './widgets/molfile';
import {propertiesWidget} from './widgets/properties';
import {structuralAlertsWidget} from './widgets/structural-alerts';
import {structure2dWidget} from './widgets/structure2d';
import {structure3dWidget} from './widgets/structure3d';
import {toxicityWidget} from './widgets/toxicity';
import {chemSpace, getEmbeddingColsNames} from './analysis/chem-space';
import {drawTooltip} from './analysis/activity-cliffs';
import {getDescriptorsApp, getDescriptorsSingle} from './descriptors/descriptors-calculation';
import {addInchiKeys, addInchis} from './panels/inchi';
import {addMcs} from './panels/find-mcs';
import * as chemCommonRdKit from './utils/chem-common-rdkit';
import {_rdKitModule} from './utils/chem-common-rdkit';
import {rGroupAnalysis} from './analysis/r-group-analysis';
import {identifiersWidget} from './widgets/identifiers';
import {convertMoleculeImpl, isMolBlock, MolNotation, molToMolblock} from './utils/chem-utils';
import '../css/chem.css';
import {ChemSimilarityViewer} from './analysis/chem-similarity-viewer';
import {ChemDiversityViewer} from './analysis/chem-diversity-viewer';
import {_saveAsSdf} from './utils/sdf-utils';
import {Fingerprint} from './utils/chem-common';
import {assure} from '@datagrok-libraries/utils/src/test';
import {OpenChemLibSketcher} from './open-chem/ocl-sketcher';
import {_importSdf} from './open-chem/sdf-importer';
import {OCLCellRenderer} from './open-chem/ocl-cell-renderer';
import {RDMol} from './rdkit-api';
import Sketcher = chem.Sketcher;
import { Viewer } from 'datagrok-api/dg';
import { getActivityCliffs } from '@datagrok-libraries/ml/src/viewers/activity-cliffs';

const drawMoleculeToCanvas = chemCommonRdKit.drawMoleculeToCanvas;

/**
* Usage:
* let a = await grok.functions.call('Chem:getRdKitModule');
* let b = a.get_mol('C1=CC=CC=C1');
* alert(b.get_pattern_fp());
**/

//name: getRdKitModule
//output: object module
export function getRdKitModule() {
  return chemCommonRdKit.getRdKitModule();
}

export const _package: DG.Package = new DG.Package();
export let _properties: any;

let _rdRenderer: RDKitCellRenderer;
export let renderer: GridCellRendererProxy;
let _renderers: Map<string, DG.GridCellRenderer>;

//tags: init
export async function initChem(): Promise<void> {
  chemCommonRdKit.setRdKitWebRoot(_package.webRoot);
  await chemCommonRdKit.initRdKitModuleLocal();
  _properties = await _package.getProperties();
  _rdRenderer = new RDKitCellRenderer(getRdKitModule());
  renderer = new GridCellRendererProxy(_rdRenderer, 'Molecule');
  _renderers = new Map();
}

//tags: autostart
export async function initChemAutostart(): Promise<void> { }

//name: SubstructureFilter
//description: RDKit-based substructure filter
//tags: filter
//output: filter result
//meta.semType: Molecule
export function substructureFilter(): SubstructureFilter {
  return new SubstructureFilter();
}

//name: canvasMol
//input: int x
//input: int y
//input: int w
//input: int h
//input: object canvas
//input: string molString
//input: string scaffoldMolString
export function canvasMol(
  x: number, y: number, w: number, h: number, canvas: HTMLCanvasElement,
  molString: string, scaffoldMolString: string | null = null): void {
  drawMoleculeToCanvas(x, y, w, h, canvas, molString, scaffoldMolString == '' ? null : scaffoldMolString);
}


//name: getCLogP
//input: string smiles {semType: Molecule}
//output: double cLogP
export function getCLogP(smiles: string): number {
  const mol = getRdKitModule().get_mol(smiles);
  const res = JSON.parse(mol.get_descriptors()).CrippenClogP;
  mol?.delete();
  return res;
}

//name: rdKitCellRenderer
//output: grid_cell_renderer result
//meta.chemRendererName: RDKit
export async function rdKitCellRenderer(): Promise<RDKitCellRenderer> {
  return new RDKitCellRenderer(getRdKitModule());
}

//name: chemCellRenderer
//tags: cellRenderer, cellRenderer-Molecule
//meta.cellType: Molecule
//meta-cell-renderer-sem-type: Molecule
//output: grid_cell_renderer result
export async function chemCellRenderer(): Promise<DG.GridCellRenderer> {
  const renderer = _properties.Renderer ?? 'RDKit';
  if (!_renderers.has(renderer)) {
    const renderFunctions = DG.Func.find({meta: {chemRendererName: renderer}});
    if (renderFunctions.length > 0) {
      const r = await renderFunctions[0].apply();
      _renderers.set(_properties.Renderer, r);
      return r;
    }
  }

  renderer.renderer = renderer ?? renderer.renderer;
  return renderer;
}

//name: getMorganFingerprints
//input: column molColumn {semType: Molecule}
//output: column result [fingerprints]
export async function getMorganFingerprints(molColumn: DG.Column): Promise<DG.Column<any>> {
  assure.notNull(molColumn, 'molColumn');

  try {
    const fingerprints = await chemSearches.chemGetFingerprints(molColumn, Fingerprint.Morgan);
    const fingerprintsBitsets: DG.BitSet[] = [];
    for (let i = 0; i < fingerprints.length; ++i) {
      //@ts-ignore
      const fingerprint = DG.BitSet.fromBytes(fingerprints[i].getRawData().buffer, fingerprints[i].length);
      fingerprintsBitsets.push(fingerprint);
    }
    return DG.Column.fromList('object', 'fingerprints', fingerprintsBitsets);
  } catch (e: any) {
    console.error('Chem | Catch in getMorganFingerprints: ' + e.toString());
    throw e;
  }
}

//name: getMorganFingerprint
//input: string molString {semType: Molecule}
//output: object fingerprintBitset [Fingerprints]
export function getMorganFingerprint(molString: string): DG.BitSet {
  const bitArray = chemSearches.chemGetFingerprint(molString, Fingerprint.Morgan);
  //@ts-ignore
  return DG.BitSet.fromBytes(bitArray.getRawData().buffer, bitArray.length);
}

//name: getSimilarities
//input: column molStringsColumn
//input: string molString
//output: dataframe result
export async function getSimilarities(molStringsColumn: DG.Column, molString: string): Promise<DG.DataFrame> {
  try {
    const result = await chemSearches.chemGetSimilarities(molStringsColumn, molString);
    return result ? DG.DataFrame.fromColumns([result as DG.Column]) : DG.DataFrame.create();
  } catch (e: any) {
    console.error('Chem | Catch in getSimilarities: ' + e.toString());
    throw e;
  }
}

//name: findSimilar
//input: column molStringsColumn
//input: string molString
//input: int limit
//input: int cutoff
//output: dataframe result
export async function findSimilar(molStringsColumn: DG.Column, molString: string, limit: number, cutoff: number)
  : Promise<DG.DataFrame> {
  assure.notNull(molStringsColumn, 'molStringsColumn');
  assure.notNull(molString, 'molString');
  assure.notNull(limit, 'limit');
  assure.notNull(cutoff, 'cutoff');

  try {
    const result = await chemSearches.chemFindSimilar(molStringsColumn, molString, {limit: limit, cutoff: cutoff});
    return result ? result : DG.DataFrame.create();
  } catch (e: any) {
    console.error('Chem | In findSimilar: ' + e.toString());
    throw e;
  }
}

//name: searchSubstructure
//input: column molStringsColumn
//input: string molString
//input: bool substructLibrary
//input: string molBlockFailover
//output: column result
export async function searchSubstructure(
  molStringsColumn: DG.Column, molString: string,
  substructLibrary: boolean, molBlockFailover: string) : Promise<DG.Column<any>> {
  assure.notNull(molStringsColumn, 'molStringsColumn');
  assure.notNull(molString, 'molString');
  assure.notNull(substructLibrary, 'substructLibrary');
  assure.notNull(molBlockFailover, 'molBlockFailover');

  try {
    const result =
      substructLibrary ?
        await chemSearches.chemSubstructureSearchLibrary(molStringsColumn, molString, molBlockFailover) :
        chemSearches.chemSubstructureSearchGraph(molStringsColumn, molString);
    return DG.Column.fromList('object', 'bitset', [result]); // TODO: should return a bitset itself
  } catch (e: any) {
    console.error('Chem | In substructureSearch: ' + e.toString());
    throw e;
  }
}

//name: Descriptors App
//tags: app
export function descriptorsApp(): void {
  getDescriptorsApp();
}

//name: saveAsSdf
//description: Save as SDF
//tags: fileExporter
export function saveAsSdf(): void {
  _saveAsSdf();
}

//#region Top menu

//top-menu: Chem | Activity Cliffs...
//name: Activity Cliffs
//description: detect activity cliffs
//input: dataframe table [Input data table]
//input: column smiles {type:categorical; semType: Molecule} [Molecules, in SMILES format]
//input: column activities
//input: double similarity = 80 [Similarity cutoff]
//input: string methodName { choices:["UMAP", "t-SNE", "SPE"] }
export async function activityCliffs(df: DG.DataFrame, smiles: DG.Column, activities: DG.Column,
  similarity: number, methodName: string) : Promise<void> {
 const axesNames = getEmbeddingColsNames(df);
 const options = {
  'SPE': {cycles: 2000, lambda: 1.0, dlambda: 0.0005},
};
 await getActivityCliffs(
  df, 
  smiles,
  null as any, 
  axesNames,
  'Activity cliffs',
  activities, 
  similarity, 
  'Tanimoto',
  methodName,
  DG.SEMTYPE.MOLECULE,
  'smiles',
  chemSpace,
  chemSearches.chemGetSimilarities,
  drawTooltip,
  (options as any)[methodName]);
}

//top-menu: Chem | Chemical Space...
//name: Chem Space
//input: dataframe table
//input: column smiles { semType: Molecule }
//input: string methodName { choices:["UMAP", "t-SNE", "SPE"] }
//input: string similarityMetric { choices:["Tanimoto", "Asymmetric", "Cosine", "Sokal"] }
//input: bool plotEmbeddings = true
export async function chemSpaceTopMenu(table: DG.DataFrame, smiles: DG.Column, methodName: string,
  similarityMetric: string = 'Tanimoto', plotEmbeddings: boolean) : Promise<void> {

    const embedColsNames = getEmbeddingColsNames(table);
    const chemSpaceParams = {
      seqCol: smiles,
      methodName: methodName,
      similarityMetric: similarityMetric,
      embedAxesNames: embedColsNames
    }
    const chemSpaceRes = await chemSpace(chemSpaceParams);
    const embeddings = chemSpaceRes.coordinates;
    for (const col of embeddings)
      table.columns.add(col);
    if (plotEmbeddings) {
      for (let v of grok.shell.views) {
        if (v.name === table.name)
          (v as DG.TableView).scatterPlot({x: embedColsNames[0], y: embedColsNames[1], title: 'Chem space'});
      }
    }
  };

//name: R-Groups Analysis
//top-menu: Chem | R-Groups Analysis...
export function rGroupsAnalysisMenu(): void {
  const col = grok.shell.t.columns.bySemType(DG.SEMTYPE.MOLECULE);
  if (col === null) {
    grok.shell.error('Current table does not contain molecules');
    return;
  }
  rGroupAnalysis(col);
}

//#endregion

//#region Molecule column property panel

//name: Chem | Find MCS
//friendly-name: Chem | Find MCS
//tags: panel, chem
//input: column col {semType: Molecule}
export function addMcsPanel(col: DG.Column): void {
  addMcs(col);
}

//name: Chem | To InchI
//friendly-name: Chem | To InchI
//tags: panel, chem
//input: column col {semType: Molecule}
export function addInchisPanel(col: DG.Column): void {
  addInchis(col);
}

//name: Chem | To InchI Keys
//friendly-name: Chem | To InchI Keys
//tags: panel, chem
//input: column col {semType: Molecule}
export function addInchisKeysPanel(col: DG.Column): void {
  addInchiKeys(col);
}

//name: Chem
//input: column molColumn {semType: Molecule}
//tags: panel
//output: widget result
export function molColumnPropertyPanel(molColumn: DG.Column): DG.Widget {
  return getMolColumnPropertyPanel(molColumn);
}

//name: Chem Descriptors
//tags: panel, chem, widgets
//input: string smiles { semType: Molecule }
//output: widget result
export function descriptorsWidget(smiles: string): DG.Widget {
  return getDescriptorsSingle(smiles);
}

//name: Drug Likeness
//description: Drug Likeness score, with explanations on molecule fragments contributing to the score. OCL.
//help-url: /help/domains/chem/info-panels/drug-likeness.md
//tags: panel, chem, widgets
//input: string smiles { semType: Molecule }
//output: widget result
export function drugLikeness(smiles: string): DG.Widget {
  return smiles ? drugLikenessWidget(smiles) : new DG.Widget(ui.divText('SMILES is empty'));
}

//name: Molfile
//description: Molecule as Molfile
//tags: panel, chem, widgets
//input: string smiles { semType: Molecule }
//output: widget result
export function molfile(smiles: string): DG.Widget {
  return smiles ? molfileWidget(smiles) : new DG.Widget(ui.divText('SMILES is empty'));
}

//name: Properties
//description: Basic molecule properties
//tags: panel, chem, widgets
//input: string smiles { semType: Molecule }
//output: widget result
export async function properties(smiles: string): Promise<DG.Widget> {
  return smiles ? propertiesWidget(smiles) : new DG.Widget(ui.divText('SMILES is empty'));
}

//name: Structural Alerts
//description: Screening drug candidates against structural alerts i.e. fragments associated to a toxicological response
//help-url: /help/domains/chem/info-panels/structural-alerts.md
//tags: panel, chem, widgets
//input: string smiles { semType: Molecule }
//output: widget result
export async function structuralAlerts(smiles: string): Promise<DG.Widget> {
  return smiles ? structuralAlertsWidget(smiles) : new DG.Widget(ui.divText('SMILES is empty'));
}

//name: Structure 2D
//description: 2D molecule representation
//tags: panel, chem, widgets
//input: string smiles { semType: Molecule }
//output: widget result
export function structure2d(smiles: string): DG.Widget {
  return smiles ? structure2dWidget(smiles) : new DG.Widget(ui.divText('SMILES is empty'));
}

//name: Structure 3D
//description: 3D molecule representation
//tags: panel, chem, widgets
//input: string smiles { semType: Molecule }
//output: widget result
export async function structure3d(smiles: string): Promise<DG.Widget> {
  if (isMolBlock(smiles)) {
    const mol = getRdKitModule().get_mol(smiles);
    smiles = mol.get_smiles();
    mol?.delete();
  }

  return smiles ? structure3dWidget(smiles) : new DG.Widget(ui.divText('SMILES is empty'));
}

//name: Toxicity
//description: Toxicity prediction. Calculated by openchemlib
//help-url: /help/domains/chem/info-panels/toxicity-risks.md
//tags: panel, chem, widgets
//input: string smiles { semType: Molecule }
//output: widget result
export function toxicity(smiles: string): DG.Widget {
  return smiles ? toxicityWidget(smiles) : new DG.Widget(ui.divText('SMILES is empty'));
}

//name: Identifiers
//tags: panel, chem, widgets
//input: string smiles { semType: Molecule }
//output: widget result
export async function identifiers(smiles: string): Promise<DG.Widget> {
  return smiles ? await identifiersWidget(smiles) : new DG.Widget(ui.divText('SMILES is empty'));
}

//name: convertMolecule
//tags: unitConverter
//input: string molecule {semType: Molecule}
//input: string from {choices:["smiles", "molblock", "inchi", "v3Kmolblock"]}
//input: string to {choices:["smiles", "molblock", "inchi", "v3Kmolblock"]}
//output: string result {semType: Molecule}
export function convertMolecule(molecule: string, from: string, to: string): string {
  return convertMoleculeImpl(molecule, from as MolNotation, to as MolNotation, getRdKitModule());
}


//tags: cellEditor
//description: Molecule
//input: grid_cell cell
export async function editMoleculeCell(cell: DG.GridCell): Promise<void> {
  const sketcher = new Sketcher();
  const unit = cell.cell.column.tags[DG.TAGS.UNITS];

  let molecule = ''
  if(unit == 'smiles'){
    const mol = (await grok.functions.call('Chem:getRdKitModule')).get_mol(cell.cell.value);
        if (!mol.has_coords())
          mol.set_new_coords();
        mol.normalize_depiction();
        mol.straighten_depiction();
        molecule = mol.get_molblock();
  } else {
    molecule = cell.cell.value;
  }
  sketcher.setMolFile(molecule)
  ui.dialog()
    .add(sketcher)
    .onOK(() => {
      cell.cell.value = unit == 'molblock' ? sketcher.getMolFile() : sketcher.getSmiles();
      Sketcher.addRecent(sketcher.getMolFile());
    })
    .show();
}

//name: SimilaritySearchViewer
//tags: viewer
//output: viewer result
export function similaritySearchViewer(): ChemSimilarityViewer {
  return new ChemSimilarityViewer();
}

//top-menu: Chem | Similarity Search...
//name: similaritySearch
//description: finds the most similar molecule
//output: viewer result
export function similaritySearchTopMenu(): void {
  (grok.shell.v as DG.TableView).addViewer('SimilaritySearchViewer');
}

//name: DiversitySearchViewer
//tags: viewer
//output: viewer result
export function diversitySearchViewer(): ChemDiversityViewer {
  return new ChemDiversityViewer();
}

//top-menu: Chem | Diversity Search...
//name: diversitySearch
//description: finds the most diverse molecules
//output: viewer result
export function diversitySearchTopMenu() {
  (grok.shell.v as DG.TableView).addViewer('DiversitySearchViewer');
}

//name: inchiToSmiles
//input: string id
//output: string smiles {semType: Molecule}
//meta.role: converter
//meta.inputRegexp: (InChI\=.+)
export async function inchiToSmiles(id: string) {
  const mol = getRdKitModule().get_mol(id);
  return mol.get_smiles();
}

//name: Open Chem Sketcher
//tags: moleculeSketcher
//output: widget sketcher
export function openChemLibSketcher(): OpenChemLibSketcher {
  return new OpenChemLibSketcher();
}

//name: importSdfs
//description: Opens SDF file
//tags: file-handler
//meta.ext: sdf,mol
//input: list bytes
//output: list tables
export function importSdf(bytes: Uint8Array): DG.DataFrame[] {
  return _importSdf(Uint8Array.from(bytes));
}

//name: importMol
//description: Opens MOL file
//tags: file-handler
//meta.ext: mol
//input: string content
//output: list tables
export function importMol(content: string): DG.DataFrame[] {
  const molCol = DG.Column.string('molecule', 1).init((_) => content);
  return [DG.DataFrame.fromColumns([molCol])];
}

//name: oclCellRenderer
//output: grid_cell_renderer result
//meta.chemRendererName: OpenChemLib
export async function oclCellRenderer(): Promise<OCLCellRenderer> {
  return new OCLCellRenderer();
}

//name: Use as filter
//description: Adds this structure as a substructure filter
//meta.action: Use as filter
//input: string mol { semType: Molecule }
export function useAsSubstructureFilter(mol: string): void {
  const tv = grok.shell.tv;
  if (tv == null)
    // eslint-disable-next-line no-throw-literal
    throw 'Requires an open table view.';

  const molCol = tv.dataFrame.columns.bySemType(DG.SEMTYPE.MOLECULE);
  if (molCol == null)
    // eslint-disable-next-line no-throw-literal
    throw 'Molecule column not found.';

  /*
  tv.getFiltersGroup({createDefaultFilters: false}).add({
    type: FILTER_TYPE.SUBSTRUCTURE,
    column: molCol.name,
    columnName: molCol.name,
    molBlock: molToMolblock(mol, getRdKitModule())
  });
   */
}

//name: detectSmiles
//input: column col
//input: int min
export function detectSmiles(col: DG.Column, min: number) {
  function isSmiles(s: string) {
    let d: RDMol | null = null;
    try {
      d = _rdKitModule.get_mol(s);
      return true;
    } catch {
      return false;
    } finally {
      d?.delete();
    }
  }

  if (DG.Detector.sampleCategories(col, isSmiles, min, 10, 0.8)) {
    col.tags[DG.TAGS.UNITS] = DG.UNITS.Molecule.SMILES;
    col.semType = DG.SEMTYPE.MOLECULE;
  }
}
