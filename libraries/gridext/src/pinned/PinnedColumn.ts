import * as grok from 'datagrok-api/grok';
import * as DG from 'datagrok-api/dg';
import * as ui from 'datagrok-api/ui';
import * as GridUtils from '../utils/GridUtils';
import * as TextUtils from '../utils/TextUtils';
import {ColorUtils} from '../utils/ColorUtils';
import * as rxjs from 'rxjs';
import { GridCellRendererEx} from "../renderer/GridCellRendererEx";
import * as PinnedUtils from "./PinnedUtils";
import {getGridDartPopupMenu, isHitTestOnElement} from "../utils/GridUtils";
import {MouseDispatcher} from "../ui/MouseDispatcher";
import {ColumnsArgs, toDart} from "datagrok-api/dg";
//import {TableView} from "datagrok-api/dg";


/*
const hSubscriber  = grok.events.onViewLayoutApplied.subscribe((layout : DG.ViewLayout) => {
  const view : DG.TableView = layout.view as TableView;
  const itViewers = view.viewers;
  const arViewers = Array.from(itViewers);

  let viewer = null;
  const nViewerCount = arViewers.length;
  for (let n = 0; n < nViewerCount; ++n) {
    viewer = arViewers[n];
    if (viewer.type !== "Grid")
      continue;

    PinnedUtils.installPinnedColumns(viewer as DG.Grid);
  }
});
*/

function getRenderer(cell : DG.GridCell) : GridCellRendererEx | DG.GridCellRenderer {
  const colGrid = cell.gridColumn;
  if (colGrid === null || colGrid === undefined) {
    throw new Error('Grid cell is detached from the Grid column');
  }

  let renderer = GridUtils.getGridColumnRenderer(colGrid);
  if(renderer instanceof GridCellRendererEx) {
    return renderer;
  }

  return cell.renderer;
}


function getGrid(colGrid : DG.GridColumn) : DG.Grid | null {
  let grid : DG.Grid | null = colGrid.grid;
  if( grid === null) {
    grid = GridUtils.getInstalledGridForColumn(colGrid);
    if(grid instanceof DG.Grid)
      return grid;
  }

  return grid;
}


function notifyAllColsRowsResized(grid : DG.Grid, nHRows : number, bAdjusting : boolean) : void {

  let renderer : GridCellRendererEx | null = null
  let colGrid = null;
  const lstColsGrid = grid.columns;
  const nColCount = lstColsGrid.length;
  for(let nCol=0; nCol<nColCount; ++nCol) {
    colGrid = lstColsGrid.byIndex(nCol);
    if(colGrid === null || !colGrid.visible){
      continue
    }

    renderer = GridUtils.getGridColumnRenderer(colGrid);
    if (renderer instanceof GridCellRendererEx) {
      renderer.onResizeHeight(colGrid, grid, nHRows, bAdjusting);
    }
  }
}


function notifyAllPinnedColsRowsResized(colPinnedSource : PinnedColumn, nHRows : number, bAdjusting : boolean) : void {

  const colGridSource  = colPinnedSource.getGridColumn();
  if(colGridSource === null){
    return;
  }

  const grid = getGrid(colGridSource);
  const dart = DG.toDart(grid);
  if(dart.m_arPinnedCols === undefined) {
    throw new Error('Pinned Columns are not installed.');
  }

  let renderer : GridCellRendererEx | null = null
  let colPinned = null;
  let colGrid = null;
  const nPinnedColCount = dart.m_arPinnedCols.length;
  for(let nColPin=0; nColPin<nPinnedColCount; ++nColPin) {
    colPinned = dart.m_arPinnedCols[nColPin];
    colGrid = colPinned.m_colGrid;
    if(colGrid === null) {
      throw new Error('Pinned Column is detached.');
    }

    renderer = GridUtils.getGridColumnRenderer(colGrid);
    if (renderer instanceof GridCellRendererEx  && colPinned.m_root !== null && grid !== null) {
      renderer.onResizeHeight(colPinned, grid, nHRows, bAdjusting);
    }
  }
}


const DEBUG : boolean = false;


export class PinnedColumn {

  private static MIN_ROW_HEIGHT = 20;
  private static MAX_ROW_HEIGHT = 500;
  private static SELECTION_COLOR = ColorUtils.toRgb(ColorUtils.colSelection); //"rgba(237, 220, 88, 0.15)";
  private static ACTIVE_CELL_COLOR = ColorUtils.toRgb(ColorUtils.currentRow); //"rgba(153, 237, 82, 0.25)";
  private static Y_RESIZE_SENSITIVITY = 2;

  private m_fDevicePixelRatio : number;
  private m_colGrid : DG.GridColumn | null;
  private m_root : HTMLCanvasElement | null;
  private m_nWidthBug : number;
  //private m_observerResize : ResizeObserver | null;
  private m_observerResizeGrid : ResizeObserver | null;
  private m_handlerColsRemoved : any;
  private m_handlerColNameChanged : any;
  private m_handlerVScroll : any;
  private m_handlerRowsFiltering : any;
  private m_handlerCurrRow : any;
  private m_handlerSel : any;
  //private m_handlerFilter : any;
  private m_handlerRowsResized : any;
  private m_handlerRowsSorted : any;

  private m_nHResizeRowsBeforeDrag = -1;
  private m_nResizeRowGridDragging = -1;
  private m_nYResizeDraggingAnchor = -1;
  private m_nResizeRowGridMoving = -1;

  private m_nYDraggingAnchor = -1;
  private m_nRowGridDragging = -1;

