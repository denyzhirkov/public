/* Do not change these import lines to match external modules in webpack configuration */
import * as grok from 'datagrok-api/grok';
import * as ui from 'datagrok-api/ui';
import * as DG from 'datagrok-api/dg';

import * as C from "./utils/constants";
import {getSeparator} from "./utils/misc";
import {ChemPalette} from "./utils/chem-palette";
import {processSequence} from "./utils/cell-renderer";

/**
 * A function that prints a string aligned to left or centered.
 *
 * @param {number} x x coordinate.
 * @param {number} y y coordinate.
 * @param {number} w Width.
 * @param {number} h Height.
 * @param {CanvasRenderingContext2D} g Canvas rendering context.
 * @param {string} s String to print.
 * @param {string} [color=ChemPalette.undefinedColor] String color.
 * @param {number} [pivot=0] Pirvot.
 * @param {boolean} [left=false] Is left aligned.
 * @param {boolean} [hideMod=false] Hide amino acid redidue modifications.
 * @param {number} [transparencyRate=0.0] Transparency rate where 1.0 is fully transparent
 * @return {number} x coordinate to start printing at.
 */
function printLeftOrCentered(
    x: number, y: number, w: number, h: number,
    g: CanvasRenderingContext2D, s: string, color = ChemPalette.undefinedColor,
    pivot: number = 0, left = false, hideMod = false, transparencyRate: number = 1.0,
): number {
  g.textAlign = 'start';
  let colorPart = pivot == -1 ? s.substring(0) : s.substring(0, pivot);
  if (colorPart.length == 1)
    colorPart = colorPart.toUpperCase();

  if (colorPart.length >= 3) {
    if (colorPart.substring(0, 3) in ChemPalette.AAFullNames)
      colorPart = ChemPalette.AAFullNames[s.substring(0, 3)] + colorPart.substring(3);
    else if (colorPart.substring(1, 4) in ChemPalette.AAFullNames)
      colorPart = colorPart[0] + ChemPalette.AAFullNames[s.substring(1, 4)] + colorPart.substring(4);
  }
  let grayPart = pivot == -1 ? '' : s.substring(pivot);
  if (hideMod) {
    let end = colorPart.lastIndexOf(')');
    let beg = colorPart.indexOf('(');
    if (beg > -1 && end > -1 && end - beg > 2)
      colorPart = colorPart.substring(0, beg) + '(+)' + colorPart.substring(end + 1);


    end = grayPart.lastIndexOf(')');
    beg = grayPart.indexOf('(');
    if (beg > -1 && end > -1 && end - beg > 2)
      grayPart = grayPart.substring(0, beg) + '(+)' + grayPart.substring(end + 1);
  }
  const textSize = g.measureText(colorPart + grayPart);
  const indent = 5;

  const colorTextSize = g.measureText(colorPart);
  const dy = (textSize.fontBoundingBoxAscent + textSize.fontBoundingBoxDescent) / 2;

  function draw(dx1: number, dx2: number): void {
    g.fillStyle = color;
    g.globalAlpha = transparencyRate;
    g.fillText(colorPart, x + dx1, y + dy);
    g.fillStyle = ChemPalette.undefinedColor;
    g.fillText(grayPart, x + dx2, y + dy);
  }


  if (left || textSize.width > w) {
    draw(indent, indent + colorTextSize.width);
    return x + colorTextSize.width + g.measureText(grayPart).width;
  } else {
    const dx = (w - textSize.width) / 2;
    draw(dx, dx + colorTextSize.width);
    return x + dx + colorTextSize.width;
  }
}
export class MacromoleculeSequenceCellRenderer extends DG.GridCellRenderer {
  constructor() {
    super();
  }

  get name(): string {return 'alignedSequenceCR';}

  get cellType(): string {return C.SEM_TYPES.ALIGNED_SEQUENCE;}

  get defaultHeight(): number {return 30;}

  get defaultWidth(): number {return 230;}

  /**
   * Cell renderer function.
   *
   * @param {CanvasRenderingContext2D} g Canvas rendering context.
   * @param {number} x x coordinate on the canvas.
   * @param {number} y y coordinate on the canvas.
   * @param {number} w width of the cell.
   * @param {number} h height of the cell.
   * @param {DG.GridCell} gridCell Grid cell.
   * @param {DG.GridCellStyle} cellStyle Cell style.
   * @memberof AlignedSequenceCellRenderer
   */
  render(
      g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, gridCell: DG.GridCell,
      cellStyle: DG.GridCellStyle,
  ): void {
    const grid = gridCell.grid;
    const cell = gridCell.cell;
    w = grid ? Math.min(grid.canvas.width - x, w) : g.canvas.width - x;
    g.save();
    g.beginPath();
    g.rect(x, y, w, h);
    g.clip();
    g.font = '12px monospace';
    g.textBaseline = 'top';
    const s: string = cell.value ?? '';

    //TODO: can this be replaced/merged with splitSequence?
    const subParts = s.split(getSeparator(cell.column));
    const [text, simplified] = processSequence(subParts);
    const textSize = g.measureText(text.join(''));
    let x1 = Math.max(x, x + (w - textSize.width) / 2);

    subParts.forEach((amino, index) => {
      let [color, outerAmino,, pivot] = ChemPalette.getColorAAPivot(amino);
      g.fillStyle = ChemPalette.undefinedColor;
      if (index + 1 < subParts.length) {
        const gap = simplified ? '' : ' ';
        outerAmino += `${outerAmino ? '' : '-'}${gap}`;
      }
      x1 = printLeftOrCentered(x1, y, w, h, g, outerAmino, color, pivot, true);
    });

    g.restore();
  }
}

