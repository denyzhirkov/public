import {after, before, category, test, expect, expectObject} from '@datagrok-libraries/utils/src/test';

import * as grok from 'datagrok-api/grok';
import * as ui from 'datagrok-api/ui';
import * as DG from 'datagrok-api/dg';
import {PositionInfo, PositionMonomerInfo, WebLogo} from '@datagrok-libraries/bio/src/viewers/web-logo';

category('WebLogo-positions', () => {
  let tvList: DG.TableView[];
  let dfList: DG.DataFrame[];

  const csvDf1 = `seq
    ATC-G-TTGC--
    ATC-G-TTGC--
    -TC-G-TTGC--
    -TC-GCTTGC--
    -TC-GCTTGC--`;


  const resShrinkEmptyTailDf1: PositionInfo[] = [];

  before(async () => {
    tvList = [];
    dfList = [];
  });

  after(async () => {
    dfList.forEach((df: DG.DataFrame) => { grok.shell.closeTable(df); });
    tvList.forEach((tv: DG.TableView) => tv.close());
  });

  test('allPositions', async () => {
    const df: DG.DataFrame = DG.DataFrame.fromCsv(csvDf1);
    const tv: DG.TableView = grok.shell.addTableView(df);

    const wlViewer: WebLogo = await df.plot.fromType('WebLogo') as unknown as WebLogo;
    tv.dockManager.dock(wlViewer.root, DG.DOCK_TYPE.DOWN);

    tvList.push(tv);
    dfList.push(df);

    const positions: PositionInfo[] = wlViewer['positions'];

    const resAllDf1: PositionInfo[] = [
      new PositionInfo('1', {'A': new PositionMonomerInfo(2), '-': new PositionMonomerInfo(3)}),
      new PositionInfo('2', {'T': new PositionMonomerInfo(5)}),
      new PositionInfo('3', {'C': new PositionMonomerInfo(5)}),
      new PositionInfo('4', {'-': new PositionMonomerInfo(5)}),
      new PositionInfo('5', {'G': new PositionMonomerInfo(5)}),
      new PositionInfo('6', {'-': new PositionMonomerInfo(3), 'C': new PositionMonomerInfo(2)}),
      new PositionInfo('7', {'T': new PositionMonomerInfo(5)}),
      new PositionInfo('8', {'T': new PositionMonomerInfo(5)}),
      new PositionInfo('9', {'G': new PositionMonomerInfo(5)}),
      new PositionInfo('10', {'C': new PositionMonomerInfo(5)}),
      new PositionInfo('11', {'-': new PositionMonomerInfo(5)}),
      new PositionInfo('12', {'-': new PositionMonomerInfo(5)})
    ];
    // check all positions are equal resAllDf1
    for (let i = 0; i < positions.length; i++) {
      expect(positions[i].name, resAllDf1[i].name);
        for (const key in positions[i].freq) {
          expect(positions[i].freq[key].count, resAllDf1[i].freq[key].count);
        }
    }

  });

});
