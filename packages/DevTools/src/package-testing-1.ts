import * as grok from 'datagrok-api/grok';
import * as ui from 'datagrok-api/ui';
import * as DG from 'datagrok-api/dg';
import { EntityType } from './constants';
import { Test } from '@datagrok-libraries/utils/src/test';
import { c, _package } from './package';
import {delay} from "@datagrok-libraries/utils/src/test";

interface ITestManagerUI {
  runButton: HTMLButtonElement;
  testsTree: DG.TreeViewNode;
}

interface IPackageTests {
  name: string;
  friendlyName: string;
  active: boolean;
  categories: {[index: string]: ICategory}
}

interface ICategory {
  active: boolean,
  tests: IPackageTest[]
}

interface IPackageTest {
  test: Test,
  active: boolean,
  packageName: string
}

interface ITestFromUrl {
  packName: string,
  catName: string,
  testName: string
}

let packagesTests: IPackageTests[];
let testsResultsDf: DG.DataFrame;
let testPath = '';
let testFunctions: any[];
const packagesTestsList: IPackageTests[] = [];

export function addView(view: DG.ViewBase): DG.ViewBase {
  view.box = true;
  view.parentCall = c;
  view.path = '/' + view.name.replace(' ', '');
  grok.shell.addView(view);
  return view;
}

export async function testManagerView1(): Promise<void> {
  let pathSegments = window.location.pathname.split('/');
  pathSegments = pathSegments.map(it => it ? it.toLowerCase() : undefined);
  testFunctions = await collectPackages();
  let v = DG.View.create();
  const testUIElements: ITestManagerUI = createTestManagerUI(true, v);
  v.name = 'Test Manager'
  addView(v);
  v.temp['ignoreCloseAll'] = true;
  v.setRibbonPanels(
    [ [ testUIElements.runButton ] ],
  );
  v.append(testUIElements.testsTree.root);
  runActiveTests(testUIElements.testsTree, v);  
}

async function collectPackages(packageName?: string): Promise<any[]>  {
  let testFunctions = DG.Func.find({ name: 'Test' , meta: {file: 'package-test.js'}});
  if (packageName) testFunctions = testFunctions.filter((f: DG.Func) => f.package.name === packageName);
  return testFunctions;
}

async function collectPackageTests(f: any) {
    if (packagesTestsList.filter(it => it.name === f.package.name).length === 0) {
        await delay(4000); // will be removed with new version of js-api
        await f.package.load({ file: f.options.file });
        const testModule = f.package.getModule(f.options.file);
        if (!testModule) {
            console.error(`Error getting tests from '${f.package.name}/${f.options.file}' module.`);
        }
        const allPackageTests = testModule ? testModule.tests : undefined;
        let testsWithPackNameAndActFlag: { [cat: string]: ICategory } = {};
        if (allPackageTests) {
            Object.keys(allPackageTests).forEach((cat) => {
                let catTests: IPackageTest[] = [];
                allPackageTests[cat].tests
                    .forEach((t) => catTests.push({
                        test: t,
                        active: false,
                        packageName: f.package.name
                    }));

                testsWithPackNameAndActFlag[cat] = {
                    active: false,
                    tests: catTests
                };
            });
            packagesTestsList.push({
                name: f.package.name,
                friendlyName: f.package.friendlyName,
                active: false,
                categories: testsWithPackNameAndActFlag
            });
        };
    }
}


function createTestManagerUI(labelClick?: boolean, view?: DG.View): ITestManagerUI {

  let addCheckboxAndLabelClickListener = (item: DG.TreeViewNode, checked: boolean, isGroup: boolean, onChangeFunction: () => void, onItemClickFunction: () => void) => {
    item.enableCheckBox(checked);
    item.checkBox?.addEventListener('change', onChangeFunction);
    if (labelClick) {
      const label = isGroup ? item.root.children[ 0 ].children[ 2 ] : item.root.children[ 1 ];
      label.addEventListener('click', onItemClickFunction);
    }
  };

  let getTestsInfoAcc = (condition: string) => {
    let acc = ui.accordion();
    let accIcon = ui.element('i');
    accIcon.className = 'grok-icon svg-icon svg-view-layout';
    acc.addTitle(ui.span([ accIcon, ui.label(`Tests details`) ]));
    let grid = getTestsInfoGrid(condition);
    acc.addPane('Results', () => ui.div(grid), true);
    return acc.root;
  }

  let getTestsInfoGrid = (condition: string) => {
    let grid;
    if (testsResultsDf) {
      let testInfo = testsResultsDf
        .groupBy(testsResultsDf.columns.names())
        .where(condition)
        .aggregate();
      if (testInfo.rowCount === 1 && !testInfo.col('result').isNone(0)) {
        const gridMap = {};
        testInfo.columns.names().forEach(col => {
          gridMap[ col ] = testInfo.get(col, 0);
        });
        grid = ui.tableFromMap(gridMap);
      } else {
        grid = testInfo.plot.grid().root;
      }
    }
    return grid;
  }

  const tree = ui.tree();
  tree.root.style.width = '100%';
  testFunctions.forEach(pack => {
    const packNode = tree.group(pack.package.friendlyName, null, false);
    packNode.onNodeExpanding.subscribe(async () => {
        collectPackageTests(pack);
    })
  });

  const runTestsButton = ui.bigButton('Run', async () => {
    runActiveTests(tree, view);
  });

  return { runButton: runTestsButton, testsTree: tree };
}