  private m_nWheelCount : number = 0;


  private m_arXYMouseOnCellDown = [-2, -2];
  private m_arXYMouseOnCellUp = [-1, -1];
  private m_bSortedAscending : boolean | null = null;

  private m_cellCurrent : DG.GridCell | null = null;

  constructor(colGrid : DG.GridColumn) {

    MouseDispatcher.create();

    const grid = getGrid(colGrid);
    if(grid === null) {
      throw new Error("Column '" + colGrid.name + "' is not attached to the grid.");
    }

    if(!PinnedUtils.isPinnableColumn(colGrid)) {
      throw new Error("Column '" + colGrid.name + "' cannot be pinned. It either pinned or HTML.");
    }

    //let nRowMin = grid.minVisibleRow;
    //let nRowMax = grid.maxVisibleRow;
    //let nColMin = grid.minVisibleColumn;
    //let nColMax = grid.maxVisibleColumn;


    this.m_fDevicePixelRatio = window.devicePixelRatio;

    const dart = DG.toDart(grid);

    if(dart.m_arPinnedCols === undefined)
      dart.m_arPinnedCols = [];

    if(dart.m_arPinnedCols.length === 0 && !GridUtils.isRowHeader(colGrid)) {
      const colGrid0 = grid.columns.byIndex(0);
      if(colGrid0 !== null && colGrid0 !== undefined)
      new PinnedColumn(colGrid0);
    }

    const nWTotalPinnedCols = PinnedUtils.getTotalPinnedColsWidth(grid);
    dart.m_arPinnedCols.push(this);

    const viewTable = grid.view;
    const dframe = grid.dataFrame;

    const nW = colGrid.width;
    this.m_colGrid = colGrid;
    this.m_nWidthBug = -1;
    try {
      colGrid.visible = false;
    }
    catch(e) {
      //DG bug
      console.error("ERROR: Couldn't hide column '" + colGrid.name + "' due to a DG bug. Attempt to set the width to 0");
      try {
        this.m_nWidthBug = colGrid.width;
        colGrid.width = 0;
      } catch (e) {
        //DG bug
        console.error("ERROR: Couldn't set the width to 0 for column '" + colGrid.name + "' due to a DG bug. This could be ignored if the column visually looks ok.");
      }
    }

    if(!GridUtils.isRowHeader(colGrid)) {
      if (colGrid.settings === null || colGrid.settings === undefined)
        colGrid.settings = {};

      colGrid.settings.isPinned = true; //this will be saved with the layout
      colGrid.settings.idxPinned = dart.m_arPinnedCols.length - 1;
    }

    grid.canvas.style.left = (grid.canvas.offsetLeft + nW).toString() + "px";
    grid.overlay.style.left= (grid.overlay.offsetLeft + nW).toString() + "px";

    grid.canvas.style.width = (grid.canvas.offsetWidth - nW).toString() + "px";
    grid.overlay.style.width= (grid.overlay.offsetWidth - nW).toString() + "px";

    const nHeight = grid.canvas.height;//canvas pixel height
    const eCanvasThis = ui.canvas(nW*window.devicePixelRatio, nHeight);
    const tabIndex =  grid.canvas.getAttribute("tabIndex");
    if(tabIndex !== null)
     eCanvasThis.setAttribute("tabIndex", tabIndex);

    eCanvasThis.style.position = "absolute";
    eCanvasThis.style.left = nWTotalPinnedCols + "px";
    eCanvasThis.style.top = grid.canvas.offsetTop + "px";
    eCanvasThis.style.width = nW + "px";
    eCanvasThis.style.height = Math.round(nHeight/window.devicePixelRatio) + "px";

    //console.log("h " + grid.canvas.height + " offset " + grid.canvas.offsetHeight);

    if(grid.canvas.parentNode === null)
      throw new Error("Parent node for canvas cannot be null.");

    grid.canvas.parentNode.insertBefore(eCanvasThis, grid.canvas);
    this.m_root = eCanvasThis;


    const colGrid0 = grid.columns.byIndex(0);
    if(colGrid0 !== null && colGrid0 !== undefined) {//DG Bug from reading layout
    try{
        colGrid0.visible = false;
      }
      catch(e) {
        console.error("ERROR: Couldn't hide row header.");
      }
    }


    //OnResize Row header
    const headerThis = this;/*
    this.m_observerResize = new ResizeObserver(entries => {
      const g = headerThis.m_root.getContext('2d');
      for (let entry of entries) {
        headerThis.paint(g, grid);
      }
    });
    this.m_observerResize.observe(headerThis.m_root);*/



    //OnResize Grid
    this.m_observerResizeGrid = new ResizeObserver(function (entries : any) {

      const bCurrent =  DG.toDart(grok.shell.v) === DG.toDart(viewTable);
      if(!bCurrent)
        return;

      if(headerThis.m_fDevicePixelRatio !== window.devicePixelRatio || grid.canvas.height !== eCanvasThis.height) {
        eCanvasThis.width = nW*window.devicePixelRatio;
        eCanvasThis.height = grid.canvas.height;
        eCanvasThis.style.top = grid.canvas.offsetTop + "px";
        eCanvasThis.style.width = nW + "px";
        eCanvasThis.style.height = Math.round(grid.canvas.height/window.devicePixelRatio) + "px";

        headerThis.m_fDevicePixelRatio = window.devicePixelRatio;
      }

      //console.log("Grid Resize: " + grid.canvas.height + " " + window.devicePixelRatio);
      //eCanvasThis.style.height = grid.root.style.height;
/*
      const eCanvasNew = ui.canvas(nW, grid.root.offsetHeight);
      if(headerThis.m_root.parentNode !== null) {
        headerThis.m_root.parentNode.replaceChild(eCanvasNew, headerThis.m_root);
        headerThis.m_root = eCanvasNew;
      }*/
      //headerThis.m_root.height = grid.root.offsetHeight;
      const g = eCanvasThis.getContext('2d');
      for (let entry of entries) {
        setTimeout(()=> {headerThis.paint(g, grid);}, 100);
      }
    });

    this.m_observerResizeGrid?.observe(grid.canvas);

    const scrollVert = grid.vertScroll;
    this.m_handlerVScroll = scrollVert.onValuesChanged.subscribe(() => {
      const g = eCanvasThis.getContext('2d');
      headerThis.paint(g, grid);
    });

    this.m_handlerRowsFiltering = dframe.onRowsFiltering.subscribe(() => {
      setTimeout(() => {
        const g = eCanvasThis.getContext('2d');
        headerThis.paint(g, grid);
      }, 100);

    });

    this.m_handlerCurrRow = dframe.onCurrentRowChanged.subscribe(() => {
        const g = eCanvasThis.getContext('2d');
        headerThis.paint(g, grid);
      }
    );

    this.m_handlerSel = dframe.onSelectionChanged.subscribe((e : any) => {
        const g = eCanvasThis.getContext('2d');
        headerThis.paint(g, grid);
      }
    );

    this.m_handlerColsRemoved = dframe.onColumnsRemoved.subscribe((e : ColumnsArgs) => {

          if(headerThis.m_colGrid === null)
            return;
          for(let nC=0; nC<e.columns.length; ++nC) {
            if(e.columns[nC].name === headerThis.m_colGrid.name)
              headerThis.close();
          }
        }
    );

    this.m_handlerColNameChanged = dframe.onColumnNameChanged.subscribe((e : any) => {

          const dart = toDart(e);
          const strColNameOld = dart.newName;
          if(strColNameOld === headerThis.m_colGrid?.name) {
            const g = eCanvasThis.getContext('2d');
            headerThis.paint(g, grid);
          }
        }
    );


/*
    this.m_handlerFilter = dframe.onRowsFiltered.subscribe((e : any) => {
        const g = eCanvasThis.getContext('2d');
        headerThis.paint(g, grid);
      }
    );
*/

    this.m_handlerRowsResized = grid.onRowsResized.subscribe((e : any) => {
        const g = eCanvasThis.getContext('2d');
        headerThis.paint(g, grid);
      }
    );

    this.m_handlerRowsSorted = grid.onRowsSorted.subscribe((e : any) => {
        const g = eCanvasThis.getContext('2d');
        headerThis.paint(g, grid);
      }
    );
  }

