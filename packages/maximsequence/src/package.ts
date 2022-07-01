/* Do not change these import lines to match external modules in webpack configuration */
import * as grok from 'datagrok-api/grok';
import * as ui from 'datagrok-api/ui';
import * as DG from 'datagrok-api/dg';
import { Column, DataFrame, DateTime } from 'datagrok-api/dg';
//import { DataFrame } from 'datagrok-api/dg';

//import {ElementOptions} from 'datagrok-api/src/const';  //we can import it from DG instead

export const _package = new DG.Package();

//name: info
export function info() {
  grok.shell.info('Maximsequence info: ' + _package.webRoot);
}

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

//name: fuzzyJoin
//input: dataframe df1
//input: dataframe df2
//input: int N
export function fuzzyJoin(df1: DG.DataFrame, df2: DG.DataFrame, N: number): void {
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

  const timeStart = Date.now();
  const df = df1.append(df2, false);
  const colCount = df.columns.addNewInt('Counts ('+N+')');
  df.name = 'fuzzyJoin(' +df1.name+', '+df2.name+', '+N+ ')';

  rowFromCount = col1.length;
  rowToCount = 0;
  for (let i = 0; i < rowFromCount; i++) {
    strSearchSequenceVocab = col1.get(i);
    subsecCnt = columnSubsecCounter(col2, strSearchSequenceVocab, N);
    colCount.set(rowToCount+i, subsecCnt); //TODO should we add notify?
  }
  rowFromCount = col2.length;
  rowToCount = col1.length;
  for (let i = 0; i < rowFromCount; i++) {
    strSearchSequenceVocab = col2.get(i);
    subsecCnt = columnSubsecCounter(col1, strSearchSequenceVocab, N);
    colCount.set(rowToCount+i, subsecCnt); //notify
  }
  const timeEnd = Date.now();
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
