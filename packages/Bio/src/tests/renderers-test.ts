import {after, before, category, delay, expect, test} from '@datagrok-libraries/utils/src/test';

import * as grok from 'datagrok-api/grok';
import * as DG from 'datagrok-api/dg';
import {importFasta, multipleSequenceAlignmentAny} from '../package';
import {convertDo} from '../utils/convert';
import {ALPHABET, NOTATION, UnitsHandler} from '@datagrok-libraries/bio/src/utils/units-handler';
import {SEM_TYPES, TAGS} from '../utils/constants';
import {generateLongSequence, generateManySequences, performanceTest} from './test-sequnces-generators';

category('renderers', () => {
  let tvList: DG.TableView[];
  let dfList: DG.DataFrame[];

  before(async () => {
    await grok.functions.call('Bio:initBio');
    tvList = [];
    dfList = [];
  });

  after(async () => {
    dfList.forEach((df: DG.DataFrame) => { grok.shell.closeTable(df); });
    tvList.forEach((tv: DG.TableView) => tv.close());
  });

  test('long sequence performance ', async () => {
    performanceTest(generateLongSequence, 'Long sequences');
  });

  test('many sequence performance', async () => {
    performanceTest(generateManySequences, 'Many sequences');
  });

  test('rendererMacromoleculeFasta', async () => {
    await _rendererMacromoleculeFasta();
  });

  test('rendererMacromoleculeSeparator', async () => {
    await _rendererMacromoleculeSeparator();
  });

  test('rendererMacromoleculeDifference', async () => {
    await _rendererMacromoleculeDifference();
  });

  test('afterMsa', async () => {
    await _testAfterMsa();
  });

  test('afterConvert', async () => {
    await _testAfterConvert();
  });

  test('selectRendererBySemType', async () => {
    await _selectRendererBySemType();
  });

  test('setRendererManually', async () => {
    await _setRendererManually();
  });

  async function _rendererMacromoleculeFasta() {
    const csv: string = await grok.dapi.files.readAsText('System:AppData/Bio/samples/sample_FASTA.csv');
    const df: DG.DataFrame = DG.DataFrame.fromCsv(csv);

    const seqCol = df.getCol('Sequence');
    const semType: string = await grok.functions.call('Bio:detectMacromolecule', {col: seqCol});
    if (semType)
      seqCol.semType = semType;

    const tv: DG.TableView = grok.shell.addTableView(df);
    // call to calculate 'cell.renderer' tag
    await grok.data.detectSemanticTypes(df);

    dfList.push(df);
    tvList.push(tv);

    const resCellRenderer = seqCol.getTag(DG.TAGS.CELL_RENDERER);
    expect(resCellRenderer, 'sequence');
  }

  async function _rendererMacromoleculeSeparator() {
    const csv: string = await grok.dapi.files.readAsText('System:AppData/Bio/data/sample_SEPARATOR_PT.csv');
    const df: DG.DataFrame = DG.DataFrame.fromCsv(csv);

    const seqCol = df.getCol('sequence');
    const semType: string = await grok.functions.call('Bio:detectMacromolecule', {col: seqCol});
    if (semType)
      seqCol.semType = semType;

    const tv: DG.TableView = grok.shell.addTableView(df);
    // call to calculate 'cell.renderer' tag
    await grok.data.detectSemanticTypes(df);

    dfList.push(df);
    tvList.push(tv);

    const resCellRenderer = seqCol.getTag(DG.TAGS.CELL_RENDERER);
    expect(resCellRenderer, 'sequence');
  }

  async function _rendererMacromoleculeDifference() {
    const seqDiffCol: DG.Column = DG.Column.fromStrings('SequencesDiff',
      ['meI/hHis/Aca/N/T/dK/Thr_PO3H2/Aca#D-Tyr_Et/Tyr_ab-dehydroMe/meN/E/N/dV']);
    seqDiffCol.tags[DG.TAGS.UNITS] = 'separator';
    seqDiffCol.tags[TAGS.SEPARATOR] = '/';
    seqDiffCol.semType = SEM_TYPES.MACROMOLECULE_DIFFERENCE;
    const df = DG.DataFrame.fromColumns([seqDiffCol]);

    const tv: DG.TableView = grok.shell.addTableView(df);
    // call to calculate 'cell.renderer' tag
    await grok.data.detectSemanticTypes(df);

    dfList.push(df);
    tvList.push(tv);

    const resCellRenderer = seqDiffCol.getTag(DG.TAGS.CELL_RENDERER);
    expect(resCellRenderer, 'MacromoleculeDifference');
  }

  async function _testAfterMsa() {
    const fastaTxt: string = await grok.dapi.files.readAsText('System:AppData/Bio/data/sample_FASTA.fasta');
    const df: DG.DataFrame = importFasta(fastaTxt)[0];

    const srcSeqCol: DG.Column = df.getCol('sequence');
    const semType: string = await grok.functions.call('Bio:detectMacromolecule', {col: srcSeqCol});
    if (semType)
      srcSeqCol.semType = semType;

    const tv: DG.TableView = grok.shell.addTableView(df);
    // call to calculate 'cell.renderer' tag
    await grok.data.detectSemanticTypes(df);

    console.log('Bio: tests/renderers/afterMsa, table view');

    console.log('Bio: tests/renderers/afterMsa, src before test ' +
      `semType="${srcSeqCol!.semType}", units="${srcSeqCol!.getTag(DG.TAGS.UNITS)}", ` +
      `cell.renderer="${srcSeqCol!.getTag(DG.TAGS.CELL_RENDERER)}"`);
    expect(srcSeqCol.semType, DG.SEMTYPE.MACROMOLECULE);
    expect(srcSeqCol.getTag(DG.TAGS.UNITS), NOTATION.FASTA);
    expect(srcSeqCol.getTag(UnitsHandler.TAGS.aligned), 'SEQ');
    expect(srcSeqCol.getTag(UnitsHandler.TAGS.alphabet), ALPHABET.PT);
    expect(srcSeqCol.getTag(DG.TAGS.CELL_RENDERER), 'sequence');

    const msaSeqCol: DG.Column = (await multipleSequenceAlignmentAny(df, srcSeqCol!))!;
    tv.grid.invalidate();

    expect(msaSeqCol.semType, DG.SEMTYPE.MACROMOLECULE);
    expect(msaSeqCol.getTag(DG.TAGS.UNITS), NOTATION.FASTA);
    expect(msaSeqCol.getTag(UnitsHandler.TAGS.aligned), 'SEQ.MSA');
    expect(msaSeqCol.getTag(UnitsHandler.TAGS.alphabet), ALPHABET.PT);
    expect(msaSeqCol.getTag(DG.TAGS.CELL_RENDERER), 'sequence');

    // check newColumn with UnitsHandler constructor
    const uh: UnitsHandler = new UnitsHandler(msaSeqCol);

    dfList.push(df);
    tvList.push(tv);
  }

  async function _testAfterConvert() {
    const csv: string = await grok.dapi.files.readAsText('System:AppData/Bio/data/sample_FASTA_PT.csv');
    const df: DG.DataFrame = DG.DataFrame.fromCsv(csv);

    const srcCol: DG.Column = df.col('sequence')!;
    const semType: string = await grok.functions.call('Bio:detectMacromolecule', {col: srcCol});
    if (semType)
      srcCol.semType = semType;

    const tv: DG.TableView = grok.shell.addTableView(df);
    // call to calculate 'cell.renderer' tag
    await grok.data.detectSemanticTypes(df);

    tvList.push(tv);
    dfList.push(df);

    const tgtCol: DG.Column = await convertDo(srcCol, NOTATION.SEPARATOR, '/');

    const resCellRenderer = tgtCol.getTag(DG.TAGS.CELL_RENDERER);
    expect(resCellRenderer, 'sequence');

    // check tgtCol with UnitsHandler constructor
    const uh: UnitsHandler = new UnitsHandler(tgtCol);
  }

  async function _selectRendererBySemType() {
    /* There are renderers for semType Macromolecule and MacromoleculeDifference.
       Misbehavior was by selecting Macromolecule renderers for MacromoleculeDifference semType column
    /**/
    const seqDiffCol: DG.Column = DG.Column.fromStrings('SequencesDiff',
      ['meI/hHis/Aca/N/T/dK/Thr_PO3H2/Aca#D-Tyr_Et/Tyr_ab-dehydroMe/meN/E/N/dV']);
    seqDiffCol.tags[DG.TAGS.UNITS] = 'separator';
    seqDiffCol.tags[TAGS.SEPARATOR] = '/';
    seqDiffCol.semType = SEM_TYPES.MACROMOLECULE_DIFFERENCE;
    const df = DG.DataFrame.fromColumns([seqDiffCol]);
    const tv = grok.shell.addTableView(df);
    dfList.push(df);
    tvList.push(tv);

    await delay(100);
    const renderer = seqDiffCol.getTag(DG.TAGS.CELL_RENDERER);
    if (renderer !== 'MacromoleculeDifference') // this is value of MacromoleculeDifferenceCR.cellType
      throw new Error(`Units 'separator', separator '/' and semType 'MacromoleculeDifference' ` +
        `have been manually set on column but after df was added as table, ` +
        `view renderer has set to '${renderer}' instead of correct 'MacromoleculeDifference'.`);
  }

  async function _setRendererManually() {
    const seqDiffCol: DG.Column = DG.Column.fromStrings('SequencesDiff',
      ['meI/hHis/Aca/N/T/dK/Thr_PO3H2/Aca#D-Tyr_Et/Tyr_ab-dehydroMe/meN/E/N/dV']);
    seqDiffCol.tags[DG.TAGS.UNITS] = 'separator';
    seqDiffCol.tags[TAGS.SEPARATOR] = '/';
    seqDiffCol.semType = SEM_TYPES.MACROMOLECULE;
    const tgtCellRenderer = 'MacromoleculeDifference';
    seqDiffCol.setTag(DG.TAGS.CELL_RENDERER, tgtCellRenderer);
    const df = DG.DataFrame.fromColumns([seqDiffCol]);
    await grok.data.detectSemanticTypes(df);
    const tv = grok.shell.addTableView(df);
    dfList.push(df);
    tvList.push(tv);

    await delay(100);
    const resCellRenderer = seqDiffCol.getTag(DG.TAGS.CELL_RENDERER);
    if (resCellRenderer !== tgtCellRenderer) // this is value of MacromoleculeDifferenceCR.cellType
      throw new Error(`Tag 'cell.renderer' has been manually set to '${tgtCellRenderer}' for column ` +
        `but after df was added as table, tag 'cell.renderer' has reset to '${resCellRenderer}' ` +
        `instead of manual '${tgtCellRenderer}'.`);
  }
});