  isPinned() : boolean {
    return this.m_colGrid !== null;
  }

  getGridColumn() : DG.GridColumn | null{
    return this.m_colGrid;
  }

  getWidth() : number {
    return this.m_root === null ? -1 : this.m_root.offsetWidth;
  }

  getRoot() : HTMLCanvasElement | null {
    return this.m_root;
  }

  public close() : void {

    if(this.m_colGrid === null) {
      throw new Error("Column has already been unpinned");
    }

    if(this.m_observerResizeGrid !== null) {
      this.m_observerResizeGrid.disconnect();
      this.m_observerResizeGrid = null;
    }
/*my changes
    if(this.m_observerResize !== null) {
      this.m_observerResize.disconnect();
      this.m_observerResize = null;
    }
    */

    this.m_handlerColsRemoved.unsubscribe();
    this.m_handlerColsRemoved = null;

    this.m_handlerColNameChanged.unsubscribe();
    this.m_handlerColNameChanged = null;

    this.m_handlerVScroll.unsubscribe();
    this.m_handlerVScroll = null;

    this.m_handlerRowsResized.unsubscribe();
    this.m_handlerRowsResized = null;

    this.m_handlerRowsSorted.unsubscribe();
    this.m_handlerRowsSorted = null;

    this.m_handlerRowsFiltering.unsubscribe();
    this.m_handlerRowsFiltering = null;

    this.m_handlerCurrRow.unsubscribe();
    this.m_handlerCurrRow = null;

    this.m_handlerSel.unsubscribe();
    this.m_handlerSel = null;

    const grid = getGrid(this.m_colGrid);
    if(grid === null){
      throw new Error("Column '" + this.m_colGrid.name + "' is disconnected from grid.");
    }

    const dart = DG.toDart(grid);
    const ar = dart.m_arPinnedCols;
    const nIdx = ar.indexOf(this);
    ar.splice(nIdx, 1);

    if(this.m_root === null)
      throw new Error('Root cannot be null');

    let nIdxPinned = -1;
    let colGridTmp= null;
    for(let n=nIdx; n<ar.length; ++n) {
      colGridTmp = ar[n];
      colGridTmp.m_root.style.left = (colGridTmp.m_root.offsetLeft - this.m_root.offsetWidth).toString() + "px";

      nIdxPinned =  colGridTmp.m_colGrid.settings.idxPinned;
      colGridTmp.m_colGrid.settings.idxPinned = n;
    }

    if(!GridUtils.isRowHeader(this.m_colGrid)) {
      this.m_colGrid.settings.idxPinned = -1;
      this.m_colGrid.settings.isPinned = false;
    }


    if(this.m_nWidthBug >= 0) {
      try {
        this.m_colGrid.width = this.m_nWidthBug;
      }
      catch(e) {
        //DG bug
        console.error("ERROR: Couldn't set the width to " + this.m_nWidthBug + " for column '" + this.m_colGrid.name + "' due to a DG bug. This could be ignored if the column visually looks ok.");
      }
    }

    try {
      this.m_colGrid.visible = true;
    }
    catch(e) {
      //DG bug
      console.error("ERROR: Couldn't show column '" + this.m_colGrid.name + "' due to a DG bug. This could be ignored if the column visually looks ok.");
    }

    grid.canvas.style.left = (grid.canvas.offsetLeft - this.m_root.offsetWidth).toString() + "px";
    grid.overlay.style.left= (grid.overlay.offsetLeft - this.m_root.offsetWidth).toString() + "px";
    grid.canvas.style.width = (grid.canvas.offsetWidth + this.m_root.offsetWidth).toString() + "px";
    grid.overlay.style.width= (grid.overlay.offsetWidth + this.m_root.offsetWidth).toString() + "px";

    if(this.m_root.parentNode !== null)
     this.m_root.parentNode.removeChild(this.m_root);

    this.m_root = null;

    if (dart.m_arPinnedCols.length === 1 && dart.m_arPinnedCols[0].m_colGrid.idx === 0 && this.m_colGrid.idx !== 0) {

        // try{colGrid0.visible = true;}
        try {
          dart.m_arPinnedCols[0].close();
        } catch (e) {
          console.error("ERROR: Couldn't close pinned column '" + dart.m_arPinnedCols[0].m_colGrid.name + "' ");
        }
    }
    this.m_colGrid = null;
  }


