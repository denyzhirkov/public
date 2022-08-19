/* Do not change these import lines to match external modules in webpack configuration */
import * as grok from 'datagrok-api/grok';
import * as ui from 'datagrok-api/ui';
import * as DG from 'datagrok-api/dg';
//import * as LL from '../../Leaflet';
import * as GisTypes from '../src/gis-semtypes';

import {OpenLayers} from '../src/gis-openlayer';
import {GisViewer} from '../src/gis-viewer';

//TODO: remove all includes below>>
//import * as ol from 'ol';//
import {Map, View as ViewOl} from 'ol';//
import OSM from 'ol/source/OSM';//
import BingMaps from 'ol/source/BingMaps';//
import TileLayer from 'ol/layer/Tile';//
import {fromLonLat} from 'ol/proj';//
import TileImage from 'ol/source/TileImage'; //this is the base class for XYZ, BingMaps etc..
import VectorLayer from 'ol/layer/Vector';//
import VectorSource from 'ol/source/Vector';//
import GeoJSON from 'ol/format/GeoJSON';
import DragAndDrop from 'ol/interaction/DragAndDrop';
import Modify from 'ol/interaction/Modify';
import * as OLStyle from 'ol/style';
//geometry drawing funtions
import * as olPainter from 'ol/geom/Polygon';
import Feature, { FeatureLike } from 'ol/Feature';
import Point from 'ol/geom/Point';

//ArcGIS import
import ArcMap from '@arcgis/core/Map';
import esriConfig from '@arcgis/core/config';
import MapView from '@arcgis/core/views/MapView';
import Graphic from '@arcgis/core/graphic';
import GraphicsLayer from '@arcgis/core/layers/graphicsLayer';
import * as ArPoint from '@arcgis/core/geometry/Point';
import * as ArPolygon from '@arcgis/core/geometry/Polygon';
import * as ArPolyline from '@arcgis/core/geometry/Polyline';
import geometry, {Geometry} from '@arcgis/core/geometry';

//global variables
let aMap: ArcMap;
let aGraphicsLayer: GraphicsLayer;
let olMapG: OpenLayers;
let lblMarkersCount: HTMLElement;

export const _package = new DG.Package();

//name: info
export function info() {
  grok.shell.info('GIS sandbox: ' + _package.webRoot);
}


function gisViewer() {
//name: GISViewerTest
//description: GIS map viewer
//tags: viewer
//output: viewer result
  return new GisViewer();
}

//TODO: remove all code below (manual creating for testing purposes)>>
function onPreviewArcGisBtnClick(): void {
  let htmlStyle: DG.ElementOptions = { };
  htmlStyle = {style: {'width': '95%', 'height': '95%', 'border': 'solid 1px yellow'}};

  //top panel>>
  const panelTop = ui.box();
  panelTop.style.maxHeight = '36px';
  const btnTest10k = ui.button('10K', ()=>{
    const point = {
      type: 'point',
      longitude: -118.80657463861 + Math.random()*8 + Math.random(),
      latitude: 34.0005930608889 + Math.random()*8 + Math.random(),
    };
    const simpleMarkerSymbol = {
      type: 'simple-marker',
      color: [226, 119, 1 + Math.random()*100], // Orange
      outline: {
        color: [255, 255, 255], // White
        width: 1}};
    const pointGraphic = new Graphic({
      symbol: simpleMarkerSymbol,
      // geometry : point,
    });
    // const aP = new ArPoint
    aGraphicsLayer.add(pointGraphic);
    //aMap
  });

  const btnConnect = ui.button('Connect', ()=>{
  });

  const btnTest2 = ui.button('T2', ()=>{
  });
  //add buttons to top menu panel
  panelTop.append(ui.divH([btnTest10k, btnConnect, btnTest2]));

  const boxMap = ui.box(null, htmlStyle);
  boxMap.setAttribute('id', 'gis-container'); //boxMap - div that contains map

  const viewerContainer = ui.splitV([panelTop, boxMap]);
  const viewContent: HTMLHeadingElement = viewerContainer; //boxMap;

  grok.shell.newView('ArcGIS preview view', [viewContent]);

  esriConfig.apiKey =
  'AAPKecfb667551ec4fb684b0cb47e6c6a9ddG4KlB2_BsUBFglsNBlZgE1dxuVvTqap4dMvxqvqpwUlhujRxDsvQlTmE4mk4CbZA';

  aMap = new ArcMap({
    basemap: 'arcgis-topographic', // Basemap layer service
  });

  const aView = new MapView({
    map: aMap,
    center: [-118.805, 34.027], // Longitude, latitude
    zoom: 13, // Zoom level
    container: 'gis-container', // Div element
  });

  aGraphicsLayer = new GraphicsLayer();
  aMap.add(aGraphicsLayer);
}

