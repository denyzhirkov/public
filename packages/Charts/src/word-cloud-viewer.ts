import * as ui from 'datagrok-api/ui';
import * as DG from 'datagrok-api/dg';
import * as echarts from 'echarts';
import 'echarts-wordcloud';
import $ from 'cash-dom';

type shapeType = 'circle' | 'diamond' | 'triangle-forward' | 'triangle' | 'pentagon' | 'star';

export class WordCloudViewer extends DG.JsViewer {
  strColumnName: string;
  shape: shapeType;
  minTextSize: number;
  maxTextSize: number;
  minRotationDegree: number;
  maxRotationDegree: number;
  roationStep: number;
  gridSize: number;
  drawOutOfBound: boolean;
  fontFamily: string;
  bold: boolean;
  strColumns: DG.Column[];
  initialized: boolean;
  chart: echarts.EChartsType;

  constructor() {
    super();

    this.strColumnName = this.string('columnColumnName');

    this.shape = this.string('shape', 'circle', {
      choices: ['circle', 'diamond', 'triangle-forward', 'triangle', 'pentagon', 'star'],
    }) as shapeType;

    this.minTextSize = this.int('minTextSize', 14);
    this.maxTextSize = this.int('maxTextSize', 100);

    this.minRotationDegree = this.int('minRotationDegree', -30);
    this.maxRotationDegree = this.int('maxRotationDegree', 30);
    this.roationStep = this.int('rotationStep', 5);

    this.gridSize = this.int('gridSize', 8);

    this.drawOutOfBound = this.bool('drawOutOfBound', true);

    this.fontFamily = this.string('fontFamily', 'sans-serif', {choices: ['sans-serif', 'serif', 'monospace']});

    this.bold = this.bool('bold', true);

    this.strColumns = [];
    this.initialized = false;

    this.chart = echarts.init(this.root);
  }

  init() {
    this.initialized = true;
  }

  testColumns() {
    return (this.strColumns.length >= 1);
  }

  onTableAttached() {
    this.init();

    const columns = this.dataFrame!.columns.toList();
    this.strColumns = columns.filter((col: DG.Column) => col.type === DG.TYPE.STRING);

    if (this.testColumns()) {
      this.strColumnName = this.strColumns.reduce(
        (prev, curr) => prev.categories.length < curr.categories.length ? prev : curr,
      ).name;
    }


    this.subs.push(DG.debounce(this.dataFrame!.selection.onChanged, 50).subscribe((_) => this.render()));
    this.subs.push(DG.debounce(this.dataFrame!.filter.onChanged, 50).subscribe((_) => this.render()));
    this.subs.push(DG.debounce(ui.onSizeChanged(this.root), 50).subscribe((_) => this.render()));

    this.render();
  }

  onPropertyChanged(property: DG.Property) {
    super.onPropertyChanged(property);
    if (this.initialized && this.testColumns()) {
      if (property.name === 'columnColumnName')
        this.strColumnName = property.get(this);

      this.render();
    }
  }

  detach() {
    this.subs.forEach((sub) => sub.unsubscribe());
  }

  render() {
    if (!this.testColumns()) {
      this.root.innerText = 'Not enough data to produce the result.';
      return;
    }

    $(this.root).empty();

    const margin = {top: 10, right: 10, bottom: 10, left: 10};
    const width = this.root.parentElement!.clientWidth - margin.left - margin.right;
    const height = this.root.parentElement!.clientHeight - margin.top - margin.bottom;
    const strColumn = this.dataFrame!.getCol(this.strColumnName);
    const words = strColumn.categories;
    const data: echarts.SeriesOption[] = [];

    words.forEach((w) => data.push({
      name: w,
      value: strColumn.toList().filter((row) => row === w).length,
      textStyle: {
        color: DG.Color.toHtml(DG.Color.getCategoryColor(strColumn, w)),
      },
    }));

    this.chart?.dispose();

    this.chart.setOption({
      width: width + margin.left + margin.right,
      height: height + margin.top + margin.bottom,
      series: [{
        type: 'wordCloud',
        shape: this.shape,
        left: 'center',
        top: 'center',
        width: `${width}`,
        height: `${height}`,
        right: null,
        bottom: null,
        sizeRange: [this.minTextSize, this.maxTextSize],
        gridSize: this.gridSize,
        rotationRange: [this.minRotationDegree, this.maxRotationDegree],
        rotationStep: this.roationStep,
        drawOutOfBound: this.drawOutOfBound,
        textStyle: {
          fontFamily: this.fontFamily,
          fontWeight: this.bold ? 'bold' : 'normal',
        },
        emphasis: {
          focus: 'self',
          textStyle: {
            shadowBlur: 10,
            shadowColor: '#333',
          },
        },
        data: data,
      }],
    } as echarts.EChartOption);

    this.chart
      .on('mouseover', (d: {[key: string]: any}) => ui.tooltip.showRowGroup(this.dataFrame!, (i) => {
        return d.name === strColumn.get(i);
      }, 10, 10));
    this.chart.on('mouseout', () => ui.tooltip.hide());
    this.chart.on('mousedown', (d: {[key: string]: any}) => {
        this.dataFrame!.selection.handleClick((i) => {
          return d.name === strColumn.get(i);
        }, d);
    });
  }
}