  public onMouseEnter(e : MouseEvent) : void {
    if(DEBUG)
      console.log('Mouse Enter Pinned Column: ' + this.getGridColumn()?.name);
  }

  public onMouseMove(e : MouseEvent) : void {
    if(DEBUG)
      console.log('Mouse Move Pinned Column: ' + this.getGridColumn()?.name);

    if(this.m_colGrid === null || this.m_root === null)
      return;

    const grid = this.m_colGrid.grid;
    const viewTable = grid.view;

    if(DG.toDart(grok.shell.v) !== DG.toDart(viewTable)) {
      return;
    }


    const arXYOnCell = [-1,-1];

    let nRowGrid = PinnedColumn.hitTestRows(this.m_root, grid, e, false, arXYOnCell);
    if(nRowGrid >= 0) {
      const cell = grid.cell(this.m_colGrid.name, nRowGrid);
      const renderer = getRenderer(cell);

      if (renderer instanceof GridCellRendererEx) {

        if (this.m_cellCurrent === null) {
          renderer.onMouseEnterEx(cell, e, arXYOnCell[0], arXYOnCell[1]);
        }

        if (this.m_cellCurrent !== null && nRowGrid !== this.m_cellCurrent.gridRow) {
          renderer.onMouseLeaveEx(this.m_cellCurrent, e, -1, -1);

          renderer.onMouseEnterEx(cell, e, arXYOnCell[0], arXYOnCell[1]);
        }

        renderer.onMouseMoveEx(cell, e, arXYOnCell[0], arXYOnCell[1]);
      }

      this.m_cellCurrent = cell;
    }
    else if (this.m_cellCurrent !== null) {
      const renderer = getRenderer(this.m_cellCurrent);
      if (renderer instanceof GridCellRendererEx) {
        renderer.onMouseLeaveEx(this.m_cellCurrent, e, -1, -1);
      }

      this.m_cellCurrent = null;
    }

    nRowGrid = PinnedColumn.hitTestRows(this.m_root, grid, e, true, undefined);
    if (nRowGrid >= 0) {
      this.m_nResizeRowGridMoving = nRowGrid;
      document.body.style.cursor = "row-resize";
      return;
    }

    if(this.m_nResizeRowGridMoving >= 0) {
      this.m_nResizeRowGridMoving = -1;
      document.body.style.cursor = "auto";
    }


    //Hamburger Menu
    const colGrid = this.getGridColumn();
    if(colGrid === null || colGrid.name === '')
      return;

    const eDivHamb = GridUtils.getToolIconDiv(colGrid.grid);
    const nHColHeader = GridUtils.getGridColumnHeaderHeight(colGrid.grid);
    if(0 <= e.offsetY && e.offsetY < nHColHeader) {

      eDivHamb?.style.removeProperty('visibility');
      eDivHamb?.setAttribute('column_name', colGrid.name);
      //console.log('ToolsIcon for column ' + colGrid.name);
      // @ts-ignore
      eDivHamb?.style.left = (PinnedUtils.getPinnedColumnLeft(this) + this.getWidth() - 18) + 'px';
      // @ts-ignore
      eDivHamb?.style.top = (GridUtils.getGridColumnHeaderHeight(colGrid.grid) - 16) + "px";
    } else {
      const colGrid = this.getGridColumn();
      if(colGrid != null) {
          eDivHamb?.setAttribute('column_name', '');
          // @ts-ignore
          eDivHamb?.style.visibility = 'hidden';
        }
    }
  }

