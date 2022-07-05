/* Do not change these import lines to match external modules in webpack configuration */
import * as grok from 'datagrok-api/grok';
import * as ui from 'datagrok-api/ui';
import * as DG from 'datagrok-api/dg';
import { Column, DataFrame } from 'datagrok-api/dg';
////import SmartLabel from 'fusioncharts-smartlabel/dist/fusioncharts-smartlabel';
//import * as DG from 'node_modules/fusioncharts-smartlabel';
//import { DataFrame } from 'datagrok-api/dg';
//import {ElementOptions} from 'datagrok-api/src/const';  //we can import it from DG instead

export const _package = new DG.Package();

//EXCERCISE 7
//name: testENASwagger
export async function testENASwagger() {
  const data = await grok.data.query('maximsequence:PerformATextSearchAndDownloadDataInXMLFormat',
    {'query': 'coronavirus', 'result': 'assembly'});
  grok.shell.addTableView(data);
}

//EXCERCISE 6
class SmartLabel {
  stringsArr: string[];
  addEllipses: boolean = false;
  fontsize: number = 12;
  symbinrow: number = 5;
  numofrows: number = 1;

  public get value() : number {
    return this.fontsize;
  }
  public set value(v : number) {
    this.fontsize = v;
  }

  constructor(id?: string, elipsable?: boolean) {
    this.stringsArr = [];
    if (typeof elipsable === 'boolean') this.addEllipses = elipsable;
  }

  //textToLines(strsrc: string, w: number, h: number, fontsize: number, needdash: boolean = false): Array<string> {
  getSmartText(strsrc: string, w: number, h: number, needdash: boolean = false): Array<string> {
    const symbwidth: number = this.fontsize/1.2;
    const symbheight: number = this.fontsize*1.2;
    const symbinrow: number = Math.round(w/symbwidth);
    const numofrows: number = Math.round(h/symbheight);
    let strs = strsrc;

    let brakeIndex: number = strs.length;
    let eostr: boolean = false;

    while (!eostr) {
      for (let i = 0; i < strs.length; i++) {
        if ((strs.charAt(i) == ' ') && (i < symbinrow)) brakeIndex = i;
        if ((i >= symbinrow) || (i >= strs.length-1)) {
          if (brakeIndex < Math.round(symbinrow-symbinrow/4)) brakeIndex = symbinrow;
          break;
        }
      }
      if (brakeIndex > symbinrow) brakeIndex = symbinrow;

      this.stringsArr.push(strs.slice(0, brakeIndex));
      if (brakeIndex+1 <= strs.length) strs = strs.substring(brakeIndex+1);
      else eostr = true;
      if (strs.length <= symbinrow) {
        this.stringsArr.push(strs);
        eostr = true;
      }
      if (this.stringsArr.length >= numofrows) {
        strs = this.stringsArr[this.stringsArr.length-1];
        if ((strs.length >= symbinrow) && (strs.length > 4))
          strs = strs.slice(0, strs.length-4);
        strs = strs.concat('...');
        this.stringsArr[this.stringsArr.length-1] = strs;
        eostr = true;
      }
    }

    return this.stringsArr;
  }
}

class NucleotideBoxCellRenderer extends DG.GridCellRenderer {
  get name() { return 'Nucleotide cell renderer'; }
  get cellType() { return 'dna_nucleotide'; }
  render(
    g: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number,
    gridCell: DG.GridCell, cellStyle: DG.GridCellStyle
  ) {
    const seq = gridCell.cell.value;
    const sl = new SmartLabel('id', true);
    /*sl.setStyle({
      'font-size': '10px',
      'font-family': 'courier'});

    const labelObj = SmartLabel.textToLines(sl.getSmartText(seq, w, h));
    */
    sl.fontsize = 12;
    const labelObj = sl.getSmartText(seq, w, h);

    const ctx = g.canvas.getContext('2d');
    if (ctx != null) {
      g.fillStyle = 'black';
      //ctx.fillRect(x+1, y+1, w-1, h-1);
      g.font = '12px arial';
      //ctx.clearRect(x, y, w, h);
      //g.fillText(seq, x+1, y+1);

      for (let i = 0; i < labelObj.length; i++)
        ctx.fillText(labelObj[i], x+1, y+1+i*sl.fontsize);

      g.fillStyle = 'red';
      ctx.rect(x, y, x+10, y+12);
      // const lines = labelObj.lines;
      // for (let i = 0; i < lines.length; i++)
      //   ctx.fillText(labelObj, x+1, y+1);
    } else grok.shell.info('ctx == null');
  }

}