function onPreviewLLBtnClick(): void {
  let htmlStyle: DG.ElementOptions = { };
  htmlStyle = {style: {'width': '95%', 'height': '95%', 'border': 'solid 1px yellow'}};
  const boxMap = ui.box(null, htmlStyle);
  boxMap.setAttribute('id', 'map-container'); //boxMap - div that contains map
  //top panel>>
  const panelTop = ui.box();
  panelTop.style.maxHeight = '36px';
  const btnTest10k = ui.button('10K', ()=>{

  });

  const btnConnect = ui.button('Connect', ()=>{
  });

  const btnTest2 = ui.button('T2', ()=>{
  });
  //add buttons to top menu panel
  panelTop.append(ui.divH([btnTest10k, btnConnect, btnTest2]));

  const viewerContainer = ui.splitV([panelTop, boxMap]);
  const viewContent: HTMLHeadingElement = viewerContainer; //boxMap;
  // const viewContent: HTMLHeadingElement = boxMap;

  grok.shell.newView('OpenLayers preview view', [viewContent]);

  olMapG = new OpenLayers();
  olMapG.initMap('map-container');
}

function onPreviewOLBtnClick(): void {
  //OpenLayers variables TODO: make them global for module or place in class
  let olLayers: TileLayer<TileImage>[] = [];
  // prepare Openlayers map and layers>>
  // prepare open street map layer>
  olLayers.push(new TileLayer({
    visible: true,
    preload: Infinity,
    source: new OSM()}));
  //prepare Bing map satelite layer>
  olLayers.push(new TileLayer({
    visible: false,
    preload: Infinity,
    source: new BingMaps({
      key: 'AkhgWhv3YTxFliztqZzt6mWy-agrbRV8EafjHeMJlCRhkIh9mwCH6k7U3hXM5e83',
      imagerySet: 'Aerial',
    }),
  }));
  //prepare Bing map road layer>
  olLayers.push(new TileLayer({
    visible: true,
    preload: Infinity,
    source: new BingMaps({
      key: 'AkhgWhv3YTxFliztqZzt6mWy-agrbRV8EafjHeMJlCRhkIh9mwCH6k7U3hXM5e83',
      imagerySet: 'RoadOnDemand',
    }),
  }));

  //new vector layer for accepting drag n drop data
  const sourceDragnDrop = new VectorSource();
  const layerDragnDrop = new VectorLayer({source: sourceDragnDrop});
  //olLayers.push(layerDragnDrop);

  let htmlStyle: DG.ElementOptions = { };
  htmlStyle = {style: {'border': 'solid 1px darkgray'}};
  const panelTop = ui.divH([ui.div('')], htmlStyle);
  // panelTop.setAttribute('id', 'gis-panel-top'); //TODO: maybe we need to use id further
  const panelLeft = ui.divV([ui.div('')], htmlStyle);
  const panelRight = ui.divV([ui.div('')], htmlStyle);
  const panelBottom = ui.divH([ui.div('_')], htmlStyle);

  //TODO: place buttons into separate toolbox panel
  const btnOSM = ui.button('OSM', () => {
    olLayers[0].setVisible(true);
    olLayers[1].setVisible(false);
    olLayers[2].setVisible(false);
  });
  const btnBing1 = ui.button('Bing 1', () => {
    olLayers[0].setVisible(false);
    olLayers[1].setVisible(true);
    olLayers[2].setVisible(false);
  });
  const btnBing2 = ui.button('Bing 2', () => {
    olLayers[0].setVisible(false);
    olLayers[1].setVisible(false);
    olLayers[2].setVisible(true);
  });

  const btnDraw = ui.button('Draw', () => {
    // const coords = [34.109565029604006, 45.45296242157734];
    // const cl1 = olPainter.circular(coords, 10);
    // const cl2 = olPainter.circular(coords, 100);
    // const cl3 = olPainter.circular(coords, 1000);
    // sourceDragnDrop.addFeatures([
    //   new Feature(cl1.transform('EPSG:4326', olMap.getView().getProjection())),
    //   new Feature(cl2.transform('EPSG:4326', olMap.getView().getProjection())),
    //   new Feature(cl3.transform('EPSG:4326', olMap.getView().getProjection())),
    //   new Feature(new Point(fromLonLat(coords))),
    //   new Feature(new Point(fromLonLat([34.19565029604006, 45.4296242157734]))),
    // ]);
    const arrPoints = [];
    for (let i = 0; i < 30000; i++) {
      let Pt = new Feature(new Point(fromLonLat([20.1956502 + Math.random()*30, 30.429624 + Math.random()*30])));
      const style = new OLStyle.Style({
        image: new OLStyle.Circle({
          radius: 2,
          fill: new OLStyle.Fill({
            color: `rgba(255, 153, 0, 0.5)`,
          }),
          stroke: new OLStyle.Stroke({
            color: `rgba(255, 204, 0, 0.3)`,
            width: 1,
            // width: (val>maxradius) ? ((val/10>maxradius/2) ? (maxradius/2+2) : (val/10) ) : 1,
          }),
        }),
      });

      Pt.setStyle(style);
      Pt.set('fieldValue', Math.random()*501);
      arrPoints.push(Pt);
    //arrPoints.push(new Feature(new Point(fromLonLat([25.1956502 + Math.random()*25, 35.429624 + Math.random()*25]))));
    }
    sourceDragnDrop.addFeatures(arrPoints);
    const arrFeatures = sourceDragnDrop.getFeatures();
    lblMarkersCount.innerText = ' PtsN=' + arrFeatures.length;
  });
  lblMarkersCount = ui.div('_');
  lblMarkersCount.style.border = 'solid 1px lightgray';

  panelTop.appendChild(btnOSM);
  panelTop.appendChild(btnBing1);
  panelTop.appendChild(btnBing2);
  htmlStyle = {style: {'border-left': 'solid 1px lightgray', 'padding': '3px'}};
  panelTop.appendChild(ui.div('', htmlStyle));
  panelTop.appendChild(btnDraw);
  panelTop.appendChild(lblMarkersCount);

  //draft of Openlayers View UI>>
  htmlStyle = {style: {'width': '95%', 'height': '95%', 'border': 'solid 1px yellow'}};
  const boxMap = ui.box(null, htmlStyle);
  boxMap.setAttribute('id', 'map-container'); //boxMap - div that contains map
  htmlStyle = {style: {'width': '96%', 'height': '96%', 'border': 'solid 1px blue'}};
  const boxCenter = ui.divH([panelLeft, boxMap, panelRight], htmlStyle);
  htmlStyle = {style: {'width': '100%', 'height': '100%', 'border': 'solid 2px lightgray'}};

  const viewContent: HTMLHeadingElement = ui.div(
    [panelTop, boxCenter, panelBottom], htmlStyle);

  grok.shell.newView('Openlayers preview', [viewContent]);


  const olMap = new Map({
    target: 'map-container',
    layers: olLayers,
    view: new ViewOl({
      center: fromLonLat([34.109565029604006, 45.45296242157734]),
      zoom: 7,
    }),
  });
  // olMapG = olMap;

  olMap.addLayer(layerDragnDrop); //the way to add layer to the map
  //add drag n drop ability to map
  olMap.addInteraction(
    new DragAndDrop({
      source: sourceDragnDrop,
      formatConstructors: [GeoJSON],
    })
  );
  //add editing ability to map
  olMap.addInteraction(
    new Modify({
      source: sourceDragnDrop,
    })
  );

  olMap.on('click', function (evt) {
    // displayFeatureInfo(evt.pixel);
    const features: FeatureLike[] = [];
    olMap.forEachFeatureAtPixel(evt.pixel, function (feature) {
      features.push(feature);
    });
    if (features.length > 0) {
      let ft = features[0];
      // const gisPoint = new GisTypes.GisPoint(ft.latitude, ft.longitude, ft.get('fieldValue'));
      const gisPoint = new GisTypes.GisPoint(evt.pixel[0], evt.pixel[1], ft.get('fieldValue'));
      grok.shell.o = gisPoint;
      //(features[0].getGeometry).
    }
  });

  //const layerMarkers = new OL.Layer.Markers("Markers");
  //olMap.addLayer(layerMarkers);
}

