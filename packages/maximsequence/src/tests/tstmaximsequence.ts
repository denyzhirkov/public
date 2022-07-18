import * as grok from 'datagrok-api/grok';
import * as ui from 'datagrok-api/ui';
import * as DG from 'datagrok-api/dg';
import {category, expect, test} from '@datagrok-libraries/utils/src/test';
import {complement, fuzzyJoin} from '../package';
//import MaximsequencePackageDetectors from '../../detectors.js';

type Pair<inVal, outVal> = [inVal, outVal];
const tstComplementData: Pair<string, string>[] = [
['ATCG', 'TAGC'], ['atCG', 'TAGC'], ['atCG GATA', 'TAGC CTAT']
];
const tstNucleoData: Pair<string, boolean>[] = [
  ['ATCG', true], ['atCG', true], ['atCG GATA', true],
  ['JKGT', false], ['gcau', false], ['TT-AA-G', false]
];
const fuzecol1: string[] = ['gtgacaaaaa cataatggaa', 'tccaacacca tgtcaagctt', 'caaaccattt gaatggatgt',
  'atgaatccaa', 'atgaaggcaa tactagtagt', 'ccc'];
const fuzecol2: string[] = ['gtgacaaaaa', 'tgtcaagctt', 'gaatggatgt', 'atgaatccaa',
  'atgaaggcaa', 'tactagtagt', 'tactagtagt', 'ttt', 'ccc', 'aaa', 'ggg', 'cataatggaa'];

category('Maximsequence test', () => {
  test('Exercise1 test1', async () => {
    for (let i = 0; i < tstComplementData.length; i++)
      expect(complement(tstComplementData[i][0]), tstComplementData[i][1]);
      //expect(complement(tstComplementData[i][0]), tstComplementData[i][1]);
      //expect(detectNucleotides(tstNucleoData[i][0]), tstNucleoData[i][1]);
  });
  // test('Exercise1 test2', async () => {
  //   for (let i = 0; i < tstNucleoData.length; i++)
  //     expect(MaximsequencePackageDetectors.detectNucleotides(tstNucleoData[i][0]), tstNucleoData[i][1]);
  // });
  test('Exercise5 test', async () => {
    for (let i = 0; i < tstComplementData.length; i++) {
      //// const f1Txt: string = await grok.dapi.files.readAsText('System:AppData/Bio/samples/sample_FASTA.fasta');
      //// const df: DG.DataFrame = importFasta(fastaTxt)[0];
      const df1 = DG.DataFrame.fromColumns([DG.Column.fromList(DG.COLUMN_TYPE.STRING, 'Sequence', fuzecol1)]);
      const df2 = DG.DataFrame.fromColumns([DG.Column.fromList(DG.COLUMN_TYPE.STRING, 'Sequence', fuzecol2)]);
      grok.data.detectSemanticTypes(df1);
      grok.data.detectSemanticTypes(df2);
      // expect(fuzzyJoin(df1, df2), []);
    }
  });
});
