import * as ui from 'datagrok-api/ui';
import * as DG from 'datagrok-api/dg';

import * as echarts from 'echarts';


// Based on this example: https://echarts.apache.org/examples/en/editor.html?c=radar
export class RadarViewer extends DG.JsViewer {
  private myChart: echarts.ECharts;

  constructor() {
    super();
    const chartDiv = ui.div(undefined, {style: {position: 'absolute', left: '0', right: '0', top: '0', bottom: '0'}} );
    this.root.appendChild(chartDiv);
    this.myChart = echarts.init(chartDiv);
    this.subs.push(ui.onSizeChanged(chartDiv).subscribe((_) => this.myChart.resize()));
  }

  onTableAttached() {
    this.subs.push(this.dataFrame!.selection.onChanged.subscribe(() => this.render()));
    this.subs.push(this.dataFrame!.filter.onChanged.subscribe(() => this.render()));

    this.render();
  }

  render() {
    const option: {[key: string]: any} = {
      radar: {
        name: {
          textStyle: {
            color: '#fff',
            backgroundColor: '#999',
            borderRadius: 3,
            padding: [3, 5],
          },
        },
        indicator: [],
      },
      series: [{
        type: 'radar',
        data: [],
      }],
    };

    const columns: DG.Column[] = Array.from(this.dataFrame!.columns.numerical);

    for (const c of columns)
      option.radar.indicator.push( {name: c.name, max: c.max});

    const data = option.series[0].data;
    for (let i = 0; i < this.dataFrame!.rowCount; i++) {
      data.push({
        name: `row ${i}`,
        value: columns.map((c) => c.get(i)),
      });
    }

    this.myChart.setOption(option);
  }
}
