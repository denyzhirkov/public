import * as ui from 'datagrok-api/ui';
import * as grok from 'datagrok-api/grok';
import * as DG from 'datagrok-api/dg';

import {Subject, Observable} from 'rxjs';
import {addViewerToHeader, StackedBarChart} from './viewers/stacked-barchart-viewer';
import * as C from './utils/constants';
import * as type from './utils/types';
import {getSeparator, getTypedArrayConstructor} from './utils/misc';
import {_package} from './package';
import {SARViewer, SARViewerBase, SARViewerVertical} from './viewers/sar-viewer';
import {PeptideSpaceViewer} from './viewers/peptide-space-viewer';
import {renderSARCell, setAARRenderer} from './utils/cell-renderer';
import {substitutionsWidget} from './widgets/subst-table';
import {getDistributionAndStats, getDistributionWidget} from './widgets/distribution';
import {getStats, Stats} from './utils/filtering-statistics';

export class PeptidesModel {
  static _modelName = 'peptidesModel';

  _statsDataFrameSubject = new Subject<DG.DataFrame>();
  _sarGridSubject = new Subject<DG.Grid>();
  _sarVGridSubject = new Subject<DG.Grid>();
  _substitutionTableSubject = new Subject<type.SubstitutionsInfo>();

  _isUpdating: boolean = false;
  _isSubstInitialized = false;
  isBitsetChangedInitialized = false;
  isCellChanging = false;

  _sarGrid!: DG.Grid;
  _sarVGrid!: DG.Grid;
  _sourceGrid!: DG.Grid;
  _dataFrame: DG.DataFrame;
  splitCol!: DG.Column<boolean>;
  stackedBarchart!: StackedBarChart;
  edf: DG.DataFrame | null = null;
  statsDf!: DG.DataFrame;
  _currentSelection!: type.SelectionObject;
  substitutionsInfo: type.SubstitutionsInfo = new Map();
  isInitialized = false;
  currentView!: DG.TableView;

  isPeptideSpaceChangingBitset = false;
  isChangingEdfBitset = false;

  sarViewer!: SARViewer;
  sarViewerVertical!: SARViewerVertical;

  _usedProperties: {[propName: string]: string | number | boolean} = {};
  monomerMap: {[key: string]: {molfile: string, fullName: string}} = {};

  private constructor(dataFrame: DG.DataFrame) {
    this._dataFrame = dataFrame;
  }

  static async getInstance(dataFrame: DG.DataFrame): Promise<PeptidesModel> {
    dataFrame.temp[PeptidesModel.modelName] ??= new PeptidesModel(dataFrame);
    await (dataFrame.temp[PeptidesModel.modelName] as PeptidesModel).init();
    return dataFrame.temp[PeptidesModel.modelName] as PeptidesModel;
  }

  static get modelName(): string {return PeptidesModel._modelName;}

  get onStatsDataFrameChanged(): Observable<DG.DataFrame> {return this._statsDataFrameSubject.asObservable();}

  get onSARGridChanged(): Observable<DG.Grid> {return this._sarGridSubject.asObservable();}

  get onSARVGridChanged(): Observable<DG.Grid> {return this._sarVGridSubject.asObservable();}

  get onSubstTableChanged(): Observable<type.SubstitutionsInfo> {return this._substitutionTableSubject.asObservable();}

  get currentSelection(): type.SelectionObject {
    this._currentSelection ??= JSON.parse(this._dataFrame.tags[C.TAGS.SELECTION] || '{}');
    return this._currentSelection;
  }
  set currentSelection(selection: type.SelectionObject) {
    this._currentSelection = selection;
    this._dataFrame.tags[C.TAGS.SELECTION] = JSON.stringify(selection);
    this.invalidateSelection();
  }

  get usedProperties(): {[propName: string]: string | number | boolean} {
    this._usedProperties = JSON.parse(this._dataFrame.tags['sarProperties'] ?? '{}');
    return this._usedProperties;
  }
  set usedProperties(properties: {[propName: string]: string | number | boolean}) {
    this._dataFrame.tags['sarProperties'] = JSON.stringify(properties);
    this._usedProperties = properties;
  }

  get splitByPos() {
    const splitByPosFlag = (this._dataFrame.tags['distributionSplit'] ?? '00')[0];
    return splitByPosFlag == '1' ? true : false;
  }
  set splitByPos(flag: boolean) {
    const splitByAARFlag = (this._dataFrame.tags['distributionSplit'] ?? '00')[1];
    this._dataFrame.tags['distributionSplit'] = `${flag ? 1 : 0}${splitByAARFlag}`;
  }

  get splitByAAR() {
    const splitByPosFlag = (this._dataFrame.tags['distributionSplit'] ?? '00')[1];
    return splitByPosFlag == '1' ? true : false;
  }
  set splitByAAR(flag: boolean) {
    const splitByAARFlag = (this._dataFrame.tags['distributionSplit'] ?? '00')[0];
    this._dataFrame.tags['distributionSplit'] = `${splitByAARFlag}${flag ? 1 : 0}`;
  }

  invalidateSelection(): void {
    this.fireBitsetChanged();
    this.invalidateGrids();
  }

  createAccordion() {
    const acc = ui.accordion();
    acc.root.style.width = '100%';
    acc.addTitle(ui.h1(`${this._dataFrame.selection.trueCount} selected rows`));
    acc.addPane('Substitutions', () => substitutionsWidget(this._dataFrame, this).root, true);
    acc.addPane('Distribtution', () => getDistributionWidget(this._dataFrame, this).root, true);

    return acc;
  }

