/* Do not change these import lines to match external modules in webpack configuration */
import * as grok from 'datagrok-api/grok';
import * as ui from 'datagrok-api/ui';
import * as DG from 'datagrok-api/dg';

export const SEMTYPEGIS = {
  LONGITUDE: 'gis-longitude',
  LATIITUDE: 'gis-latitude',
  ALTITUDE: 'gis-altitude',
  GISPOINT: 'gis-point',
};

export class GisPoint {
  longitude: number = 0;
  latitude: number = 0;
  altitude: number = 0;
  attributes: Record<string, any> = {};
  //TODO: add x, y coordinate-getters that incapsulete lng, lat
  constructor(lng: number, lat: number, alt?: number, attr?: Record<string, any>) {
    this.longitude = lng;
    this.latitude = lat;
    if (alt) this.altitude = alt;
    if (attr) this.attributes = attr;
  }
  get x(): number {
    return this.longitude;
  }
  get y(): number {
    return this.latitude;
  }
}

export class GisPointGridCellRenderer extends DG.GridCellRenderer {
  get cellType() {return SEMTYPEGIS.GISPOINT;}

  render(g: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number,
    gridCell: DG.GridCell, cellStyle: DG.GridCellStyle) {
    g.fillStyle = 'darkgray';
    // g.fillText('['+this.longitude+';'+this.latitude+']', x + 5, y + 5);
  }
}

export class GisPointCanvasRenderer extends DG.CanvasRenderer {
  get defaultWidth(): number | null {
    return null;
  }
  get defaultHeight(): number | null {
    return null;
  }
  render(g: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number,
    obj: GisPoint, context: any) {
    g.fillText('['+obj.longitude+';'+obj.latitude+']', x + 10, y + 10);
  }
}

//Point semantic type handler
export class GisPointHandler extends DG.ObjectHandler {
  get type() {return SEMTYPEGIS.GISPOINT;}

  isApplicable(obj: any) {return (obj instanceof GisPoint);}

  getCanvasRenderer() {return null;} //{return (GisPointCanvasRenderer);}
  getGridCellRenderer() {return new GisPointGridCellRenderer();}

  renderIcon() {return ui.iconFA('bullseye');}
  renderProperties(obj: GisPoint) {return ui.divText(`Properties for Point`);}
  renderTooltip(obj: GisPoint) {return ui.divText(`[${obj.x} ; ${obj.y}]`);}
  renderMarkup(obj: GisPoint) {
    const m = ui.span([this.renderIcon(), ui.label('Point')]);
    m.style.color = 'red';
    return m;
  }

  renderCard(obj: GisPoint, context: any) {
    return ui.bind(obj, ui.divV([
      this.renderMarkup(obj),
      ui.divText(`Context: ${context}`)], 'd4-gallery-item'));
  }
}