//name: macromoleculeSequenceCellRenderer2
//tags: cellRenderer
//meta.cellType: Macromolecule
//output: grid_cell_renderer result
export function macromoleculeSequenceCellRenderer(): MacromoleculeSequenceCellRenderer {
  return new MacromoleculeSequenceCellRenderer();
}



import {WebLogo, SeqColStats} from '@datagrok-libraries/bio/src/viewers/web-logo';
import {VdRegionsViewer} from './viewers/vd-regions-viewer';
import {runKalign, testMSAEnoughMemory} from './utils/multiple-sequence-alignment';
import {SequenceAlignment, Aligned} from './seq_align';
import {Nucleotides} from '@datagrok-libraries/bio/src/nucleotides';
import {Aminoacids} from '@datagrok-libraries/bio/src/aminoacids';
import {convert} from './utils/convert';
import {getEmbeddingColsNames, sequenceSpace} from './utils/sequence-space';
import {AvailableMetrics} from '@datagrok-libraries/ml/src/typed-metrics';
import {getActivityCliffs} from '@datagrok-libraries/ml/src/viewers/activity-cliffs';
import {sequenceGetSimilarities, drawTooltip} from './utils/sequence-activity-cliffs';
import { getMolfilesFromSeq, HELM_CORE_LIB_FILENAME } from './utils/utils';
import {getMacroMol} from './utils/atomic-works';




//name: sequenceAlignment
//input: string alignType {choices: ['Local alignment', 'Global alignment']}
// eslint-disable-next-line max-len
//input: string alignTable {choices: ['AUTO', 'NUCLEOTIDES', 'BLOSUM45', 'BLOSUM50','BLOSUM62','BLOSUM80','BLOSUM90','PAM30','PAM70','PAM250','SCHNEIDER','TRANS']}
//input: double gap
//input: string seq1
//input: string seq2
//output: object res
export function sequenceAlignment(alignType: string, alignTable: string, gap: number, seq1: string, seq2: string) {
  const toAlign = new SequenceAlignment(seq1, seq2, gap, alignTable);
  const res = alignType == 'Local alignment' ? toAlign.smithWaterman() : toAlign.needlemanWunch();
  return res;
}

//name: WebLogo
//description: WebLogo viewer
//tags: viewer, panel
//output: viewer result
export function webLogoViewer() {
  return new WebLogo();
}

//name: VdRegions
//description: V-Domain regions viewer
//tags: viewer, panel
//output: viewer result
export function vdRegionViewer() {
  return new VdRegionsViewer();
}

//top-menu: Bio | Sequence Activity Cliffs...
//name: Sequence Activity Cliffs
//description: detect activity cliffs
//input: dataframe table [Input data table]
//input: column sequence {semType: Macromolecule}
//input: column activities
//input: double similarity = 80 [Similarity cutoff]
//input: string methodName { choices:["UMAP", "t-SNE", "SPE"] }
export async function activityCliffs(df: DG.DataFrame, sequence: DG.Column, activities: DG.Column,
  similarity: number, methodName: string): Promise<void> {
  const axesNames = getEmbeddingColsNames(df);
  const options = {
    'SPE': {cycles: 2000, lambda: 1.0, dlambda: 0.0005},
  };
  const units = sequence!.tags[DG.TAGS.UNITS];
  await getActivityCliffs(
    df,
    sequence,
    axesNames,
    'Activity cliffs',
    activities,
    similarity,
    'Levenshtein',
    methodName,
    DG.SEMTYPE.MACROMOLECULE,
    units,
    sequenceSpace,
    sequenceGetSimilarities,
    drawTooltip,
    (options as any)[methodName]);
}

//top-menu: Bio | Sequence Space...
//name: Sequence Space
//input: dataframe table
//input: column macroMolecule { semType: Macromolecule }
//input: string methodName { choices:["UMAP", "t-SNE", "SPE"] }
//input: string similarityMetric { choices:["Levenshtein", "Tanimoto"] }
//input: bool plotEmbeddings = true
export async function sequenceSpaceTopMenu(table: DG.DataFrame, macroMolecule: DG.Column, methodName: string,
  similarityMetric: string = 'Levenshtein', plotEmbeddings: boolean): Promise<void> {
  const embedColsNames = getEmbeddingColsNames(table);
  const chemSpaceParams = {
    seqCol: macroMolecule,
    methodName: methodName,
    similarityMetric: similarityMetric,
    embedAxesNames: embedColsNames
  };
  const sequenceSpaceRes = await sequenceSpace(chemSpaceParams);
  const embeddings = sequenceSpaceRes.coordinates;
  for (const col of embeddings)
    table.columns.add(col);
  if (plotEmbeddings) {
    for (const v of grok.shell.views) {
      if (v.name === table.name)
        (v as DG.TableView).scatterPlot({x: embedColsNames[0], y: embedColsNames[1], title: 'Sequence space'});
    }
  }
};