  getViewer(): SARViewerBase {
    const viewer = this.sarViewer ?? this.sarViewerVertical;
    if (!viewer)
      throw new Error('ViewerError: none of the SAR viewers is initialized');
    return viewer;
  }

  isPropertyChanged(): boolean {
    const viewer = this.getViewer();
    const viewerProps = viewer.props.getProperties();
    let result = false;
    const tempProps = this.usedProperties;
    for (const property of viewerProps) {
      const propName = property.name;
      const propVal = property.get(viewer);
      if (tempProps[propName] != propVal) {
        tempProps[propName] = propVal;
        result = true;
      }
    }
    this.usedProperties = tempProps;
    return result;
  }

  updateDefault(forceUpdate: boolean = false): void {
    const viewer = this.getViewer();
    if ((this._sourceGrid && !this._isUpdating && this.isPropertyChanged()) || !this.isInitialized) {
      this.isInitialized = true;
      this._isUpdating = true;
      const [viewerGrid, viewerVGrid, statsDf] = this.initializeViewersComponents();
      //FIXME: modify during the initializeViewersComponents stages
      this._statsDataFrameSubject.next(statsDf);
      this._sarGridSubject.next(viewerGrid);
      this._sarVGridSubject.next(viewerVGrid);
      if (viewer.showSubstitution) {
        this._substitutionTableSubject.next(this.substitutionsInfo);
        this._isSubstInitialized = true;
      }
      if (forceUpdate)
        this.updateBarchart();
      this.invalidateSelection();

      this._isUpdating = false;
    }
  }

  //TODO: make sync
  async updateBarchart(): Promise<void> {
    this.stackedBarchart ??= await this._dataFrame?.plot.fromType('StackedBarChartAA') as StackedBarChart;
    if (this.stackedBarchart && this._sourceGrid)
      addViewerToHeader(this._sourceGrid, this.stackedBarchart);
  }

  initializeViewersComponents(): [DG.Grid, DG.Grid, DG.DataFrame] {
    if (this._sourceGrid === null)
      throw new Error(`Source grid is not initialized`);

    //Split the aligned sequence into separate AARs
    let splitSeqDf: DG.DataFrame | undefined;
    let invalidIndexes: number[];
    const col: DG.Column = this._dataFrame.columns.bySemType(C.SEM_TYPES.MACROMOLECULE)!;
    const alphabet = col.tags[DG.TAGS.UNITS].split(':')[2];
    [splitSeqDf, invalidIndexes] = PeptidesModel.splitAlignedPeptides(col);

    const positionColumns = splitSeqDf.columns.names();
    const renderColNames: string[] = splitSeqDf.columns.names();

    const activityCol = this._dataFrame.columns.bySemType(C.SEM_TYPES.ACTIVITY)!;
    splitSeqDf.columns.add(activityCol);

    this.joinDataFrames(positionColumns, splitSeqDf);

    for (const dfCol of this._dataFrame.columns) {
      if (positionColumns.includes(dfCol.name))
        setAARRenderer(dfCol, alphabet, this._sourceGrid);
    }

    this.sortSourceGrid();

    const viewer = this.getViewer();

    this.createScaledCol(viewer.scaling, splitSeqDf);

    //unpivot a table and handle duplicates
    let matrixDf = splitSeqDf.groupBy(positionColumns).aggregate();

    matrixDf = matrixDf.unpivot([], positionColumns, C.COLUMNS_NAMES.POSITION, C.COLUMNS_NAMES.AMINO_ACID_RESIDUE);

    //statistics for specific AAR at a specific position
    this.statsDf = this.calculateStatistics(matrixDf);

    // SAR matrix table
    //pivot a table to make it matrix-like
    matrixDf = this.statsDf.groupBy([C.COLUMNS_NAMES.AMINO_ACID_RESIDUE])
      .pivot(C.COLUMNS_NAMES.POSITION)
      .add('first', C.COLUMNS_NAMES.MEAN_DIFFERENCE, '')
      .aggregate();
    matrixDf.name = 'SAR';

    // Setting category order
    this.setCategoryOrder(matrixDf);

    // SAR vertical table (naive, choose best Mean difference from pVals <= 0.01)
    const sequenceDf = this.createVerticalTable();
    renderColNames.push(C.COLUMNS_NAMES.MEAN_DIFFERENCE);

    if (viewer.showSubstitution || !this._isSubstInitialized)
      this.calcSubstitutions();

    const [sarGrid, sarVGrid] = this.createGrids(matrixDf, positionColumns, sequenceDf, alphabet);

    this._sarGrid = sarGrid;
    this._sarVGrid = sarVGrid;

    this.setCellRenderers(renderColNames, sarGrid, sarVGrid);

    // show all the statistics in a tooltip over cell
    this.setTooltips(renderColNames, sarGrid, sarVGrid);

    this.setInteractionCallback();

    this.setBitsetCallback();

    this.postProcessGrids(invalidIndexes, sarGrid, sarVGrid);

    //TODO: return class instead
    return [sarGrid, sarVGrid, this.statsDf];
  }