function runActiveTests(tree: DG.TreeViewNode, view?: DG.View) {
  let actTests = collectActiveTests();
  actTests.forEach(t => updateTestResultsIcon(tree, t.packageName, t.test.category, t.test.name));
  if (actTests.length) {
    runAllTests(actTests, tree, view);
  }
}

function collectActiveTests () {
  let activeTests: IPackageTest[] = [];
  packagesTests.forEach(pack => {
    Object.keys(pack.categories).forEach(cat => {
      const active = pack.categories[ cat ].tests.filter(t => t.active);
      if (active.length > 0){

      }
      activeTests = activeTests.concat(pack.categories[ cat ].tests.filter(t => t.active));
    });
  });
  const actPacks = [...new Set(activeTests.map(it => it.packageName))];
  testPath = '';
  if(actPacks.length === 1) {
    testPath += `/${actPacks[0]}`;
    const actCats = [...new Set(activeTests.map(it => it.test.category))];
    if (actCats.length === 1) {
      testPath += `/${actCats[0]}`;
      if (activeTests.length === 1) {
        testPath += `/${activeTests[0].test.name}`;
      }
    }
  }
  return activeTests;
}

function updateTestResultsIcon (tree: DG.TreeViewNode, pack: string, cat: string, name: string, success?: boolean) {
  const items = tree.items;
  const item = items.filter(it => it.root.id === `${pack}|${cat}|${name}`)[ 0 ];
  success === undefined ? item.root.children[ 1 ].children[ 0 ].children[ 0 ].innerHTML = '' : updateIcon(success, item.root.children[ 1 ].children[ 0 ].children[ 0 ]);
}

function updateIcon (passed: boolean, iconDiv: Element) {
  const icon = passed ? ui.iconFA('check') : ui.iconFA('ban');
  icon.style.fontWeight = 'bold';
  icon.style.paddingRight = '5px';
  icon.style.color = passed ? 'lightgreen' : 'red';
  iconDiv.append(icon);
}

async function runAllTests (activeTests: IPackageTest[], tree: DG.TreeViewNode, view?: DG.View) {
  let completedTestsCount = 0;
  if (view) view.path = '/' + view.name.replace(' ', '') + testPath.replace(/ /g, '');
  activeTests.forEach(t => {
    const start = Date.now();
    grok.functions.call(
      `${t.packageName}:test`, {
      "category": t.test.category,
      "test": t.test.name
    }).then((res) => {
      completedTestsCount +=1;
      if (!testsResultsDf) {
        testsResultsDf = res;
        addPackageAndTimeInfo(testsResultsDf, start, t.packageName);
      } else {
        addPackageAndTimeInfo(res, start, t.packageName);
        removeTestRow(t.packageName, t.test.category, t.test.name);
        testsResultsDf = testsResultsDf.append(res);
      }
      updateTestResultsIcon(tree, t.packageName, t.test.category, t.test.name, res.get('success', 0));
      if(completedTestsCount === activeTests.length) {
      //  grok.shell.closeAll();
      }
    })
  })
};

function addPackageAndTimeInfo (df: DG.DataFrame, start: number, pack: string) {
  df.columns.addNewInt('time, ms').init(() => Date.now() - start);
  df.columns.addNewString('package').init(() => pack);
}

function removeTestRow (pack: string, cat: string, test: string) {
  for (let i = 0; i < testsResultsDf.rowCount; i++) {
    if (testsResultsDf.get('package', i) === pack && testsResultsDf.get('category', i) === cat && testsResultsDf.get('name', i) === test) {
      testsResultsDf.rows.removeAt(i);
      return;
    }
  }
}