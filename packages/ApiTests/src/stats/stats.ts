import * as DG from 'datagrok-api/dg';
import * as grok from 'datagrok-api/grok';
import {category, expect, test} from '@datagrok-libraries/utils/src/test';

category('Stats', () => {
  const t = DG.DataFrame.create(3);
  t.columns.add(DG.Column.fromInt32Array('number', Int32Array.from([12, 10, 15, 20, 25, 98, 123, 16])));
  t.columns.add(DG.Column.fromInt32Array('population', Int32Array.from([3, 4, 5])));

  const stats_p = DG.Stats.fromColumn(t.getCol('population'));
  const stats_n = DG.Stats.fromColumn(t.getCol('number'));

  test('avg', async () => {
    expect(stats_p.avg, 4);
  });

  test('kurt', async () => {
    expect(stats_p.kurt, -1.5);
  });

  test('max', async () => {
    expect(stats_p.max, 5);
  });

  test('med', async () => {
    expect(stats_p.med, 4);
  });

  test('min', async () => {
    expect(stats_p.min, 3);
  });

  test('missingValueCount', async () => {
    expect(stats_p.missingValueCount, 0);
  });

  test('q1', async () => {
    expect(stats_p.q1, 3);
  });

  test('q2', async () => {
    expect(stats_p.q2, 4);
  });

  test('q3', async () => {
    expect(stats_p.q3, 5);
  });

  test('perc01', async () => {
    expect(stats_n.perc01, 12);
  });

  test('perc05', async () => {
    expect(stats_n.perc05, 12);
  });

  test('perc10', async () => {
    expect(stats_n.perc10, 12);
  });

  test('perc90', async () => {
    expect(stats_n.perc90, 16);
  });

  test('perc95', async () => {
    expect(stats_n.perc95, 16);
  });

  test('perc99', async () => {
    expect(stats_n.perc99, 16);
  });

  test('skew', async () => {
    expect(stats_p.skew, 0);
  });

  test('stdev', async () => {
    expect(stats_p.stdev, 1);
  });

  test('sum', async () => {
    expect(stats_p.sum, 12);
  });

  test('totalCount', async () => {
    expect(stats_p.totalCount, 3);
  });

  test('uniqueCount', async () => {
    expect(stats_p.uniqueCount, 3);
  });

  test('valueCount', async () => {
    expect(stats_p.valueCount, 3);
  });

  test('variance', async () => {
    expect(stats_p.variance, 1);
  });

  test('corr', async () => {
    expect(stats_p.corr(t.getCol('number')), 0.5960395606792696);
  });

  test('spearmanCorr', async () => {
    expect(stats_p.spearmanCorr(t.getCol('number')), 0.4999999999999999);
  });

  test('toString()', async () => {
    const t = DG.DataFrame.create(1);
    t.columns.add(DG.Column.fromInt32Array('number', Int32Array.from([12])));
    t.columns.add(DG.Column.fromInt32Array('population', Int32Array.from([3])));
    const stats = DG.Stats.histogramsByCategories(t.getCol('number'), t.getCol('population'));
    expect(stats.toString(), '1,0,0,0,0,0,0,0,0,0');
  });
});
