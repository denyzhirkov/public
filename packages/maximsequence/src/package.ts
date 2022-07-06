/* Do not change these import lines to match external modules in webpack configuration */
import * as grok from 'datagrok-api/grok';
import * as ui from 'datagrok-api/ui';
import * as DG from 'datagrok-api/dg';
import { Column, DataFrame, Widget } from 'datagrok-api/dg';
////import SmartLabel from 'fusioncharts-smartlabel/dist/fusioncharts-smartlabel';
//import * as DG from 'node_modules/fusioncharts-smartlabel';
//import { DataFrame } from 'datagrok-api/dg';
//import {ElementOptions} from 'datagrok-api/src/const';  //we can import it from DG instead

export const _package = new DG.Package();

//Exercise 9: Enhancing Datagrok with dialog-based functions
//name: fetchENASequence
//input: string query
//input: string limit
//output: string result
export async function _fetchENASequence(query: string, limit: string): Promise<string> {
  const url = `https://www.ebi.ac.uk/ena/browser/api/embl/textsearch?result=sequence&query=${query}&limit=${limit}`;
  //uploadDataFrame
  const fetchresult = await (await grok.dapi.fetchProxy(url)).text();

  return fetchresult;
}

//async function getAndParseENASequence(query: string, limit: string, df: DG.DataFrame, cutLength: number = 60) {
async function getAndParseENASequence(query: string, limit: string, cutLength: number = 60): Promise<DG.DataFrame> {
  const idList: string[] = [];
  const sequencesList: string[] = [];
  let strENAFile: string = '';
  let strENARecord: string = '';
  const idLength: number = 8; //length of ENA identificator
  const indention: number = 5; //length of spaces for indention
  let recordPos: number;
  let signPos: number; // field signature position
  let brPos: number; // '\n'  position
  let strID: string;
  let strSeq: string;

  const pi = DG.TaskBarProgressIndicator.create('Obtaining and parsing ENASequence...');
  //fetch for ENA sequence
  try {
    const enaResult = await _fetchENASequence(query, limit);
    //enaResult.then((value) => {strENAFile = value});
    strENAFile = enaResult;

    //parsing ENA sequence
    //TODO put parsing in separate function if we need to expand parser functionality
    let eof: boolean = false;
    while (!eof) {
      recordPos = strENAFile.search('//');
      strID = '';
      strSeq = '';
      if (recordPos === -1) eof = true;
      else {
        strENARecord = strENAFile.slice(0, recordPos);
        strENAFile = strENAFile.slice(recordPos + 2);

        signPos = strENARecord.search('AC   ');
        if (signPos >= 0) strID = strENARecord.slice(signPos + indention, signPos + indention + idLength);

        signPos = strENARecord.search('SQ   ');
        if (signPos >= 0) {
          strENARecord = strENARecord.slice(signPos);
          brPos = strENARecord.search('\n');
          if (brPos >= 0) strSeq = strENARecord.slice((brPos+1) + indention, brPos + indention + cutLength);
          //TODO if we want to extract more than 60 symbols - we should upgrade code to put aside numbers and indetions
        } //extracting ENA sequencs
        if ((strID !== '') && (strSeq !== '')) {
          idList.push(strID);
          sequencesList.push(strSeq);
        }
      } //record processing
    } //while (!eof)
  } catch (e: any) {
    grok.shell.error(e.toString()); //TODO Q: is it correct type-casting for using in shell.error?
  } finally { //TODO Q: in case of multiple using should we eliminate previously created data frames (df)?
    let df: DG.DataFrame | null = null;
    try {
      df = DG.DataFrame.fromColumns([
        DG.Column.fromList(DG.COLUMN_TYPE.STRING, 'ID', idList),
        DG.Column.fromList(DG.COLUMN_TYPE.STRING, 'Sequence', sequencesList)
      ]);
    } finally {
      if (df === null) df = DG.DataFrame.create(8);
      pi.close();
    }
    return df;
  }

}

function onPreviewBtnClick() {
//  getAndParseENASequence('coronavirus', '10');
}