//name: nucleotideBoxCellRenderer
//tags: cellRenderer
//meta.cellType: dna_nucleotide
//output: grid_cell_renderer result
export function nucleotideBoxCellRenderer() {
  return new NucleotideBoxCellRenderer();
}

//EXCERCISE 5
//name: fuzzyJoin
//input: dataframe df1
//input: dataframe df2
//input: int N
export function fuzzyJoin(df1: DataFrame, df2: DataFrame, N: number): void {
  const semTypeName = 'dna_nucleotide';
  const col1 = df1.columns.bySemType(semTypeName); //let col1: Column<any>;
  const col2 = df2.columns.bySemType(semTypeName); //let col2: Column<any>;
  let strSearchSequenceVocab: string = ''; //string where we take subsequences for search
  let rowFromCount: number = 0;
  let rowToCount: number = 0;
  let subsecCnt: number = 0;

  if (!col1 || !col2) {
    grok.shell.error('At least one table does not have '+ semTypeName + ' column');
    return;
  }

  const timeStart = Date.now(); //performance measurement
  const df = df1.append(df2, false);
  const colCount = df.columns.addNewInt('Counts ('+N+')');
  df.name = 'fuzzyJoin(' +df1.name+', '+df2.name+', '+N+ ')';

  rowFromCount = col1.length;
  rowToCount = 0;
  for (let i = 0; i < rowFromCount; i++) {
    strSearchSequenceVocab = col1.get(i);
    subsecCnt = columnSubsecCounter(col2, strSearchSequenceVocab, N);
    colCount.set(rowToCount+i, subsecCnt); //TODO should we add notify?
  } //<first column processing
  rowFromCount = col2.length;
  rowToCount = col1.length;
  for (let i = 0; i < rowFromCount; i++) {
    strSearchSequenceVocab = col2.get(i);
    subsecCnt = columnSubsecCounter(col1, strSearchSequenceVocab, N);
    colCount.set(rowToCount+i, subsecCnt); //notify
  } //<second column processing
  const timeEnd = Date.now(); //performance measurement
  console.log('maximsequence:fuzzyJoin Execution time (ms): ' + (timeEnd-timeStart)); //performance logging

  grok.shell.addTableView(df);
}

function columnSubsecCounter(col: Column, strSearchSequenceVocab: string, N: number): number {
  let rowCount: number = 0;
  let strSubsec: string = '';
  let subsecCnt: number = 0;
  let vocabLength: number = 0; //length of vocabulary string

  rowCount = col.length;
  subsecCnt = 0;
  vocabLength = strSearchSequenceVocab.length;
  for (let n = 0; n < vocabLength-N; n++) {
    strSubsec = strSearchSequenceVocab.substring(n, n+N);
    for (let i = 0; i < rowCount; i++) {
      let matcharr = col.get(i).match(strSubsec);
      if (matcharr != null) subsecCnt += matcharr.length;
    }
  }

  return subsecCnt;
}

//EXCERCISE 1
//name: complement
//tags: panel, widgets
//input: string nucleotides {semType: dna_nucleotide}
//output: widget result
//condition: true
export function complement(nucleotides: string): DG.Widget {
  let complementaryNucleotide: string = '';
  const preparedNucleotides: string = nucleotides.toUpperCase();
  let widgetStyle: DG.ElementOptions = { };
  const nucleTypes = /[^ATCG\s]/ig;
  const nucleMap = new Map<string, string>();
  nucleMap.set('A', 'T');
  nucleMap.set('T', 'A');
  nucleMap.set('C', 'G');
  nucleMap.set('G', 'C');
  nucleMap.set(' ', ' ');

  if ((preparedNucleotides.match(nucleTypes) === null) && (preparedNucleotides != null)) {
    for (let i = 0; i < preparedNucleotides.length; i++)
      complementaryNucleotide += nucleMap.get(preparedNucleotides[i]);
  } else {
    complementaryNucleotide = 'Non complementary value'; //nucleotides;
    widgetStyle = {style: {'color': '#F55'}};
  }
  return new DG.Widget(ui.divText(complementaryNucleotide, widgetStyle));
}

//EXCERCISE 0
//name: info
export function info() {
  grok.shell.info('Maximsequence info: ' + _package.webRoot);
}