  public onMouseDrag(e : MouseEvent) : void {
    if(DEBUG)
     console.log('Mouse Drag Pinned Column: ' + this.getGridColumn()?.name);

    if(this.m_colGrid === null || this.m_root === null)
    return;

    const grid = this.m_colGrid.grid;
    const viewTable = grid.view;

    if(DG.toDart(grok.shell.v) !== DG.toDart(viewTable)) {
      return;
    }

    const bResizing = this.m_nResizeRowGridDragging >= 0;
    if (bResizing) {

      //console.log("Dragging : " + headerThis.m_strColName);
      const nYDiff = e.clientY - this.m_nYResizeDraggingAnchor;
      let nHRowGrid = this.m_nHResizeRowsBeforeDrag + nYDiff;

      if (nHRowGrid < PinnedColumn.MIN_ROW_HEIGHT)
        nHRowGrid = PinnedColumn.MIN_ROW_HEIGHT;
      else if (nHRowGrid > PinnedColumn.MAX_ROW_HEIGHT)
        nHRowGrid = PinnedColumn.MAX_ROW_HEIGHT;

      const eCanvasThis = this.m_root;

      let g = eCanvasThis.getContext('2d');
      if(g === null)
        return;

      g.fillStyle = "white";
      const nHHeaderCols = GridUtils.getGridColumnHeaderHeight(grid);
      g.fillRect(0,nHHeaderCols, eCanvasThis.offsetWidth, eCanvasThis.offsetHeight);

      grid.setOptions({
        rowHeight: nHRowGrid //this won't trigger onRowsRezized event, which is a DG bug
      });

      notifyAllPinnedColsRowsResized(this, nHRowGrid, true);
      notifyAllColsRowsResized(grid, nHRowGrid, true);

      let header = null;
      const ar = grid.dart.m_arPinnedCols;
      for(let n=0; n<ar.length; ++n) {
        header = ar[n];
        g = header.m_root.getContext('2d');
        header.paint(g, grid);
      }

      try {
        const colGrid0 = grid.columns.byIndex(0);
        if (colGrid0 !== null)
          colGrid0.visible = false;//temporary addressed the DG bug
      }
      catch(e) {
        //DG bug
      }
      return;
    }


  }

  public onMouseLeave(e : MouseEvent, bOverlap : boolean) : void {
    if(DEBUG)
     console.log('Mouse Left Pinned Column: ' + this.getGridColumn()?.name + '  overlap: ' + bOverlap);

    if(this.m_nResizeRowGridMoving >= 0) {
      this.m_nResizeRowGridMoving = -1;
      document.body.style.cursor = "auto";
    }

    if(this.m_cellCurrent !== null) {
      const renderer = getRenderer(this.m_cellCurrent);
      if (renderer instanceof GridCellRendererEx) {
        const eMouse = e as MouseEvent;
        renderer.onMouseLeaveEx(this.m_cellCurrent, eMouse, -1, -1);
      }
      this.m_cellCurrent = null;
    }

    const colGrid = this.getGridColumn();
    if(colGrid != null && !bOverlap) {
      const eDivHamb = GridUtils.getToolIconDiv(colGrid.grid);
      eDivHamb?.setAttribute('column_name', '');
      // @ts-ignore
      eDivHamb?.style.visibility = 'hidden';
    }


  }

  public onMouseDblClick(e : MouseEvent) : void {
    if(DEBUG)
     console.log('Mouse Dbl Clicked Pinned Column: ' + this.getGridColumn()?.name);

    if(this.m_colGrid === null || this.m_root === null)
      return;

    const grid = this.m_colGrid.grid;
    const viewTable = grid?.view;

    if (DG.toDart(grok.shell.v) !== DG.toDart(viewTable)) {
      return;
    }

    if(this.m_colGrid?.name === '')
      return;

    if(this.m_bSortedAscending == null)
      this.m_bSortedAscending = true;
    else if(this.m_bSortedAscending)
      this.m_bSortedAscending = false;
    else this.m_bSortedAscending = true;

    const nHHeaderCols = GridUtils.getGridColumnHeaderHeight(grid);

    if(0 <= e.offsetX && e.offsetX <= this.m_root.offsetWidth &&
        0 <= e.offsetY && e.offsetY <= nHHeaderCols)   //on the rows header
    {
      grid?.sort([this.m_colGrid?.name], [this.m_bSortedAscending]);
    }
  }

  public onMouseDown(e : MouseEvent) : void {
    if(DEBUG)
     console.log('Mouse Down Pinned Column: ' + this.getGridColumn()?.name);
/*
    if(e.view != null) {
      const ee = document.createEvent( "MouseEvent" );
      ee.initMouseEvent(e.type, e.bubbles, e.cancelable, e.view, e.detail, e.screenX + 100, e.screenY, e.clientX + 100, e.clientY, e.ctrlKey, e.altKey, e.shiftKey, e.metaKey, e.button, e.relatedTarget);
      this.m_colGrid?.grid.root.dispatchEvent(ee);
      return;
    }
*/

    if(this.m_colGrid === null)
      return;

    const grid = this.m_colGrid?.grid;
    const viewTable = grid?.view;
    if(DG.toDart(grok.shell.v) !== DG.toDart(viewTable))
      return;

    if(e.buttons !== 1)
      return;

    let eCanvasThis = this.m_root;
    if(eCanvasThis === null)
      return;

    this.m_nResizeRowGridMoving = -1;
    const bAddToSel : boolean = e.ctrlKey || e.shiftKey;

    let nRowGrid = bAddToSel ? -1 : PinnedColumn.hitTestRows(eCanvasThis, grid, e, true, undefined);
    if (nRowGrid >= 0) {
      const nHRows = GridUtils.getGridRowHeight(grid);
      this.m_nResizeRowGridDragging = nRowGrid;
      this.m_nYResizeDraggingAnchor = e.clientY;
      this.m_nHResizeRowsBeforeDrag = nHRows;
    }
    else
    {

      nRowGrid = PinnedColumn.hitTestRows(eCanvasThis, grid, e, false, this.m_arXYMouseOnCellDown);

      this.m_nRowGridDragging = nRowGrid;
      this.m_nYDraggingAnchor = e.clientY;

      const cell = grid.cell(this.m_colGrid.name, nRowGrid);
      const renderer = getRenderer(cell);
      if(renderer instanceof GridCellRendererEx) {
        renderer.onMouseDownEx(cell, e, this.m_arXYMouseOnCellDown[0], this.m_arXYMouseOnCellDown[1]);
      }
    }
  }