//top-menu: Bio | Molfiles From HELM...
//name: Molfiles From HELM
//description: returns molfiles for each monomer from HELM library
//input: dataframe df [Input data table]
//input: column sequence {semType: Macromolecule}
export async function molfilesFromHELM(df: DG.DataFrame, sequence: DG.Column): Promise<void> {
  const _package = new DG.Package();
  const monomersLibFile = await _package.files.readAsText(HELM_CORE_LIB_FILENAME);
  const monomersLibObject: any[] = JSON.parse(monomersLibFile);
  const atomicCodes = getMolfilesFromSeq(sequence, monomersLibObject);

  let result: string[] = [];
  for(let i = 0; i < atomicCodes!.length; i++)
    result.push(getMacroMol(atomicCodes![i]));

  df.columns.add(DG.Column.fromStrings('regenerated', result));
}


//top-menu: Bio | MSA...
//name: MSA
//input: dataframe table
//input: column sequence { semType: Macromolecule }
export async function multipleSequenceAlignmentAny(table: DG.DataFrame, col: DG.Column): Promise<void> {
  const msaCol = await runKalign(col, false);
  table.columns.add(msaCol);
}

//name: Composition Analysis
//top-menu: Bio | Composition Analysis
//output: viewer result
export async function compositionAnalysis(): Promise<void> {
  // Higher priority for columns with MSA data to show with WebLogo.
  const tv = grok.shell.tv;
  const df = tv.dataFrame;
  const semTypeColList = df.columns.bySemTypeAll(DG.SEMTYPE.MACROMOLECULE);
  let col: DG.Column | undefined = semTypeColList.find((col) => {
    const units = col.getTag(DG.TAGS.UNITS);
    return units ? units.indexOf('MSA') !== -1 : false;
  });
  if (!col)
    col = semTypeColList[0];

  if (!col) {
    grok.shell.error('Current table does not contain sequences');
    return;
  }

  tv.addViewer('WebLogo', {sequenceColumnName: col.name});
}

// helper function for importFasta
function parseMacromolecule(
  fileContent: string,
  startOfSequence: number,
  endOfSequence: number
): string {
  const seq = fileContent.slice(startOfSequence, endOfSequence);
  const seqArray = seq.split(/\s/);
  return seqArray.join('');
}

//name: importFasta
//description: Opens FASTA file
//tags: file-handler
//meta.ext: fasta, fna, ffn, faa, frn, fa
//input: string fileContent
//output: list tables
export function importFasta(fileContent: string): DG.DataFrame [] {
  const regex = /^>(.*)$/gm; // match lines starting with >
  const descriptionsArray = [];
  const sequencesArray: string[] = [];
  let startOfSequence = 0;
  let match; // match.index is the beginning of the matched line
  while (match = regex.exec(fileContent)) {
    const description = fileContent.substring(match.index + 1, regex.lastIndex);
    descriptionsArray.push(description);
    if (startOfSequence !== 0)
      sequencesArray.push(parseMacromolecule(fileContent, startOfSequence, match.index));
    startOfSequence = regex.lastIndex + 1;
  }
  sequencesArray.push(parseMacromolecule(fileContent, startOfSequence, -1));
  const descriptionsArrayCol = DG.Column.fromStrings('description', descriptionsArray);
  const sequenceCol = DG.Column.fromStrings('sequence', sequencesArray);
  sequenceCol.semType = 'Macromolecule';

  const stats: SeqColStats = WebLogo.getStats(sequenceCol, 5, WebLogo.splitterAsFasta);
  const seqType = stats.sameLength ? 'SEQ.MSA' : 'SEQ';
  const alphabetCandidates: [string, Set<string>][] = [
    ['NT', new Set(Object.keys(Nucleotides.Names))],
    ['PT', new Set(Object.keys(Aminoacids.Names))],
  ];
  // Calculate likelihoods for alphabet_candidates
  const alphabetCandidatesSim: number[] = alphabetCandidates.map(
    (c) => WebLogo.getAlphabetSimilarity(stats.freq, c[1]));
  const maxCos = Math.max(...alphabetCandidatesSim);
  const alphabet = maxCos > 0.65 ? alphabetCandidates[alphabetCandidatesSim.indexOf(maxCos)][0] : 'UN';
  sequenceCol.semType = DG.SEMTYPE.MACROMOLECULE;
  const units: string = `fasta:${seqType}:${alphabet}`;
  sequenceCol.setTag(DG.TAGS.UNITS, units);

  return [DG.DataFrame.fromColumns([
    descriptionsArrayCol,
    sequenceCol,
  ])];
}

//name: Bio | Convert
//friendly-name: Bio | Convert
//tags: panel, bio
//input: column col {semType: Macromolecule}
export function convertPanel(col: DG.Column): void {
  convert(col);
}