  calcSubstitutions(): void {
    const activityValues: DG.Column<number> = this._dataFrame.columns.bySemType(C.SEM_TYPES.ACTIVITY_SCALED)!;
    const columnList: DG.Column<string>[] = this._dataFrame.columns.bySemTypeAll(C.SEM_TYPES.AMINO_ACIDS);
    const nCols = columnList.length;
    if (nCols == 0)
      throw new Error(`Couldn't find any column of semType '${C.SEM_TYPES.AMINO_ACIDS}'`);

    const viewer = this.getViewer();
    this.substitutionsInfo = new Map();
    const nRows = this._dataFrame.rowCount;
    for (let seq1Idx = 0; seq1Idx < nRows - 1; seq1Idx++) {
      for (let seq2Idx = seq1Idx + 1; seq2Idx < nRows; seq2Idx++) {
        let substCounter = 0;
        const activityValSeq1 = activityValues.get(seq1Idx)!;
        const activityValSeq2 = activityValues.get(seq2Idx)!;
        const delta = activityValSeq1 - activityValSeq2;
        if (Math.abs(delta) < viewer.minActivityDelta)
          continue;

        let substCounterFlag = false;
        const tempData: {pos: string, seq1monomer: string, seq2monomer: string, seq1Idx: number, seq2Idx: number}[] =
          [];
        for (const currentPosCol of columnList) {
          const seq1monomer = currentPosCol.get(seq1Idx)!;
          const seq2monomer = currentPosCol.get(seq2Idx)!;
          if (seq1monomer == seq2monomer)
            continue;

          substCounter++;
          substCounterFlag = substCounter > viewer.maxSubstitutions;
          if (substCounterFlag)
            break;

          tempData.push({
            pos: currentPosCol.name,
            seq1monomer: seq1monomer,
            seq2monomer: seq2monomer,
            seq1Idx: seq1Idx,
            seq2Idx: seq2Idx,
          });
        }

        if (substCounterFlag || substCounter == 0)
          continue;

        for (const tempDataElement of tempData) {
          const position = tempDataElement.pos;

          //Working with seq1monomer
          const seq1monomer = tempDataElement.seq1monomer;
          if (!this.substitutionsInfo.has(seq1monomer))
            this.substitutionsInfo.set(seq1monomer, new Map());

          let positionsMap = this.substitutionsInfo.get(seq1monomer)!;
          if (!positionsMap.has(position))
            positionsMap.set(position, new Map());

          let indexes = positionsMap.get(position)!;

          !indexes.has(seq1Idx) ? indexes.set(seq1Idx, [seq2Idx]) : (indexes.get(seq1Idx)! as number[]).push(seq2Idx);

          //Working with seq2monomer
          const seq2monomer = tempDataElement.seq2monomer;
          if (!this.substitutionsInfo.has(seq2monomer))
            this.substitutionsInfo.set(seq2monomer, new Map());

          positionsMap = this.substitutionsInfo.get(seq2monomer)!;
          if (!positionsMap.has(position))
            positionsMap.set(position, new Map());

          indexes = positionsMap.get(position)!;
          !indexes.has(seq2Idx) ? indexes.set(seq2Idx, [seq1Idx]) : (indexes.get(seq2Idx)! as number[]).push(seq1Idx);
        }
      }
    }

    const TypedArray = getTypedArrayConstructor(nRows);
    for (const positionMap of this.substitutionsInfo.values()) {
      for (const indexMap of positionMap.values()) {
        for (const [index, indexArray] of indexMap.entries())
          indexMap.set(index, new TypedArray(indexArray));
      }
    }
  }

  joinDataFrames(positionColumns: string[], splitSeqDf: DG.DataFrame): void {
    // append splitSeqDf columns to source table and make sure columns are not added more than once
    const name = this._dataFrame.name;
    const dfColsSet = new Set(this._dataFrame.columns.names());
    if (!positionColumns.every((col: string) => dfColsSet.has(col))) {
      this._dataFrame.join(splitSeqDf, [C.COLUMNS_NAMES.ACTIVITY], [C.COLUMNS_NAMES.ACTIVITY],
        this._dataFrame.columns.names(), positionColumns, 'inner', true);
    }
    this._dataFrame.name = name;
    this.currentView.name = name;
  }

  sortSourceGrid(): void {
    const colNames: DG.GridColumn[] = [];
    for (let i = 1; i < this._sourceGrid.columns.length; i++)
      colNames.push(this._sourceGrid.columns.byIndex(i)!);

    colNames.sort((a, b)=>{
      if (a.column!.semType == C.SEM_TYPES.AMINO_ACIDS) {
        if (b.column!.semType == C.SEM_TYPES.AMINO_ACIDS)
          return 0;
        return -1;
      }
      if (b.column!.semType == C.SEM_TYPES.AMINO_ACIDS)
        return 1;
      return 0;
    });
    this._sourceGrid.columns.setOrder(colNames.map((v) => v.name));
  }

  createScaledCol(activityScaling: string, splitSeqDf: DG.DataFrame): void {
    const [scaledDf, newColName] = PeptidesModel.scaleActivity(
      activityScaling, this._dataFrame, this._dataFrame.tags[C.COLUMNS_NAMES.ACTIVITY]);
    //TODO: make another func
    const scaledCol = scaledDf.getCol(C.COLUMNS_NAMES.ACTIVITY_SCALED);
    scaledCol.semType = C.SEM_TYPES.ACTIVITY_SCALED;
    splitSeqDf.columns.add(scaledCol);
    const oldScaledCol = this._dataFrame.getCol(C.COLUMNS_NAMES.ACTIVITY_SCALED);
    this._dataFrame.columns.replace(oldScaledCol, scaledCol);
    const gridCol = this._sourceGrid.col(C.COLUMNS_NAMES.ACTIVITY_SCALED);
    if (gridCol !== null) {
      gridCol.name = newColName;
      this._dataFrame.tags[C.COLUMNS_NAMES.ACTIVITY_SCALED] = newColName;
    }

    this._sourceGrid.columns.setOrder([newColName]);
  }