  public onMouseUp(e : MouseEvent) : void {
    if(DEBUG)
     console.log('Mouse Up Pinned Column: ' + this.getGridColumn()?.name);
/*
    if(e.view != null) {
      const ee = document.createEvent( "MouseEvent" );
      ee.initMouseEvent(e.type, e.bubbles, e.cancelable, e.view, e.detail, e.screenX + 100, e.screenY, e.clientX + 100, e.clientY, e.ctrlKey, e.altKey, e.shiftKey, e.metaKey, e.button, e.relatedTarget);
      this.m_colGrid?.grid.root.dispatchEvent(ee);
      return;
    }
*/

    if(this.m_colGrid === null || this.m_root == null)
      return;

    const grid = this.m_colGrid?.grid;
    const viewTable = grid?.view;

    if(DG.toDart(grok.shell.v) !== DG.toDart(viewTable)) {
      return;
    }
/*
   if(e.button === 2) {

     const eDivPOpup : HTMLElement | null = GridUtils.getGridDartPopupMenu();
     eDivPOpup?.setAttribute('column_name', this.m_colGrid.name);
     let d = 0;
     return;
   }*/


    if(this.m_nResizeRowGridDragging >= 0) {
      const nHRow = GridUtils.getGridRowHeight(grid);
      notifyAllPinnedColsRowsResized(this, nHRow, false);
      notifyAllColsRowsResized(grid, nHRow, false);
    }

    this.m_nHResizeRowsBeforeDrag = -1;
    this.m_nResizeRowGridDragging = -1;
    this.m_nYResizeDraggingAnchor = -1;
    this.m_nResizeRowGridMoving = -1;

    document.body.style.cursor = "auto";

    if(this.m_nRowGridDragging >= 0) {
      const dframe = grid.dataFrame;
      const bAddToSel = e.ctrlKey;
      const bRangeSel = e.shiftKey;

      const nRowGrid = PinnedColumn.hitTestRows(this.m_root, grid, e, false, this.m_arXYMouseOnCellUp);
      if(!bAddToSel && !bRangeSel && nRowGrid === this.m_nRowGridDragging) { //click on the same row which will become active

        let cellRH = null;
        try {
          cellRH = grid.cell("", nRowGrid);
        }
        catch(e) {
          let colG = null;
          const lstCols = grid.columns;
          for(let nC=1; nC<lstCols.length; ++nC) {
            colG = lstCols.byIndex(nC);
            cellRH = colG === null ? null : grid.cell(colG.name, nRowGrid);
            if(cellRH !== null)
              break;
          }
        }
        if(cellRH !== null) {
          const nRowTable : any = cellRH.tableRowIndex;
          if(nRowTable !== null)
            dframe.currentRow = nRowTable;
        }
      }
      else
      {
        const bitsetSel = dframe.selection;

        if(!bAddToSel || bRangeSel)
          bitsetSel.setAll(false, true);

        let nRowMin = this.m_nRowGridDragging < nRowGrid ? this.m_nRowGridDragging : nRowGrid;
        let nRowMax = this.m_nRowGridDragging > nRowGrid ? this.m_nRowGridDragging : nRowGrid;

        if(bRangeSel) {
          let nRowGridActive = GridUtils.getActiveGridRow(grid);
          if(nRowGridActive === null)
            nRowGridActive = 0;

          nRowMin = nRowGridActive < nRowGrid ? nRowGridActive : nRowGrid;
          nRowMax = nRowGridActive > nRowGrid ? nRowGridActive : nRowGrid;
        }


        let cellRH = null;
        let nRowTable = -1;
        for(let nRow=nRowMin; nRow<=nRowMax; ++nRow) {

          try {
            cellRH = grid.cell("", nRow);
          }
          catch(e) {
            let colG = null;
            const lstCols = grid.columns;
            for(let nC=1; nC<lstCols.length; ++nC) {
              colG = lstCols.byIndex(nC);
              cellRH = colG === null ? null : grid.cell(colG.name, nRowGrid);
              if(cellRH !== null)
                break;
            }
          }

          if(cellRH !== null && cellRH.tableRowIndex !== null) {
            nRowTable = cellRH.tableRowIndex;
            bitsetSel.set(nRowTable, true, true);
          }
        }
      }

      const cell = grid.cell(this.m_colGrid.name, nRowGrid);
      const renderer = getRenderer(cell);
      if(renderer instanceof GridCellRendererEx) {
        renderer.onMouseUpEx(cell, e, this.m_arXYMouseOnCellUp[0], this.m_arXYMouseOnCellUp[1]);
      }

      if(this.m_arXYMouseOnCellUp[0] === this.m_arXYMouseOnCellDown[0] && this.m_arXYMouseOnCellDown[1] === this.m_arXYMouseOnCellUp[1]) {
        if(renderer instanceof GridCellRendererEx) {
          renderer.onClickEx(cell, e, this.m_arXYMouseOnCellUp[0], this.m_arXYMouseOnCellUp[1]);
        }
      }

      this.m_nRowGridDragging = -1;
      this.m_nYDraggingAnchor = -1;
      this.m_arXYMouseOnCellDown[0] = -2;
      this.m_arXYMouseOnCellDown[1] = -2;
      this.m_arXYMouseOnCellUp[0] = -1;
      this.m_arXYMouseOnCellUp[1] = -1;
    }
  }

