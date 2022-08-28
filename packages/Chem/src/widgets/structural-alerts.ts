// This file may not be used in
import * as ui from 'datagrok-api/ui';
import * as grok from 'datagrok-api/grok';
import * as DG from 'datagrok-api/dg';
// The file is imported from a WebWorker. Don't use Datagrok imports
import {getRdKitModule, drawMoleculeToCanvas, getRdKitWebRoot} from '../utils/chem-common-rdkit';
import {RDMol, SubstructLibrary} from '../rdkit-api';

let alertsDf: DG.DataFrame | null = null;
const _smartsMap: Map<string, RDMol> = new Map();

export async function getStructuralAlerts(smiles: string): Promise<number[]> {
  if (alertsDf == null)
    await loadSADataset();
  const alerts: number[] = [];
  const Module = getRdKitModule();
  const mol = Module.get_mol(smiles);
  const smartsCol = alertsDf!.getCol('smarts');
  let subMol: RDMol;
  //@ts-ignore: 
  const lib: SubstructLibrary = new Module.SubstructLibrary();
  lib.add_mol(mol);

  for (let i = 0; i < smartsCol.length; i++) {
    try {
      subMol = _smartsMap.get(smartsCol.get(i))!;
    } catch (e) {
      console.warn(e);
      continue;
    }

    if (lib.count_matches(subMol))
      alerts.push(i);
  }
  mol.delete();
  return alerts;
}

async function loadSADataset(): Promise<void> {
  const path = getRdKitWebRoot() + 'files/alert-collection.csv';
  alertsDf = await grok.data.loadTable(path);
  const smartsCol = alertsDf.getCol('smarts');

  for (let i = 0; i < smartsCol.length; i++) {
    const currentSmarts = smartsCol.get(i);
    _smartsMap.set(currentSmarts, getRdKitModule().get_qmol(currentSmarts));
  }
}

export async function structuralAlertsWidget(smiles: string): Promise<DG.Widget> {
  const alerts = await getStructuralAlerts(smiles);
  if (alerts.length === 0)
    return new DG.Widget(ui.divText('No alerts'));

  const width = 200;
  const height = 100;
  const descriptionCol = alertsDf!.getCol('description');
  const smartsCol = alertsDf!.getCol('smarts');

  const list = ui.div(alerts.map((i) => {
    const description = ui.divText(descriptionCol.get(i));
    const imageHost = ui.canvas(width, height);
    const r = window.devicePixelRatio;
    imageHost.width = width * r;
    imageHost.height = height * r;
    imageHost.style.width = width.toString() + 'px';
    imageHost.style.height = height.toString() + 'px';
    drawMoleculeToCanvas(0, 0, width * r, height * r, imageHost, smiles, smartsCol.get(i));
    const host = ui.div([description, imageHost], 'd4-flex-col');
    host.style.margin = '5px';
    return host;
  }), 'd4-flex-wrap');

  return new DG.Widget(list);
}