  calculateStatistics(matrixDf: DG.DataFrame): DG.DataFrame {
    matrixDf = matrixDf.groupBy([C.COLUMNS_NAMES.POSITION, C.COLUMNS_NAMES.AMINO_ACID_RESIDUE]).aggregate();

    //calculate p-values based on t-test
    const matrixCols = matrixDf.columns;
    const mdCol= matrixCols.addNewFloat(C.COLUMNS_NAMES.MEAN_DIFFERENCE);
    const pValCol = matrixCols.addNewFloat(C.COLUMNS_NAMES.P_VALUE);
    const countCol = matrixCols.addNewInt(C.COLUMNS_NAMES.COUNT);
    const ratioCol = matrixCols.addNewFloat(C.COLUMNS_NAMES.RATIO);
    const aarCol = matrixDf.getCol(C.COLUMNS_NAMES.AMINO_ACID_RESIDUE);
    const posCol = matrixDf.getCol(C.COLUMNS_NAMES.POSITION);
    const activityCol: number[] = this._dataFrame.getCol(C.COLUMNS_NAMES.ACTIVITY_SCALED).toList();
    const sourceDfLen = activityCol.length;

    for (let i = 0; i < matrixDf.rowCount; i++) {
      const position: string = posCol.get(i);
      const aar: string = aarCol.get(i);
      const mask = DG.BitSet.create(sourceDfLen, (j) => this._dataFrame.get(position, j) == aar);
      const stats = getStats(activityCol, mask);

      mdCol.set(i, stats.meanDifference);
      pValCol.set(i, stats.pValue);
      countCol.set(i, stats.count);
      ratioCol.set(i, stats.ratio);
    }

    const countThreshold = 4;
    matrixDf = matrixDf.rows.match(`${C.COLUMNS_NAMES.COUNT} >= ${countThreshold}`).toDataFrame();
    matrixDf = matrixDf.rows.match(`${C.COLUMNS_NAMES.COUNT} <= ${sourceDfLen - countThreshold}`).toDataFrame();

    return matrixDf as DG.DataFrame;
  }

  setCategoryOrder(matrixDf: DG.DataFrame): void {
    let sortArgument: string = C.COLUMNS_NAMES.MEAN_DIFFERENCE;
    if (this.getViewer().bidirectionalAnalysis) {
      const mdCol = this.statsDf.getCol(sortArgument);
      sortArgument = 'Absolute Mean difference';
      const absMDCol = this.statsDf.columns.addNewFloat(sortArgument);
      absMDCol.init(i => Math.abs(mdCol.get(i)));
    }

    const aarWeightsDf = this.statsDf.groupBy([C.COLUMNS_NAMES.AMINO_ACID_RESIDUE]).sum(sortArgument, 'weight')
      .aggregate();
    const aarList = aarWeightsDf.getCol(C.COLUMNS_NAMES.AMINO_ACID_RESIDUE).toList();
    const getWeight = (aar: string): number => aarWeightsDf
      .groupBy(['weight'])
      .where(`${C.COLUMNS_NAMES.AMINO_ACID_RESIDUE} = ${aar}`)
      .aggregate()
      .get('weight', 0) as number;
    aarList.sort((first, second) => getWeight(second) - getWeight(first));

    matrixDf.getCol(C.COLUMNS_NAMES.AMINO_ACID_RESIDUE).setCategoryOrder(aarList);
  }

  createVerticalTable(): DG.DataFrame {
    // TODO: aquire ALL of the positions
    const columns = [C.COLUMNS_NAMES.MEAN_DIFFERENCE, C.COLUMNS_NAMES.AMINO_ACID_RESIDUE, C.COLUMNS_NAMES.POSITION,
      'Count', 'Ratio', C.COLUMNS_NAMES.P_VALUE];
    let sequenceDf = this.statsDf.groupBy(columns)
      .where('pValue <= 0.1')
      .aggregate();

    let tempStats: DG.Stats;
    const maxAtPos: {[index: string]: number} = {};
    const posColCategories = sequenceDf.getCol(C.COLUMNS_NAMES.POSITION).categories;
    const mdCol = sequenceDf.getCol(C.COLUMNS_NAMES.MEAN_DIFFERENCE);
    const posCol = sequenceDf.getCol(C.COLUMNS_NAMES.POSITION);
    const rowCount = sequenceDf.rowCount;
    for (const pos of posColCategories) {
      tempStats = DG.Stats.fromColumn(mdCol, DG.BitSet.create(rowCount, (i) => posCol.get(i) === pos));
      maxAtPos[pos] = this.getViewer().bidirectionalAnalysis ?
        (tempStats.max > Math.abs(tempStats.min) ? tempStats.max : tempStats.min) :
        tempStats.max;
    }
    sequenceDf = sequenceDf.clone(DG.BitSet.create(rowCount, (i) => mdCol.get(i) === maxAtPos[posCol.get(i)]));

    return sequenceDf;
  }

  createGrids(
    matrixDf: DG.DataFrame, positionColumns: string[], sequenceDf: DG.DataFrame, alphabet: string): DG.Grid[] {
    const sarGrid = matrixDf.plot.grid();
    sarGrid.sort([C.COLUMNS_NAMES.AMINO_ACID_RESIDUE]);
    sarGrid.columns.setOrder([C.COLUMNS_NAMES.AMINO_ACID_RESIDUE].concat(positionColumns as C.COLUMNS_NAMES[]));

    const sarVGrid = sequenceDf.plot.grid();
    sarVGrid.sort([C.COLUMNS_NAMES.POSITION]);
    const pValGridCol = sarVGrid.col(C.COLUMNS_NAMES.P_VALUE)!;
    pValGridCol.format = '#.000';
    pValGridCol.name = 'P-value';

    let tempCol = matrixDf.getCol(C.COLUMNS_NAMES.AMINO_ACID_RESIDUE);
    if (tempCol)
      setAARRenderer(tempCol, alphabet, sarGrid);

    tempCol = sequenceDf.getCol(C.COLUMNS_NAMES.AMINO_ACID_RESIDUE);
    if (tempCol)
      setAARRenderer(tempCol, alphabet, sarGrid);

    return [sarGrid, sarVGrid];
  }

