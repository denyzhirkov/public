import * as DG from 'datagrok-api/dg';
import * as TextUtils from "./TextUtils";
/*
const canvas = ui.canvas(200*r, 300*r);

cellGrid.renderer.render(10, 10, 200, 300);

const r = window.devicePixelRatio;
x = r * x; y = r * y;
w = r * w; h = r * h;
*/
export function getGridDartPopupMenu() {
    let eDiv = null;
    const cDiv = document.getElementsByClassName('d4-menu-item-container d4-vert-menu d4-menu-popup');
    for (let n = 0; n < cDiv.length; ++n) {
        eDiv = cDiv.item(n);
        return eDiv;
    }
    return null;
}
export function getToolIconDiv(grid) {
    const cImg = document.getElementsByClassName('grok-icon grok-font-icon-menu');
    let eDivHamb = null;
    let eParent = null;
    for (let n = 0; n < cImg.length; ++n) {
        eDivHamb = cImg.item(n).parentElement;
        if (eDivHamb == null)
            return null;
        if ((eDivHamb === null || eDivHamb === void 0 ? void 0 : eDivHamb.getAttribute('column_name')) !== null) { //'data') === 'ColHamb') {
            eParent = eDivHamb.parentElement;
            while (eParent !== null) {
                if (eParent === grid.root)
                    return eDivHamb;
                eParent = eParent.parentElement;
            }
        }
    }
    return null;
}
export function isHitTestOnElement(eElem, eMouse) {
    const eElemHit = document.elementFromPoint(eMouse.clientX, eMouse.clientY);
    const b = eElemHit == eElem;
    return b;
}
export function isRowHeader(colGrid) {
    return colGrid.idx === 0 || colGrid.name === 'row header';
}
export function getInstalledGridForColumn(colGrid) {
    const dart = DG.toDart(colGrid);
    if (!(dart.m_grid instanceof DG.Grid))
        return null;
    return dart.m_grid;
}
export function installGridForColumn(grid, colGrid) {
    if (colGrid.grid instanceof DG.Grid)
        return false;
    const dart = DG.toDart(colGrid);
    if (dart.m_grid instanceof DG.Grid)
        return false;
    dart.m_grid = grid;
    return true;
}
export function setGridColumnRenderer(colGrid, renderer) {
    const dart = DG.toDart(colGrid);
    dart.m_renderer = renderer;
}
export function getGridColumnRenderer(colGrid) {
    const dart = DG.toDart(colGrid);
    const renderer = dart.m_renderer;
    if (renderer === undefined)
        return null;
    return renderer;
}
export function getGridColumnHeaderHeight(grid) {
    const options = grid.getOptions(true);
    let nHColHeader = options.look.colHeaderHeight;
    if (nHColHeader === null || nHColHeader === undefined) { //DG bug
        const cellGrid = grid.hitTest(2, 2); //.cell(col.name, 0);
        if (cellGrid !== null) {
            const rc = cellGrid.bounds;
            return rc.y;
            //console.log('rc.y ' + rc.y + " rc.h= " + rc.height + " row " + cellGrid.gridRow + " name " +  cellGrid.gridColumn.name);
        }
    }
    return nHColHeader;
}
export function getGridRowHeight(grid) {
    const options = grid.getOptions(true);
    const nHRow = options.look.rowHeight;
    if (nHRow === null || nHRow === undefined) { //DG bug
        let col = null;
        const nColCount = grid.columns.length;
        for (let nCol = 0; nCol < nColCount; ++nCol) {
            col = grid.columns.byIndex(nCol);
            if (col === null || !col.visible)
                continue;
            const cellGrid = grid.cell(col.name, 0);
            const rc = cellGrid.bounds;
            return rc.height;
        }
        return -1;
    }
    return nHRow;
}
export function getGridVisibleRowCount(grid) {
    const dframe = grid.dataFrame;
    const bitsetFilter = dframe.filter;
    const nRowCount = bitsetFilter.trueCount;
    return nRowCount;
}
export function fillVisibleViewportRows(arMinMaxRowIdxs, grid) {
    if (arMinMaxRowIdxs.length !== 2)
        throw new Error("Array to cobtain indices must have the length 2.");
    const scroll = grid.vertScroll;
    const nRowMin = Math.floor(scroll.min);
    let nRowMax = Math.ceil(scroll.max);
    const nRowCount = getGridVisibleRowCount(grid);
    if (nRowMax >= nRowCount) {
        nRowMax = nRowCount - 1;
    }
    arMinMaxRowIdxs[0] = nRowMin;
    arMinMaxRowIdxs[1] = nRowMax;
    //console.log('min: ' + scroll.min + " max: " + scroll.max + ' nRowMax ' + nRowMax + " nVisRowCount: " + nRowCount);
}
export function fillVisibleViewportGridCells(arColRowIdxs, grid) {
    if (arColRowIdxs.length !== 4)
        throw new Error("Array to cobtain bound row column indices must have the length 4.");
    const arRowIdxs = [];
    const arColIdxs = [];
    const lstVisibleCells = grid.getVisibleCells();
    for (let cellGTmp of lstVisibleCells) {
        if (!arRowIdxs.includes(cellGTmp.gridRow))
            arRowIdxs.push(cellGTmp.gridRow);
        if (!arColIdxs.includes(cellGTmp.gridColumn.idx))
            arColIdxs.push(cellGTmp.gridColumn.idx);
    }
    const nRowMin = arRowIdxs.length === 0 ? -1 : arRowIdxs[0];
    const nRowMax = arRowIdxs.length === 0 ? -2 : arRowIdxs[arRowIdxs.length - 1];
    arColRowIdxs[0] = arColIdxs.length === 0 ? -1 : arColIdxs[0];
    arColRowIdxs[1] = arColIdxs.length === 0 ? -2 : arColIdxs[arColIdxs.length - 1];
    arColRowIdxs[2] = nRowMin;
    arColRowIdxs[3] = nRowMax;
}
export function getActiveGridRow(grid) {
    const dframe = grid.dataFrame;
    const nRowTableActive = dframe.currentRow.idx;
    const nGridColCount = grid.columns.length;
    let colGrid = null;
    let cellGrid = null;
    for (let nCol = 0; nCol < nGridColCount; ++nCol) {
        colGrid = grid.columns.byIndex(nCol);
        if (colGrid === null || colGrid === void 0 ? void 0 : colGrid.visible) {
            const nGridRowCount = dframe.filter.trueCount;
            for (let nR = 0; nR < nGridRowCount; ++nR) {
                cellGrid = grid.cell(colGrid.name, nR);
                if (cellGrid.tableRowIndex === null || nRowTableActive === null)
                    continue;
                if (cellGrid.tableRowIndex === nRowTableActive)
                    return nR;
            }
            return -1;
        }
    }
    return -1;
}
const m_mapScaledFonts = new Map();
export function scaleFont(font, fFactor) {
    if (fFactor === 1.0) {
        return font;
    }
    const strKey = font + fFactor.toString();
    let fontScaled = m_mapScaledFonts.get(strKey);
    if (fontScaled !== undefined)
        return fontScaled;
    const nFontSize = TextUtils.getFontSize(font);
    fontScaled = TextUtils.setFontSize(font, Math.ceil(nFontSize * fFactor));
    m_mapScaledFonts.set(strKey, fontScaled);
    return fontScaled;
}
export function paintColHeaderCell(g, nX, nY, nW, nH, colGrid) {
    if (g === null)
        return;
    g.fillStyle = "white";
    g.fillRect(nX * window.devicePixelRatio, nY * window.devicePixelRatio, nW * window.devicePixelRatio, nH * window.devicePixelRatio);
    const grid = colGrid.grid;
    const options = grid.getOptions(true);
    const font = options.look.colHeaderFont == null || options.look.colHeaderFont === undefined ? "bold 14px Volta Text, Arial" : options.look.colHeaderFont;
    const fontNew = scaleFont(font, window.devicePixelRatio);
    g.font = fontNew;
    let str = TextUtils.trimText(colGrid.name, g, nW);
    const tm = g.measureText(str);
    const nWLabel = tm.width;
    const nAscent = Math.abs(tm.actualBoundingBoxAscent);
    const nDescent = tm.actualBoundingBoxDescent;
    const nHFont = nAscent + nDescent; // + 2*nYInset;
    const nHH = nH * window.devicePixelRatio;
    g.textAlign = 'start';
    g.fillStyle = "Black";
    const nXX = nX * window.devicePixelRatio + Math.ceil(3 * window.devicePixelRatio); //((nW*window.devicePixelRatio - nWLabel) >> 1);
    const nYY = (nY * window.devicePixelRatio + nHH - Math.ceil(3 * window.devicePixelRatio)); //-2*window.devicePixelRatio);
    g.fillText(str, nXX, nYY);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiR3JpZFV0aWxzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiR3JpZFV0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sS0FBSyxFQUFFLE1BQU0saUJBQWlCLENBQUM7QUFFdEMsT0FBTyxLQUFLLFNBQVMsTUFBTSxhQUFhLENBQUM7QUFHekM7Ozs7Ozs7O0VBUUU7QUFFRixNQUFNLFVBQVUsb0JBQW9CO0lBRWxDLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQztJQUNoQixNQUFNLElBQUksR0FBRyxRQUFRLENBQUMsc0JBQXNCLENBQUMsbURBQW1ELENBQUMsQ0FBQztJQUNsRyxLQUFJLElBQUksQ0FBQyxHQUFDLENBQUMsRUFBRSxDQUFDLEdBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsRUFBRTtRQUMvQixJQUFJLEdBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQWlCLENBQUM7UUFDckMsT0FBTyxJQUFJLENBQUM7S0FDYjtJQUNELE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQztBQUdELE1BQU0sVUFBVSxjQUFjLENBQUMsSUFBYztJQUUzQyxNQUFNLElBQUksR0FBRyxRQUFRLENBQUMsc0JBQXNCLENBQUMsK0JBQStCLENBQUMsQ0FBQztJQUU5RSxJQUFJLFFBQVEsR0FBd0IsSUFBSSxDQUFDO0lBQ3pDLElBQUksT0FBTyxHQUFHLElBQUksQ0FBQztJQUNuQixLQUFJLElBQUksQ0FBQyxHQUFDLENBQUMsRUFBRSxDQUFDLEdBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsRUFBRTtRQUMvQixRQUFRLEdBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQWlCLENBQUMsYUFBYSxDQUFDO1FBQ3ZELElBQUcsUUFBUSxJQUFJLElBQUk7WUFDakIsT0FBTyxJQUFJLENBQUM7UUFFZCxJQUFHLENBQUEsUUFBUSxhQUFSLFFBQVEsdUJBQVIsUUFBUSxDQUFFLFlBQVksQ0FBQyxhQUFhLENB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QUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBRW5DLElBQUcsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDO1lBQzdDLFNBQVMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQztLQUMzQztJQUVELE1BQU0sT0FBTyxHQUFHLFNBQVMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzNELE1BQU0sT0FBTyxHQUFHLFNBQVMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxNQUFNLEdBQUMsQ0FBQyxDQUFDLENBQUM7SUFFNUUsWUFBWSxDQUFDLENBQUMsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzdELFlBQVksQ0FBQyxDQUFDLENBQUMsR0FBRyxTQUFTLENBQUMsTUFBTSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsTUFBTSxHQUFFLENBQUMsQ0FBQyxDQUFDO0lBQy9FLFlBQVksQ0FBQyxDQUFDLENBQUMsR0FBRyxPQUFPLENBQUM7SUFDMUIsWUFBWSxDQUFDLENBQUMsQ0FBQyxHQUFHLE9BQU8sQ0FBQztBQUM1QixDQUFDO0FBRUQsTUFBTSxVQUFVLGdCQUFnQixDQUFDLElBQWE7SUFDNUMsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQztJQUM5QixNQUFNLGVBQWUsR0FBRyxNQUFNLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQztJQUM5QyxNQUFNLGFBQWEsR0FB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dXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIERHIGZyb20gJ2RhdGFncm9rLWFwaS9kZyc7XHJcbmltcG9ydCB7R3JpZENlbGxSZW5kZXJlckV4fSBmcm9tIFwiLi4vcmVuZGVyZXIvR3JpZENlbGxSZW5kZXJlckV4XCI7XHJcbmltcG9ydCAqIGFzIFRleHRVdGlscyBmcm9tIFwiLi9UZXh0VXRpbHNcIjtcclxuaW1wb3J0ICogYXMgR3JpZFV0aWxzIGZyb20gJy4uL3V0aWxzL0dyaWRVdGlscyc7XHJcblxyXG4vKlxyXG5jb25zdCBjYW52YXMgPSB1aS5jYW52YXMoMjAwKnIsIDMwMCpyKTtcclxuXHJcbmNlbGxHcmlkLnJlbmRlcmVyLnJlbmRlcigxMCwgMTAsIDIwMCwgMzAwKTtcclxuXHJcbmNvbnN0IHIgPSB3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbztcclxueCA9IHIgKiB4OyB5ID0gciAqIHk7XHJcbncgPSByICogdzsgaCA9IHIgKiBoO1xyXG4qL1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldEdyaWREYXJ0UG9wdXBNZW51KCkgOiBIVE1MRWxlbWVudCB8IG51bGwge1xyXG5cclxuICBsZXQgZURpdiA9IG51bGw7XHJcbiAgY29uc3QgY0RpdiA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ2Q0LW1lbnUtaXRlbS1jb250YWluZXIgZDQtdmVydC1tZW51IGQ0LW1lbnUtcG9wdXAnKTtcclxuICBmb3IobGV0IG49MDsgbjxjRGl2Lmxlbmd0aDsgKytuKSB7XHJcbiAgICBlRGl2ID0gKGNEaXYuaXRlbShuKSBhcyBIVE1MRWxlbWVudCk7XHJcbiAgICByZXR1cm4gZURpdjtcclxuICB9XHJcbiAgcmV0dXJuIG51bGw7XHJcbn1cclxuXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0VG9vbEljb25EaXYoZ3JpZCA6IERHLkdyaWQpIDogSFRNTEVsZW1lbnQgfCBudWxsIHtcclxuXHJcbiAgY29uc3QgY0ltZyA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ2dyb2staWNvbiBncm9rLWZvbnQtaWNvbi1tZW51Jyk7XHJcblxyXG4gIGxldCBlRGl2SGFtYiA6IEhUTUxFbGVtZW50IHwgbnVsbCA9IG51bGw7XHJcbiAgbGV0IGVQYXJlbnQgPSBudWxsO1xyXG4gIGZvcihsZXQgbj0wOyBuPGNJbWcubGVuZ3RoOyArK24pIHtcclxuICAgIGVEaXZIYW1iID0gKGNJbWcuaXRlbShuKSBhcyBIVE1MRWxlbWVudCkucGFyZW50RWxlbWVudDtcclxuICAgIGlmKGVEaXZIYW1iID09IG51bGwpXHJcbiAgICAgIHJldHVybiBudWxsO1xyXG5cclxuICAgIGlmKGVEaXZIYW1iPy5nZXRBdHRyaWJ1dGUoJ2NvbHVtbl9uYW1lJykgIT09IG51bGwpey8vJ2RhdGEnKSA9PT0gJ0NvbEhhbWInKSB7XHJcbiAgICAgIGVQYXJlbnQgPSBlRGl2SGFtYi5wYXJlbnRFbGVtZW50O1xyXG4gICAgICB3aGlsZShlUGFyZW50ICE9PSBudWxsKSB7XHJcbiAgICAgICAgaWYoZVBhcmVudCA9PT0gZ3JpZC5yb290KVxyXG4gICAgICAgICAgcmV0dXJuIGVEaXZIYW1iO1xyXG5cclxuICAgICAgICBlUGFyZW50ID0gZVBhcmVudC5wYXJlbnRFbGVtZW50O1xyXG4gICAgICB9XHJcbiAgICAgfVxyXG4gIH1cclxuICByZXR1cm4gbnVsbDtcclxufVxyXG5cclxuXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gaXNIaXRUZXN0T25FbGVtZW50KGVFbGVtOiBIVE1MRWxlbWVudCwgZU1vdXNlIDogTW91c2VFdmVudCkgOiBib29sZWFuIHtcclxuICBjb25zdCBlRWxlbUhpdCA9IGRvY3VtZW50LmVsZW1lbnRGcm9tUG9pbnQoZU1vdXNlLmNsaWVudFgsIGVNb3VzZS5jbGllbnRZKTtcclxuICBjb25zdCBiID0gZUVsZW1IaXQgPT0gZUVsZW07XHJcbiAgcmV0dXJuIGI7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBpc1Jvd0hlYWRlcihjb2xHcmlkIDogREcuR3JpZENvbHVtbikgOiBib29sZWFuIHtcclxuICByZXR1cm4gY29sR3JpZC5pZHggPT09IDAgfHwgY29sR3JpZC5uYW1lID09PSAncm93IGhlYWRlcic7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRJbnN0YWxsZWRHcmlkRm9yQ29sdW1uKGNvbEdyaWQgOiBERy5HcmlkQ29sdW1uKSA6IERHLkdyaWQgfCBudWxsIHtcclxuICBjb25zdCBkYXJ0IDogYW55ID0gREcudG9EYXJ0KGNvbEdyaWQpO1xyXG4gIGlmKCEoZGFydC5tX2dyaWQgaW5zdGFuY2VvZiBERy5HcmlkKSlcclxuICAgIHJldHVybiBudWxsO1xyXG5cclxuICByZXR1cm4gZGFydC5tX2dyaWQ7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBpbnN0YWxsR3JpZEZvckNvbHVtbihncmlkIDogREcuR3JpZCwgY29sR3JpZCA6IERHLkdyaWRDb2x1bW4pIDogYm9vbGVhbiB7XHJcbiAgaWYoY29sR3JpZC5ncmlkIGluc3RhbmNlb2YgREcuR3JpZClcclxuICAgIHJldHVybiBmYWxzZTtcclxuXHJcbiAgY29uc3QgZGFydCA6IGFueSA9IERHLnRvRGFydChjb2xHcmlkKTtcclxuICBpZihkYXJ0Lm1fZ3JpZCBpbnN0YW5jZW9mIERHLkdyaWQpXHJcbiAgICByZXR1cm4gZmFsc2U7XHJcblxyXG4gIGRhcnQubV9ncmlkID0gZ3JpZDtcclxuICByZXR1cm4gdHJ1ZTtcclxufVxyXG5cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBzZXRHcmlkQ29sdW1uUmVuZGVyZXIoY29sR3JpZCA6IERHLkdyaWRDb2x1bW4sIHJlbmRlcmVyIDogR3JpZENlbGxSZW5kZXJlckV4KSA6IHZvaWQge1xyXG4gIGNvbnN0IGRhcnQgOiBhbnkgPSBERy50b0RhcnQoY29sR3JpZCk7XHJcbiAgZGFydC5tX3JlbmRlcmVyID0gcmVuZGVyZXI7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRHcmlkQ29sdW1uUmVuZGVyZXIoY29sR3JpZCA6IERHLkdyaWRDb2x1bW4pIDogR3JpZENlbGxSZW5kZXJlckV4IHwgbnVsbCB7XHJcbiAgY29uc3QgZGFydCA6IGFueSA9IERHLnRvRGFydChjb2xHcmlkKTtcclxuICBjb25zdCByZW5kZXJlciA9IGRhcnQubV9yZW5kZXJlcjtcclxuICBpZihyZW5kZXJlciA9PT0gdW5kZWZpbmVkKVxyXG4gICAgcmV0dXJuIG51bGw7XHJcblxyXG4gIHJldHVybiByZW5kZXJlcjtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldEdyaWRDb2x1bW5IZWFkZXJIZWlnaHQoZ3JpZCA6IERHLkdyaWQpIDogbnVtYmVyIHtcclxuICBjb25zdCBvcHRpb25zIDogYW55ID0gZ3JpZC5nZXRPcHRpb25zKHRydWUpO1xyXG4gIGxldCBuSENvbEhlYWRlciA9IG9wdGlvbnMubG9vay5jb2xIZWFkZXJIZWlnaHQ7XHJcbiAgaWYobkhDb2xIZWFkZXIgPT09IG51bGwgfHwgbkhDb2xIZWFkZXIgPT09IHVuZGVmaW5lZCkgey8vREcgYnVnXHJcblxyXG4gICAgY29uc3QgY2VsbEdyaWQgPSBncmlkLmhpdFRlc3QoMiwyKTsvLy5jZWxsKGNvbC5uYW1lLCAwKTtcclxuICAgIGlmKGNlbGxHcmlkICE9PSBudWxsKSB7XHJcbiAgICAgIGNvbnN0IHJjID0gY2VsbEdyaWQuYm91bmRzO1xyXG4gICAgICByZXR1cm4gcmMueTtcclxuICAgICAgLy9jb25zb2xlLmxvZygncmMueSAnICsgcmMueSArIFwiIHJjLmg9IFwiICsgcmMuaGVpZ2h0ICsgXCIgcm93IFwiICsgY2VsbEdyaWQuZ3JpZFJvdyArIFwiIG5hbWUgXCIgKyAgY2VsbEdyaWQuZ3JpZENvbHVtbi5uYW1lKTtcclxuICAgIH1cclxuICB9XHJcbiAgcmV0dXJuIG5IQ29sSGVhZGVyO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0R3JpZFJvd0hlaWdodChncmlkIDogREcuR3JpZCkgOiBudW1iZXIge1xyXG4gIGNvbnN0IG9wdGlvbnMgOiBhbnkgPSBncmlkLmdldE9wdGlvbnModHJ1ZSk7XHJcbiAgY29uc3QgbkhSb3cgPSAgb3B0aW9ucy5sb29rLnJvd0hlaWdodDtcclxuICBpZihuSFJvdyA9PT0gbnVsbCB8fCBuSFJvdyA9PT0gdW5kZWZpbmVkKSB7Ly9ERyBidWdcclxuICAgIGxldCBjb2wgPSBudWxsO1xyXG4gICAgY29uc3QgbkNvbENvdW50ID0gZ3JpZC5jb2x1bW5zLmxlbmd0aDtcclxuICAgIGZvcihsZXQgbkNvbD0wOyBuQ29sPG5Db2xDb3VudDsgKytuQ29sKSB7XHJcbiAgICAgIGNvbCA9IGdyaWQuY29sdW1ucy5ieUluZGV4KG5Db2wpO1xyXG4gICAgICBpZihjb2wgPT09IG51bGwgfHwgIWNvbC52aXNpYmxlKVxyXG4gICAgICAgIGNvbnRpbnVlO1xyXG5cclxuICAgICAgY29uc3QgY2VsbEdyaWQgPSBncmlkLmNlbGwoY29sLm5hbWUsIDApO1xyXG4gICAgICBjb25zdCByYyA9IGNlbGxHcmlkLmJvdW5kcztcclxuICAgICAgcmV0dXJuIHJjLmhlaWdodDtcclxuICAgIH1cclxuICAgIHJldHVybiAtMTtcclxuICB9XHJcblxyXG4gIHJldHVybiBuSFJvdztcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldEdyaWRWaXNpYmxlUm93Q291bnQoZ3JpZCA6IERHLkdyaWQpIDogbnVtYmVyIHtcclxuICBjb25zdCBkZnJhbWUgPSBncmlkLmRhdGFGcmFtZTtcclxuICBjb25zdCBiaXRzZXRGaWx0ZXIgPSBkZnJhbWUuZmlsdGVyO1xyXG4gIGNvbnN0IG5Sb3dDb3VudCA9IGJpdHNldEZpbHRlci50cnVlQ291bnQ7XHJcbiAgcmV0dXJuIG5Sb3dDb3VudDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGZpbGxWaXNpYmxlVmlld3BvcnRSb3dzKGFyTWluTWF4Um93SWR4cyA6IEFycmF5PG51bWJlcj4sIGdyaWQgOiBERy5HcmlkKSA6IHZvaWQge1xyXG4gIGlmKGFyTWluTWF4Um93SWR4cy5sZW5ndGggIT09IDIpXHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJBcnJheSB0byBjb2J0YWluIGluZGljZXMgbXVzdCBoYXZlIHRoZSBsZW5ndGggMi5cIik7XHJcblxyXG4gIGNvbnN0IHNjcm9sbCA9IGdyaWQudmVydFNjcm9sbDtcclxuICBjb25zdCBuUm93TWluID0gTWF0aC5mbG9vcihzY3JvbGwubWluKTtcclxuICBsZXQgblJvd01heCA9IE1hdGguY2VpbChzY3JvbGwubWF4KTtcclxuICBjb25zdCBuUm93Q291bnQgPSBnZXRHcmlkVmlzaWJsZVJvd0NvdW50KGdyaWQpO1xyXG4gIGlmKG5Sb3dNYXggPj0gblJvd0NvdW50KSB7XHJcbiAgICBuUm93TWF4ID0gblJvd0NvdW50IC0xO1xyXG4gIH1cclxuXHJcbiAgYXJNaW5NYXhSb3dJZHhzWzBdID0gblJvd01pbjtcclxuICBhck1pbk1heFJvd0lkeHNbMV0gPSBuUm93TWF4O1xyXG4gIC8vY29uc29sZS5sb2coJ21pbjogJyArIHNjcm9sbC5taW4gKyBcIiBtYXg6IFwiICsgc2Nyb2xsLm1heCArICcgblJvd01heCAnICsgblJvd01heCArIFwiIG5WaXNSb3dDb3VudDogXCIgKyBuUm93Q291bnQpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZmlsbFZpc2libGVWaWV3cG9ydEdyaWRDZWxscyhhckNvbFJvd0lkeHMgOiBBcnJheTxudW1iZXI+LCBncmlkIDogREcuR3JpZClcclxue1xyXG4gIGlmKGFyQ29sUm93SWR4cy5sZW5ndGggIT09IDQpXHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJBcnJheSB0byBjb2J0YWluIGJvdW5kIHJvdyBjb2x1bW4gaW5kaWNlcyBtdXN0IGhhdmUgdGhlIGxlbmd0aCA0LlwiKTtcclxuXHJcbiAgY29uc3QgYXJSb3dJZHhzIDogQXJyYXk8bnVtYmVyPiA9IFtdO1xyXG4gIGNvbnN0IGFyQ29sSWR4cyA6IEFycmF5PG51bWJlcj4gPSBbXTtcclxuICBjb25zdCBsc3RWaXNpYmxlQ2VsbHMgPSBncmlkLmdldFZpc2libGVDZWxscygpO1xyXG4gIGZvcihsZXQgY2VsbEdUbXAgb2YgbHN0VmlzaWJsZUNlbGxzKVxyXG4gIHtcclxuICAgIGlmKCFhclJvd0lkeHMuaW5jbHVkZXMoY2VsbEdUbXAuZ3JpZFJvdykpXHJcbiAgICAgIGFyUm93SWR4cy5wdXNoKGNlbGxHVG1wLmdyaWRSb3cpO1xyXG5cclxuICAgIGlmKCFhckNvbElkeHMuaW5jbHVkZXMoY2VsbEdUbXAuZ3JpZENvbHVtbi5pZHgpKVxyXG4gICAgICBhckNvbElkeHMucHVzaChjZWxsR1RtcC5ncmlkQ29sdW1uLmlkeCk7XHJcbiAgfVxyXG5cclxuICBjb25zdCBuUm93TWluID0gYXJSb3dJZHhzLmxlbmd0aCA9PT0gMCA/IC0xIDogYXJSb3dJZHhzWzBdO1xyXG4gIGNvbnN0IG5Sb3dNYXggPSBhclJvd0lkeHMubGVuZ3RoID09PSAwID8gLTIgOiBhclJvd0lkeHNbYXJSb3dJZHhzLmxlbmd0aC0xXTtcclxuXHJcbiAgYXJDb2xSb3dJZHhzWzBdID0gYXJDb2xJZHhzLmxlbmd0aCA9PT0gMCA/IC0xIDogYXJDb2xJZHhzWzBdO1xyXG4gIGFyQ29sUm93SWR4c1sxXSA9IGFyQ29sSWR4cy5sZW5ndGggPT09IDAgPyAtMiA6IGFyQ29sSWR4c1thckNvbElkeHMubGVuZ3RoIC0xXTtcclxuICBhckNvbFJvd0lkeHNbMl0gPSBuUm93TWluO1xyXG4gIGFyQ29sUm93SWR4c1szXSA9IG5Sb3dNYXg7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRBY3RpdmVHcmlkUm93KGdyaWQ6IERHLkdyaWQpIHtcclxuICBjb25zdCBkZnJhbWUgPSBncmlkLmRhdGFGcmFtZTtcclxuICBjb25zdCBuUm93VGFibGVBY3RpdmUgPSBkZnJhbWUuY3VycmVudFJvdy5pZHg7XHJcbiAgY29uc3QgbkdyaWRDb2xDb3VudCA9IGdyaWQuY29sdW1ucy5sZW5ndGg7XHJcbiAgbGV0IGNvbEdyaWQgPSBudWxsO1xyXG4gIGxldCBjZWxsR3JpZCA9IG51bGw7XHJcbiAgZm9yKGxldCBuQ29sPTA7IG5Db2w8bkdyaWRDb2xDb3VudDsgKytuQ29sKSB7XHJcbiAgICBjb2xHcmlkID0gZ3JpZC5jb2x1bW5zLmJ5SW5kZXgobkNvbCk7XHJcbiAgICBpZihjb2xHcmlkPy52aXNpYmxlKSB7XHJcblxyXG4gICAgICBjb25zdCBuR3JpZFJvd0NvdW50ID0gZGZyYW1lLmZpbHRlci50cnVlQ291bnQ7XHJcbiAgICAgIGZvcihsZXQgblI9MDsgblI8bkdyaWRSb3dDb3VudDsgKytuUikge1xyXG4gICAgICAgIGNlbGxHcmlkID0gZ3JpZC5jZWxsKGNvbEdyaWQubmFtZSwgblIpO1xyXG4gICAgICAgIGlmKGNlbGxHcmlkLnRhYmxlUm93SW5kZXggPT09IG51bGwgfHwgblJvd1RhYmxlQWN0aXZlID09PSBudWxsKVxyXG4gICAgICAgICAgY29udGludWU7XHJcblxyXG4gICAgICAgIGlmKGNlbGxHcmlkLnRhYmxlUm93SW5kZXggPT09IG5Sb3dUYWJsZUFjdGl2ZSlcclxuICAgICAgICAgIHJldHVybiBuUjtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gLTE7XHJcbiAgICB9XHJcbiAgfVxyXG4gIHJldHVybiAtMTtcclxufVxyXG5cclxuXHJcbmNvbnN0IG1fbWFwU2NhbGVkRm9udHMgPSBuZXcgTWFwKCk7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gc2NhbGVGb250KGZvbnQgOiBzdHJpbmcsIGZGYWN0b3IgOiBudW1iZXIpIDogc3RyaW5nIHtcclxuICBpZihmRmFjdG9yID09PSAxLjApIHtcclxuICAgIHJldHVybiBmb250O1xyXG4gIH1cclxuXHJcbiAgY29uc3Qgc3RyS2V5ID0gZm9udCArIGZGYWN0b3IudG9TdHJpbmcoKTtcclxuICBsZXQgZm9udFNjYWxlZCA9IG1fbWFwU2NhbGVkRm9udHMuZ2V0KHN0cktleSk7XHJcbiAgaWYoZm9udFNjYWxlZCAhPT0gdW5kZWZpbmVkKVxyXG4gICAgcmV0dXJuIGZvbnRTY2FsZWQ7XHJcblxyXG4gIGNvbnN0IG5Gb250U2l6ZSA6IG51bWJlciA9IFRleHRVdGlscy5nZXRGb250U2l6ZShmb250KTtcclxuICBmb250U2NhbGVkID0gVGV4dFV0aWxzLnNldEZvbnRTaXplKGZvbnQsIE1hdGguY2VpbChuRm9udFNpemUgKiBmRmFjdG9yKSk7XHJcbiAgbV9tYXBTY2FsZWRGb250cy5zZXQoc3RyS2V5LCBmb250U2NhbGVkKTtcclxuXHJcbiAgcmV0dXJuIGZvbnRTY2FsZWQ7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBwYWludENvbEhlYWRlckNlbGwoZyA6IENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRCB8IG51bGwsIG5YIDogbnVtYmVyLCBuWSA6IG51bWJlciwgblc6IG51bWJlciwgbkg6IG51bWJlciwgY29sR3JpZCA6IERHLkdyaWRDb2x1bW4pIHtcclxuXHJcbiAgaWYoZyA9PT0gbnVsbClcclxuICAgIHJldHVybjtcclxuXHJcbiAgZy5maWxsU3R5bGUgPSBcIndoaXRlXCI7XHJcbiAgZy5maWxsUmVjdChuWCp3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbywgblkqd2luZG93LmRldmljZVBpeGVsUmF0aW8sIG5XKndpbmRvdy5kZXZpY2VQaXhlbFJhdGlvLCBuSCp3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbyk7XHJcblxyXG4gIGNvbnN0IGdyaWQgPSBjb2xHcmlkLmdyaWQ7XHJcbiAgY29uc3Qgb3B0aW9ucyA6IGFueSA9IGdyaWQuZ2V0T3B0aW9ucyh0cnVlKTtcclxuXHJcbiAgY29uc3QgZm9udCA9IG9wdGlvbnMubG9vay5jb2xIZWFkZXJGb250ID09IG51bGwgfHwgb3B0aW9ucy5sb29rLmNvbEhlYWRlckZvbnQgPT09IHVuZGVmaW5lZCA/IFwiYm9sZCAxNHB4IFZvbHRhIFRleHQsIEFyaWFsXCIgOiBvcHRpb25zLmxvb2suY29sSGVhZGVyRm9udDtcclxuICBjb25zdCBmb250TmV3ID0gc2NhbGVGb250KGZvbnQsIHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvKTtcclxuICBnLmZvbnQgPSBmb250TmV3O1xyXG5cclxuICBsZXQgc3RyID0gVGV4dFV0aWxzLnRyaW1UZXh0KGNvbEdyaWQubmFtZSwgZywgblcpO1xyXG5cclxuICBjb25zdCB0bSA9IGcubWVhc3VyZVRleHQoc3RyKTtcclxuICBjb25zdCBuV0xhYmVsID0gdG0ud2lkdGg7XHJcblxyXG4gIGNvbnN0IG5Bc2NlbnQgPSBNYXRoLmFicyh0bS5hY3R1YWxCb3VuZGluZ0JveEFzY2VudCk7XHJcbiAgY29uc3QgbkRlc2NlbnQgPSB0bS5hY3R1YWxCb3VuZGluZ0JveERlc2NlbnQ7XHJcbiAgY29uc3QgbkhGb250ID0gIG5Bc2NlbnQgKyBuRGVzY2VudDsvLyArIDIqbllJbnNldDtcclxuXHJcbiAgY29uc3QgbkhIID0gbkgqd2luZG93LmRldmljZVBpeGVsUmF0aW87XHJcblxyXG4gIGcudGV4dEFsaWduID0gJ3N0YXJ0JztcclxuICBnLmZpbGxTdHlsZSA9IFwiQmxhY2tcIjtcclxuICBjb25zdCBuWFggPSBuWCp3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbyArIE1hdGguY2VpbCgzKndpbmRvdy5kZXZpY2VQaXhlbFJhdGlvKTsvLygoblcqd2luZG93LmRldmljZVBpeGVsUmF0aW8gLSBuV0xhYmVsKSA+PiAxKTtcclxuICBjb25zdCBuWVkgPSAoblkqd2luZG93LmRldmljZVBpeGVsUmF0aW8gKyBuSEggLSBNYXRoLmNlaWwoMyp3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbykpOy8vLTIqd2luZG93LmRldmljZVBpeGVsUmF0aW8pO1xyXG4gIGcuZmlsbFRleHQoc3RyLCBuWFgsIG5ZWSk7XHJcbn1cclxuXHJcblxyXG4iXX0=