//name: PreviewDialog
export async function showPreviewDialog() {
  const btnLeaflet = ui.button('Preview OpenLayers1', onPreviewLLBtnClick);
  const btnOpenlayers = ui.button('Preview OpenLayers', onPreviewOLBtnClick);
  const btnArcGIS = ui.button('Preview ArcGIS', onPreviewArcGisBtnClick);
  // const button = ui.button('Preview Leaflet', async ()=>{
  //   //grok.shell.addView()
  //   grok.shell.newView('Preview view', [ui.h1('Preview View')]);
  // }); //preview button on click

  let htmlStyle: DG.ElementOptions = { };
  htmlStyle = {style: {'margin-left': '5px', 'padding-right': '5px'}};

  const panelGrid = ui.div('-_-', htmlStyle);

  htmlStyle = {style: {'width': '200px', 'border-right': 'solid 1px darkgray', 'min-width': '150px',
    'margin-right': '10px', 'padding-right': '2px'}};
  const panelProp = ui.divV([
    btnLeaflet, btnOpenlayers, btnArcGIS], htmlStyle);

  htmlStyle = {style: {'width': '100%', 'height': '100%', 'border': 'solid 1px darkgray'}};
  ui.dialog('GIS Sandbox')
    .add(ui.divH([
      panelProp,
      panelGrid
    ], htmlStyle))
    .onOK(async (event: any) => {
      return;
    })
    .show({x: 200, y: 200, width: 400, height: 410}); //showModal()
}