  setCellRenderers(renderColNames: string[], sarGrid: DG.Grid, sarVGrid: DG.Grid): void {
    const mdCol = this.statsDf.getCol(C.COLUMNS_NAMES.MEAN_DIFFERENCE);
    //decompose into two different renering funcs
    const renderCell = (args: DG.GridCellRenderArgs): void => {
      const canvasContext = args.g;
      const bound = args.bounds;

      canvasContext.save();
      canvasContext.beginPath();
      canvasContext.rect(bound.x, bound.y, bound.width, bound.height);
      canvasContext.clip();

      // Hide row column
      const cell = args.cell;
      if (cell.isRowHeader && cell.gridColumn.visible) {
        cell.gridColumn.visible = false;
        args.preventDefault();
        return;
      }

      const tableColName = cell.tableColumn?.name;
      const tableRowIndex = cell.tableRowIndex!;
      if (cell.isTableCell && tableColName && tableRowIndex !== null && renderColNames.indexOf(tableColName) !== -1) {
        const cellValue: number | null = cell.cell.value;

        if (cellValue && cellValue !== DG.INT_NULL && cellValue !== DG.FLOAT_NULL) {
          const gridTable = cell.grid.table;
          const currentPosition: string = tableColName !== C.COLUMNS_NAMES.MEAN_DIFFERENCE ?
            tableColName : gridTable.get(C.COLUMNS_NAMES.POSITION, tableRowIndex);
          const currentAAR: string = gridTable.get(C.COLUMNS_NAMES.AMINO_ACID_RESIDUE, tableRowIndex);

          const viewer = this.getViewer();
          renderSARCell(canvasContext, currentAAR, currentPosition, this.statsDf, viewer.bidirectionalAnalysis, mdCol,
            bound, cellValue, this.currentSelection, viewer.showSubstitution ? this.substitutionsInfo : null);
        }
        args.preventDefault();
      }
      canvasContext.restore();
    };
    sarGrid.onCellRender.subscribe(renderCell);
    sarVGrid.onCellRender.subscribe(renderCell);
  }

  setTooltips(renderColNames: string[], sarGrid: DG.Grid, sarVGrid: DG.Grid): void {
    const showTooltip = (cell: DG.GridCell, x: number, y: number): boolean => {
      const tableCol = cell.tableColumn;
      const tableColName = tableCol?.name;
      const tableRowIndex = cell.tableRowIndex;

      if (!cell.isRowHeader && !cell.isColHeader && tableCol && tableRowIndex) {
        const table = cell.grid.table;
        const currentAAR = table.get(C.COLUMNS_NAMES.AMINO_ACID_RESIDUE, tableRowIndex);

        if (tableCol.semType == C.SEM_TYPES.AMINO_ACIDS) {
          this.showMonomerTooltip(currentAAR, x, y);
        } else if (cell.cell.value && renderColNames.includes(tableColName!)) {
          const currentPosition = tableColName !== C.COLUMNS_NAMES.MEAN_DIFFERENCE ? tableColName :
            table.get(C.COLUMNS_NAMES.POSITION, tableRowIndex);

          this.showTooltipAt(currentAAR, currentPosition, x, y);
        }
      }
      return true;
    };

    sarGrid.onCellTooltip(showTooltip);
    sarVGrid.onCellTooltip(showTooltip);
    this._sourceGrid.onCellTooltip((cell, x, y) => {
      const col = cell.tableColumn;
      const cellValue = cell.cell.value;
      if (cellValue && col && col.semType === C.SEM_TYPES.AMINO_ACIDS)
        this.showMonomerTooltip(cellValue, x, y);
      return true;
    });
  }

  showMonomerTooltip(aar: string, x: number, y: number): void {
    const tooltipElements: HTMLDivElement[] = [];
    //@ts-ignore: no types for org
    const monomer: type.HELMMonomer = org.helm.webeditor.monomers.getMonomer("HELM_AA", aar);
    if (monomer) {
      tooltipElements.push(ui.div(monomer.n));
      const options = {autoCrop: true, autoCropMargin: 0, suppressChiralText: true};
      tooltipElements.push(grok.chem.svgMol(monomer.m, undefined, undefined, options));
    } else {
      tooltipElements.push(ui.div(aar));
    }
    ui.tooltip.show(ui.divV(tooltipElements), x, y);
  }

  showTooltipAt(aar: string, position: string, x: number, y: number): void {
    const currentStatsDf = this.statsDf.rows.match({Pos: position, AAR: aar}).toDataFrame();
    const activityCol = this._dataFrame.columns.bySemType(C.SEM_TYPES.ACTIVITY_SCALED)!;
    const splitCol = DG.Column.bool(C.COLUMNS_NAMES.SPLIT_COL, activityCol.length);
    const currentPosCol = this._dataFrame.getCol(position);
    splitCol.init((i) => currentPosCol.get(i) == aar);
    const distributionTable = DG.DataFrame.fromColumns([activityCol, splitCol]);
    const stats: Stats = {
      count: currentStatsDf.get(C.COLUMNS_NAMES.COUNT, 0),
      ratio: currentStatsDf.get(C.COLUMNS_NAMES.RATIO, 0),
      pValue: currentStatsDf.get(C.COLUMNS_NAMES.P_VALUE, 0),
      meanDifference: currentStatsDf.get(C.COLUMNS_NAMES.MEAN_DIFFERENCE, 0),
    };
    const tooltip = getDistributionAndStats(
      distributionTable, stats, `${position} : ${aar}`, 'Other', true);

    ui.tooltip.show(tooltip, x, y);
  }