  public onContextMenu(e : MouseEvent) : void {
   if(DEBUG)
    console.log('Context menu Pinned Column: ' + this.getGridColumn()?.name);
  }

  public onMouseWheel(e : WheelEvent) : void {

    if(this.m_colGrid === null || this.m_root == null)
      return;

    const grid = this.m_colGrid?.grid;
    const viewTable = grid?.view;

    if (DG.toDart(grok.shell.v) !== DG.toDart(viewTable)) {
      return;
    }

    if(e.deltaX !== 0 || e.deltaZ !== 0) {
      return;
    }

    setTimeout(() =>{
      const ee = new WheelEvent(e.type, e);
      try{grid.overlay.dispatchEvent(ee);}
      catch(ex) {
        //console.error(ex.message);
      }
    }, 1);


    if(true)
      return;
    //e.clientX = 5;


    if(this.m_nWheelCount === 1) {
      //scroll +
      const nRowCount = GridUtils.getGridVisibleRowCount(grid);
      const scrollY = grid.vertScroll;
      if(nRowCount -1 > scrollY.max) {
        scrollY.setValues(scrollY.minRange, scrollY.maxRange, scrollY.min + 1, scrollY.max + 1);
      }
      this.m_nWheelCount = 0;
    }
    else if(this.m_nWheelCount === -1)
    {
      //scroll -
      const scrollY = grid.vertScroll;
      if(scrollY.min >=1) {
        scrollY.setValues(scrollY.minRange, scrollY.maxRange, scrollY.min - 1, scrollY.max - 1);
      }
      this.m_nWheelCount = 0;
    }
    else {
      this.m_nWheelCount = e.deltaY > 0 ? 1 : -1;
    }
  }


