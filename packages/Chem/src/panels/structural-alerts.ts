// This file may not be used in
import * as ui from 'datagrok-api/ui';
import * as grok from 'datagrok-api/grok';
import * as DG from 'datagrok-api/dg';
import {getRdKitModule, getRdKitWebRoot} from '../utils/chem-common-rdkit';
import {RDModule, RDMol, SubstructLibrary} from '../rdkit-api';

export async function checkForStructuralAlerts(col: DG.Column<string>): Promise<void> {
  const df = col.dataFrame;
  const alertsDf = await grok.data.loadTable(getRdKitWebRoot() + 'files/alert-collection.csv');
  const ruleSetCol = alertsDf.getCol('rule_set_name');
  const smartsCol = alertsDf.getCol('smarts');
  const ruleIdCol = alertsDf.getCol('rule_id');
  const alertsDfLength = alertsDf.rowCount;
  const rdkitModule = getRdKitModule();

  const dialog = ui.dialog('Structural Alerts');
  for (const ruleSet of ruleSetCol.categories)
    dialog.add(ui.boolInput(ruleSet, true));

  dialog.onOK(() => {
    const progress = DG.TaskBarProgressIndicator.create('Checking for structural alerts...');
    const ruleSetList = dialog.inputs.filter((input) => input.value).map((input) => input.caption);
    if (ruleSetList.length == 0)
      return;
    runStructuralAlertsDetection(df, ruleSetList, col, ruleSetCol, ruleIdCol, smartsMap, rdkitModule);
    progress.close();
  });

  dialog.show();

  // Caching the molecules
  const smartsMap = new Map<string, RDMol>();
  for (let i = 0; i < alertsDfLength; i++)
    smartsMap.set(ruleIdCol.get(i), rdkitModule.get_qmol(smartsCol.get(i)));
}

export function runStructuralAlertsDetection(df: DG.DataFrame, ruleSetList: string[], col: DG.Column<string>,
  ruleSetCol: DG.Column<string>, ruleIdCol: DG.Column<string>, smartsMap: Map<string, RDMol>,
  rdkitModule: RDModule): DG.DataFrame {
  ruleSetList.forEach((ruleSetName) => df.columns.addNewBool(ruleSetName));
  const originalDfLength = df.rowCount;
  const alertsDfLength = ruleSetCol.length;

  //@ts-ignore:
  const lib: SubstructLibrary = new rdkitModule.SubstructLibrary();
  const indexMap: Map<number, number> = new Map();

  for (let i = 0; i < originalDfLength; i++)
    indexMap.set(lib.add_mol(rdkitModule.get_mol(col.get(i)!)), i);

  let matches: number[];
  for (let i = 0; i < alertsDfLength; i++) {
    const currentRuleSet = ruleSetCol.get(i)!;
    if (!ruleSetList.includes(currentRuleSet))
      continue;

    try {
      matches = JSON.parse(lib.get_matches(smartsMap.get(ruleIdCol.get(i)!)!));
    } catch (e) {
      console.warn(`StructuralAlertsError: ${e}`);
      continue;
    }

    const currentRuleSetCol: DG.Column<boolean> = df.getCol(currentRuleSet);
    for (const libIndex of matches)
      currentRuleSetCol.set(indexMap.get(libIndex)!, true);
  }

  return df;
}