  setInteractionCallback(): void {
    const sarDf = this._sarGrid.dataFrame;
    const sarVDf = this._sarVGrid.dataFrame;

    const chooseAction = (aar: string, position: string, isShiftPressed: boolean) => {
      isShiftPressed ? this.modifyCurrentSelection(aar, position) : this.initCurrentSelection(aar, position);
    };

    const gridCellValidation = (gc: DG.GridCell | null) => !gc || !gc.cell.value || !gc.tableColumn ||
      gc.tableRowIndex == null || gc.tableRowIndex == -1;
    this._sarGrid.root.addEventListener('click', (ev) => {
      const gridCell = this._sarGrid.hitTest(ev.offsetX, ev.offsetY);
      if (gridCellValidation(gridCell) || gridCell!.tableColumn!.name == C.COLUMNS_NAMES.AMINO_ACID_RESIDUE)
        return;

      const position = gridCell!.tableColumn!.name;
      const aar = sarDf.get(C.COLUMNS_NAMES.AMINO_ACID_RESIDUE, gridCell!.tableRowIndex!);
      chooseAction(aar, position, ev.shiftKey);
    });

    this._sarVGrid.root.addEventListener('click', (ev) => {
      const gridCell = this._sarVGrid.hitTest(ev.offsetX, ev.offsetY);
      if (gridCellValidation(gridCell) || gridCell!.tableColumn!.name != C.COLUMNS_NAMES.MEAN_DIFFERENCE)
        return;

      const tableRowIdx = gridCell!.tableRowIndex!;
      const position = sarVDf.get(C.COLUMNS_NAMES.POSITION, tableRowIdx);
      const aar = sarVDf.get(C.COLUMNS_NAMES.AMINO_ACID_RESIDUE, tableRowIdx);
      chooseAction(aar, position, ev.shiftKey);
    });

    const cellChanged = (table: DG.DataFrame) => {
      if (this.isCellChanging)
        return;
      this.isCellChanging = true;
      table.currentRowIdx = -1;
      this.isCellChanging = false;
    };
    this._sarGrid.onCurrentCellChanged.subscribe((_gc) => cellChanged(sarDf));
    this._sarVGrid.onCurrentCellChanged.subscribe((_gc) => cellChanged(sarVDf));
  }

  modifyCurrentSelection(aar: string, position: string): void {
    const tempSelection = this.currentSelection;
    if (!tempSelection.hasOwnProperty(position))
      tempSelection[position] = [aar];
    else {
      const tempSelectionAt = tempSelection[position];
      const aarIndex = tempSelectionAt.indexOf(aar);
      aarIndex == -1 ? tempSelectionAt.push(aar) :
        tempSelectionAt.length == 1 ? delete tempSelection[position] :
          tempSelectionAt.splice(aarIndex, 1);
    }

    this.currentSelection = tempSelection;
  }

  initCurrentSelection(aar: string, position: string): void {
    const tempSelection: type.SelectionObject = {};
    tempSelection[position] = [aar];
    this.currentSelection = tempSelection;
  }

  invalidateGrids(): void {
    // this.stackedBarchart?.computeData();
    this._sarGrid.invalidate();
    this._sarVGrid.invalidate();
    this._sourceGrid?.invalidate();
    //TODO: this.peptideSpaceGrid.invalidate();
  }

  setBitsetCallback(): void {
    if (this.isBitsetChangedInitialized)
      return;
    const selection = this._dataFrame.selection;

    const changeBitset = (currentBitset: DG.BitSet): void => {

      const edfSelection = this.edf?.selection;
      if (this.isPeptideSpaceChangingBitset) {
        if (edfSelection == null)
          return;

        currentBitset.init((i) => edfSelection.get(i) ?? false, false);
        return;
      }

      const updateEdfSelection = () => {
        this.isChangingEdfBitset = true;
        edfSelection?.copyFrom(currentBitset);
        this.isChangingEdfBitset = false;
      };

      const positionList = Object.keys(this.currentSelection);
      if (positionList.length == 0) {
        currentBitset.init(() => false, false);
        updateEdfSelection();
        return;
      }

      //TODO: move out
      const getBitAt = (i: number) => {
        for (const position of positionList) {
          const positionCol: DG.Column<string> = this._dataFrame.getCol(position);
          if (this._currentSelection[position].includes(positionCol.get(i)!))
            return true;
        }
        return false;
      };
      currentBitset.init(getBitAt, false);

      updateEdfSelection();
    };

    selection.onChanged.subscribe(() => changeBitset(selection));
    this.isBitsetChangedInitialized = true;
  }

  fireBitsetChanged(isPeptideSpaceSource: boolean = false): void {
    this.isPeptideSpaceChangingBitset = isPeptideSpaceSource;
    this._dataFrame.selection.fireChanged();
    this.modifyOrCreateSplitCol();
    grok.shell.o = this.createAccordion().root;
    this.isPeptideSpaceChangingBitset = false;
  }