  private paint(g : CanvasRenderingContext2D | null, grid : DG.Grid) : void {
    //const nWDiv = entry.contentBoxSize ? entry.contentBoxSize[0].inlineSize : entry.contentRect.width;

    if(g === null) {
      return;
    }

    if(this.m_root === null) {
      throw new Error('Root cannot be null.');
    }

    if(this.m_colGrid === null) {
      throw new Error('Column grid cannot be null.');
    }
    const dframe = grid.dataFrame;
    const nW = this.m_root.offsetWidth;
    const nH = this.m_root.offsetHeight;

    g.fillStyle = "white";
    g.fillRect(0,0, nW*window.devicePixelRatio, nH*window.devicePixelRatio);

    if(this.m_colGrid.name === null)
      return;

    const bitsetFilter = dframe.filter;
    if(bitsetFilter.falseCount === dframe.rowCount)
      return; //everything is filtered

    //column Header
    const options : any = grid.getOptions(true);

    const fontCellDefault = options.look.defaultCellFont;

    let font = options.look.colHeaderFont == null || options.look.colHeaderFont === undefined ? "bold 14px Volta Text, Arial" : options.look.colHeaderFont;
    let fontScaled = GridUtils.scaleFont(font, window.devicePixelRatio);
    g.font = fontScaled;

    let str = TextUtils.trimText(this.m_colGrid.name, g, nW);

    const tm = g.measureText(str);
    const nWLabel = tm.width;

    const nAscent = Math.abs(tm.actualBoundingBoxAscent);
    const nDescent = tm.actualBoundingBoxDescent;
    const nHFont =  nAscent + nDescent;// + 2*nYInset;

    //let cellCH = grid.cell(this.m_colGrid.name, -1);
    //let renderer = cellCH.renderer;

    let nX = 0;
    let nY = 0;
    const nHCH = GridUtils.getGridColumnHeaderHeight(grid)*window.devicePixelRatio;
    g.textAlign = 'start';
    g.fillStyle = "Black";
    let nYOffset = Math.floor((nHCH - nHFont)/2);
    const nXX = nX + ((nW*window.devicePixelRatio - nWLabel) >> 1);
    let nYY = (nY + nHCH - Math.ceil(3*window.devicePixelRatio));//-2*window.devicePixelRatio);
    //onsole.log("nXX " + nXX + " nYY = " + nYY + " CHH " + nHCH);
    g.fillText(str, nXX, nYY);

    //if(options.look.showRowGridlines) {


    //}



    //Regular cells
    const nRowCurrent =  dframe.currentRow.idx;
    const bitsetSel = dframe.selection;

    const arRowsMinMax = [-1,-1];
    GridUtils.fillVisibleViewportRows(arRowsMinMax, grid);
    const nRowMin = arRowsMinMax[0];
    const nRowMax = arRowsMinMax[1];

    //console.log(nRowMin + " " + nRowMax);
    const nHRow = GridUtils.getGridRowHeight(grid);
    nYOffset = nHCH;
    const nHRowGrid = nHRow*window.devicePixelRatio;
    let cellRH = null;

    let nWW = nW*window.devicePixelRatio;
    //const nHH = nHRowGrid;

    const arTableRows = new Array(nRowMax - nRowMin +1);
    let nRowTable = -1;
    let bSel = false;
    for(let nRG=nRowMin; nRG<=nRowMax; ++nRG) {
      try {
        cellRH = grid.cell(this.m_colGrid.name, nRG);
      } catch (e) //to address DG bug when everything is filtered
      {
        continue;
      }

      if (cellRH.tableRowIndex === undefined)//DG bug
        continue;

      nRowTable = cellRH.tableRowIndex === null ? -1 : cellRH.tableRowIndex;
      arTableRows[nRG - nRowMin] = nRowTable;

      nYY = nYOffset + (nRG - nRowMin) * nHRowGrid;

      let renderer: any = GridUtils.getGridColumnRenderer(cellRH.gridColumn);
      if (renderer === null) {
        try {
          renderer = cellRH.renderer;
        } catch (e) {
          console.error("Could not obtain renderer for DG cell. DG bug " + this.m_colGrid.name + " row " + nRG);
          continue;
        }
      }

      if (renderer === null || renderer === undefined) {
        console.error("Couldn't find renderer for pinned column " + this.m_colGrid.name + " row " + nRG);
        continue;
      }

      //let nYY = nY;//*window.devicePixelRatio;


      font = cellRH.style.font;
      fontScaled = GridUtils.scaleFont(font, window.devicePixelRatio);
      if (fontScaled !== null) {
        cellRH.style.font = fontScaled;
      }

      if (nW > 0 && nHRowGrid > 0) { //to address a bug caused either DG or client app
        try {
          if (renderer.name === 'Molecule') {
            renderer.render(g, 0, nYY/window.devicePixelRatio, nWW/window.devicePixelRatio, nHRowGrid/window.devicePixelRatio, cellRH, cellRH.style);
          }
          else renderer.render(g, 0, nYY, nWW, nHRowGrid, cellRH, cellRH.style);

        } catch (e) {
          console.error("Could not paint cell for pinned column " + this.m_colGrid.name + " row " + nRG);
          continue;
          //throw e;
        }
      }
    }


    //Paint Grid
    g.strokeStyle = "Gainsboro";
    g.beginPath();
    g.moveTo(0, nY*window.devicePixelRatio);
    g.lineTo(0, (nY + nHCH-1*window.devicePixelRatio));
    g.stroke();

    g.beginPath();
    g.moveTo(0, nYOffset + 1);
    g.lineTo(nWW, nYOffset + 1);
    g.stroke();

    for(let nRG=nRowMin; nRG<=nRowMax; ++nRG)
    {
      nYY = nYOffset + (nRG - nRowMin) * nHRowGrid;

      //if(options.look.showRowGridlines) {

        g.beginPath();
        g.moveTo(0, nYY + nHRowGrid+1);
        g.lineTo(nWW, nYY + nHRowGrid+1);
        g.stroke();

        g.beginPath();
        g.moveTo(0, nYY);
        g.lineTo(0, nYY + nHRowGrid+1);
        g.stroke();
      //}
      nRowTable = arTableRows[nRG - nRowMin];
      try{bSel = nRowTable === undefined || nRowTable < 0 ? false : bitsetSel.get(nRowTable);}
      catch (e){
        console.error('PaintError: row_min: ' + nRowMin + ' row_max: ' + nRowMax + ' nR ' + nRG + ' ' + nRowTable);
        throw e;
      }
      if(bSel)
      {
        g.globalAlpha = 0.2;
        g.fillStyle = PinnedColumn.SELECTION_COLOR;
        g.fillRect(0, nYY, nWW, nHRowGrid);
        g.globalAlpha = 1;
      }

      if(nRowCurrent === nRowTable)
      {
        g.globalAlpha = 0.2;
        g.fillStyle = PinnedColumn.ACTIVE_CELL_COLOR;
        g.fillRect(0, nYY, nWW, nHRowGrid);
        g.globalAlpha = 1;
      }
    }
  }


  private static hitTestRows(eCanvasPinned : HTMLCanvasElement, grid : DG.Grid, e : MouseEvent, bBorder : boolean, arXYOnCell : Array<number> | undefined)
  {
    const rect = eCanvasPinned.getBoundingClientRect();
    const scrollLeft= window.pageXOffset || document.documentElement.scrollLeft;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const nY = rect.top  + scrollTop;
    const nX = rect.left + scrollLeft;

    if(nX <= e.clientX && e.clientX <= nX + eCanvasPinned.offsetWidth)   //on the rows header
    {
      const nHHeaderCols = GridUtils.getGridColumnHeaderHeight(grid);
      const nHRowGrid = GridUtils.getGridRowHeight(grid);

      const arMinMaxRows = [-1,-1];
      GridUtils.fillVisibleViewportRows(arMinMaxRows, grid);
      const nRowMin = arMinMaxRows[0];
      const nRowMax = arMinMaxRows[1];

      const nYMouseOnHeader = e.clientY - nY;

      let nYBorder = -1;
      let nYDiff = -1;

      for(let nRow=nRowMin; nRow<= nRowMax; ++nRow)
      {
        nYBorder = nHHeaderCols + (nRow - nRowMin+1)*nHRowGrid;
        nYDiff = nYMouseOnHeader - nYBorder;

        if(bBorder && Math.abs(nYDiff) <= PinnedColumn.Y_RESIZE_SENSITIVITY)
        {
          return nRow;
        }

        if(!bBorder && nYBorder - nHRowGrid <= nYMouseOnHeader && nYMouseOnHeader <= nYBorder) {

          if(arXYOnCell !== undefined) {
            arXYOnCell[0] = e.clientX - nX;
            arXYOnCell[1] = nYMouseOnHeader - nYBorder + nHRowGrid;
          }

          return nRow;
        }
      }
    }

    return -1;
  }
}