//name: formENADataTable
export async function formENADataTable() {
  let dfPreview: DG.DataFrame = DG.DataFrame.create(8);
  const previewGrid = DG.Viewer.grid(dfPreview, {'width': '350px', 'border': 'solid 1px red'});
  const limitInput = ui.intInput('', 100);
  const queryInput = ui.stringInput('', 'coronavirus');
//  const button = ui.button('Preview..', onPreviewBtnClick);
  const button = ui.button('Preview..', async ()=>{
    //await getAndParseENASequence('coronavirus', '10', dfPreview);
    if (queryInput.value == '') grok.shell.warning('Warning: Specify query!');
    else {
      ui.setUpdateIndicator(previewGrid.root, true);
      dfPreview = await getAndParseENASequence(queryInput.value, '5');
      previewGrid.dataFrame = dfPreview;
      ui.setUpdateIndicator(previewGrid.root, false);
    }
  });

  limitInput.root.setAttribute('size', '5');
  limitInput.root.setAttribute('placeholder', 'How many rows');
  limitInput.setTooltip('Specify max rows of data to load');
  queryInput.root.setAttribute('placeholder', 'Query');
  queryInput.setTooltip('Specify query to load');

  let htmlStyle: DG.ElementOptions = { };
  //htmlStyle = {style: {'width': '330px', 'border': 'solid 1px darkgray'}};

  const panelGrid = ui.div([previewGrid], htmlStyle);

  htmlStyle = {style: {'width': '150px', 'border': 'none 1px darkgray', 'min-width': '150px',
    'display': 'flex', 'justify-content': 'flex-start', 'flex-flow': 'column wrap'}};
  const panelProp = ui.div([
    queryInput.root,
    limitInput,
    button], htmlStyle);

  htmlStyle = {style: {'width': '100%', 'height': '100%', 'border': 'solid 1px darkgray'}};
  ui.dialog('Create sequences table')
    .add(ui.splitH([
      panelProp,
      panelGrid
    ], htmlStyle, true))
    .onOK(async (event: any) => {
      let query = '';
      let limVal = 0;
      if ((limitInput.value == 0) || (limitInput.value === null)) {
        grok.shell.warning('Warning: Specify number of rows!');
        if (event.preventDefault != null) event.preventDefault();
        return;
      }
      if (limitInput.value != null) limVal = limitInput.value;
      if (queryInput.value == '') {
        grok.shell.warning('Warning: Specify query!');
        if (event.preventDefault != null) event.preventDefault();
        return;
      }
      query = queryInput.value;

      let df = await getAndParseENASequence(query, limVal.toString());
      previewGrid.dataFrame = dfPreview;
      grok.shell.addTableView(df);
    })
    .show({width: 550, height: 410}); //showModal()

}

//EXCERCISE 8: Creating an info panel with a REST web service
//name: ENA Sequence (maxim)
//tags: panel, widgets
//input: string cellText
//output: widget result
//condition: true
export async function enaSequence(cellText: string): Promise<DG.Widget | null> {
//isPotentialENAId(cellText)
  const url = `https://www.ebi.ac.uk/ena/browser/api/fasta/${cellText}`;
  const fasta = await (await grok.dapi.fetchProxy(url)).text();

  if (fasta.length === 0) return null;

  let widgetStyle: DG.ElementOptions = { };
  const headerEndPos = fasta.search(/\n/); //TODO: check is '\n' enough or we need to searsh for '\r' too
  const headerText: string = fasta.slice(0, headerEndPos);
  const boxHeader = ui.divText(headerText);
  const fastaText: string = fasta.slice(headerEndPos);
//  widgetStyle = {style: {'color': '#F55', 'width': '100%', 'border': 'solid 1px darkgray'}};
//  widgetStyle = {style: {'color': '#F55', 'flex-direction': 'col', 'width': '75%', 'border': 'solid 1px darkgray'}};
  const contentInput: DG.InputBase<string> = ui.textInput('', fastaText);
  contentInput.input.setAttribute('cols', '20');
  contentInput.input.setAttribute('rows', '10');
  const fastaContent = ui.inputs([contentInput]);

  const boxContent = ui.splitV([
    boxHeader,
    fastaContent
  ], null, true);

  widgetStyle = {style: {'color': 'black', 'height': '350px', 'border': 'solid 2px black'}};
  //const widgetbox = ui.box(boxContent);
  const widgetbox = ui.box(boxContent, widgetStyle);

  const view = grok.shell.newView('Test view');
  view.box = true;
  view.append(widgetbox);


  return new DG.Widget(widgetbox);
}

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