  postProcessGrids(invalidIndexes: number[], sarGrid: DG.Grid, sarVGrid: DG.Grid): void {
    this._sourceGrid.onCellPrepare((cell: DG.GridCell) => {
      const currentRowIndex = cell.tableRowIndex;
      if (currentRowIndex && invalidIndexes.includes(currentRowIndex) && !cell.isRowHeader)
        cell.style.backColor = DG.Color.lightLightGray;
    });

    const mdCol: DG.GridColumn = sarVGrid.col(C.COLUMNS_NAMES.MEAN_DIFFERENCE)!;
    mdCol.name = 'Diff';

    for (const grid of [sarGrid, sarVGrid]) {
      const gridProps = grid.props;
      gridProps.rowHeight = 20;
      const girdCols = grid.columns;
      const colNum = girdCols.length;
      for (let i = 0; i < colNum; ++i) {
        const col = girdCols.byIndex(i)!;
        const colName = col.name;
        if (grid == sarVGrid && colName !== 'Diff' && colName !== C.COLUMNS_NAMES.AMINO_ACID_RESIDUE)
          col.width = 50;
        else
          col.width = gridProps.rowHeight + 10;
      }
    }

    const setViewerGridProps = (grid: DG.Grid) => {
      grid.props.allowEdit = false;
      grid.props.allowRowSelection = false;
      grid.props.allowBlockSelection = false;
    };

    setViewerGridProps(sarGrid);
    setViewerGridProps(sarVGrid);
  }

  getSplitColValueAt(index: number, aar: string, position: string, aarLabel: string): string {
    const currentAAR = this._dataFrame.get(position, index) as string;
    return currentAAR === aar ? aarLabel : C.CATEGORIES.OTHER;
  }

  modifyOrCreateSplitCol(): void {
    const bs = this._dataFrame.selection;
    this.splitCol = this._dataFrame.col(C.COLUMNS_NAMES.SPLIT_COL) ??
      this._dataFrame.columns.addNewBool(C.COLUMNS_NAMES.SPLIT_COL);
    this.splitCol.init((i) => bs.get(i));
    this.splitCol.compact();
  }

  static scaleActivity(
    activityScaling: string, df: DG.DataFrame, originalActivityName?: string, cloneBitset = false,
  ): [DG.DataFrame, string] {
    let currentActivityColName = originalActivityName ?? C.COLUMNS_NAMES.ACTIVITY;
    const flag = df.columns.names().includes(currentActivityColName) &&
      currentActivityColName === originalActivityName;
    currentActivityColName = flag ? currentActivityColName : C.COLUMNS_NAMES.ACTIVITY;
    const tempDf = df.clone(cloneBitset ? df.filter : null, [currentActivityColName]);

    let formula = (v: number) => v;
    let newColName = 'activity';
    switch (activityScaling) {
    case 'none':
      break;
    case 'lg':
      formula = (v: number) => Math.log10(v);
      newColName = `Log10(${newColName})`;
      break;
    case '-lg':
      formula = (v: number) => -Math.log10(v);
      newColName = `-Log10(${newColName})`;
      break;
    default:
      throw new Error(`ScalingError: method \`${activityScaling}\` is not available.`);
    }

    const asCol = tempDf.columns.addNewFloat(C.COLUMNS_NAMES.ACTIVITY_SCALED);
    const activityCol = df.getCol(currentActivityColName);
    asCol.init(i => formula(activityCol.get(i)));
    df.tags['scaling'] = activityScaling;

    return [tempDf, newColName];
  }

  static splitAlignedPeptides(peptideColumn: DG.Column<string>, filter: boolean = true): [DG.DataFrame, number[]] {
    const separator = getSeparator(peptideColumn);
    const splitPeptidesArray: string[][] = [];
    let currentSplitPeptide: string[];
    let modeMonomerCount = 0;
    let currentLength;
    const colLength = peptideColumn.length;

    // splitting data
    const monomerLengths: {[index: string]: number} = {};
    for (let i = 0; i < colLength; i++) {
      currentSplitPeptide = peptideColumn.get(i)!.split(separator).map((value: string) => value ? value : '-');
      splitPeptidesArray.push(currentSplitPeptide);
      currentLength = currentSplitPeptide.length;
      monomerLengths[currentLength + ''] =
        monomerLengths[currentLength + ''] ? monomerLengths[currentLength + ''] + 1 : 1;
    }
    modeMonomerCount =
      parseInt(Object.keys(monomerLengths).reduce((a, b) => monomerLengths[a] > monomerLengths[b] ? a : b));

    // making sure all of the sequences are of the same size
    // and marking invalid sequences
    let nTerminal: string;
    const invalidIndexes: number[] = [];
    let splitColumns: string[][] = Array.from({length: modeMonomerCount}, (_) => []);
    modeMonomerCount--; // minus N-terminal
    for (let i = 0; i < colLength; i++) {
      currentSplitPeptide = splitPeptidesArray[i];
      nTerminal = currentSplitPeptide.pop()!; // it is guaranteed that there will be at least one element
      currentLength = currentSplitPeptide.length;
      if (currentLength !== modeMonomerCount)
        invalidIndexes.push(i);

      for (let j = 0; j < modeMonomerCount; j++)
        splitColumns[j].push(j < currentLength ? currentSplitPeptide[j] : '-');

      splitColumns[modeMonomerCount].push(nTerminal);
    }
    modeMonomerCount--; // minus C-terminal

    //create column names list
    const columnNames = Array.from({length: modeMonomerCount}, (_, index) => `${index + 1 < 10 ? 0 : ''}${index + 1 }`);
    columnNames.splice(0, 0, 'N');
    columnNames.push('C');

    // filter out the columns with the same values
    if (filter) {
      splitColumns = splitColumns.filter((positionArray, index) => {
        const isRetained = new Set(positionArray).size > 1;
        if (!isRetained)
          columnNames.splice(index, 1);

        return isRetained;
      });
    }

    return [
      DG.DataFrame.fromColumns(splitColumns.map((positionArray, index) => {
        return DG.Column.fromList('string', columnNames[index], positionArray);
      })),
      invalidIndexes,
    ];
  }

  syncProperties(isSourceSAR = true): void {
    if (this.sarViewer && this.sarViewerVertical) {
      const [sourceViewer, targetViewer] = isSourceSAR ? [this.sarViewer, this.sarViewerVertical] :
        [this.sarViewerVertical, this.sarViewer];
      const properties = sourceViewer.props.getProperties();
      const newProps: {[propName: string]: string | number | boolean} = {};
      for (const property of properties) {
        const propName = property.name;
        const propVal = property.get(sourceViewer);
        targetViewer.props.set(propName, propVal);
        newProps[propName] = propVal;
      }
      this.usedProperties = newProps;
    } else
      console.warn('Warning: could not sync viewer properties, one of the viewers is not initialized');
  }

  /** Class initializer */
  async init(): Promise<void> {
    if (this.isInitialized)
      return;
  
    //@ts-ignore
    // const orgHelm = org.helm;
    // //@ts-ignore
    // const types = Object.keys(org.helm.webeditor.monomerTypeList());
    // for (const type of types) {
    //   //@ts-ignore
    //   const GetMonomerSet = scil.helm.Monomers.getMonomerSet;
    //   const monomerSet: type.MonomerSet = new GetMonomerSet(type);
    //   for (const monomer of Object.values(monomerSet)) {
    //     if (this.monomerMap.hasOwnProperty(monomer.id))
    //       continue;
    //     this.monomerMap[monomer.id] = {molfile: monomer.m, fullName: monomer.n};
    //   }
    // }

    this.currentView = this._dataFrame.tags[C.PEPTIDES_ANALYSIS] == 'true' ? grok.shell.v as DG.TableView :
      grok.shell.addTableView(this._dataFrame);
    this._sourceGrid = this.currentView.grid;
    if (this._dataFrame.tags[C.PEPTIDES_ANALYSIS] == 'true')
      return;

    this._dataFrame.tags[C.PEPTIDES_ANALYSIS] = 'true';
    this._sourceGrid.col(C.COLUMNS_NAMES.ACTIVITY_SCALED)!.name = this._dataFrame.tags[C.COLUMNS_NAMES.ACTIVITY_SCALED];
    this._sourceGrid.columns.setOrder([this._dataFrame.tags[C.COLUMNS_NAMES.ACTIVITY_SCALED]]);

    this._dataFrame.temp[C.EMBEDDING_STATUS] = false;
    const adjustCellSize = (grid: DG.Grid): void => {
      const colNum = grid.columns.length;
      for (let i = 0; i < colNum; ++i) {
        const iCol = grid.columns.byIndex(i)!;
        iCol.width = isNaN(parseInt(iCol.name)) ? 50 : 40;
      }
      grid.props.rowHeight = 20;
    };

    for (let i = 0; i < this._sourceGrid.columns.length; i++) {
      const aarCol = this._sourceGrid.columns.byIndex(i);
      if (aarCol && aarCol.name && aarCol.column?.semType !== C.SEM_TYPES.AMINO_ACIDS &&
        aarCol.name !== this._dataFrame.tags[C.COLUMNS_NAMES.ACTIVITY_SCALED])
        aarCol.visible = false;
    }

    const options = {scaling: this._dataFrame.tags['scaling']};

    const dockManager = this.currentView.dockManager;

    this.sarViewer = await this._dataFrame.plot.fromType('peptide-sar-viewer', options) as SARViewer;

    this.sarViewerVertical =
      await this._dataFrame.plot.fromType('peptide-sar-viewer-vertical', options) as SARViewerVertical;

    const sarViewersGroup: viewerTypes[] = [this.sarViewer, this.sarViewerVertical];

    if (this._dataFrame.rowCount <= 10000) {
      const peptideSpaceViewerOptions = {method: 'UMAP', measure: 'Levenshtein', cyclesCount: 100};
      const peptideSpaceViewer =
        await this._dataFrame.plot.fromType('peptide-space-viewer', peptideSpaceViewerOptions) as PeptideSpaceViewer;
      dockManager.dock(peptideSpaceViewer, DG.DOCK_TYPE.RIGHT, null, 'Peptide Space Viewer');
    }

    this.updateDefault();
    await this.updateBarchart();

    dockViewers(sarViewersGroup, DG.DOCK_TYPE.RIGHT, dockManager, DG.DOCK_TYPE.DOWN);

    this._sourceGrid.props.allowEdit = false;
    adjustCellSize(this._sourceGrid);

    this.invalidateGrids();
  }

  invalidateSourceGrid(): void {this._sourceGrid.invalidate();}
}

type viewerTypes = SARViewer | SARViewerVertical;

function dockViewers(
  viewerList: viewerTypes[], attachDirection: DG.DockType, dockManager: DG.DockManager,
  initialAttachDirection?: DG.DockType): DG.DockNode[] | null {
  const viewerListLength = viewerList.length;
  if (viewerListLength === 0)
    return null;

  let currentViewer = viewerList[0];
  const nodeList = [dockManager.dock(currentViewer, initialAttachDirection, null, currentViewer.name ?? '')];
  const ratio = 1 / viewerListLength;

  for (let i = 1; i < viewerListLength; i++) {
    currentViewer = viewerList[i];
    nodeList.push(dockManager.dock(currentViewer, attachDirection, nodeList[i - 1], currentViewer.name ?? '', ratio));
  }
  return nodeList;
}
