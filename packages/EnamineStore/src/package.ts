/* Do not change these import lines to match external modules in webpack configuration */
import * as grok from 'datagrok-api/grok';
import * as ui from 'datagrok-api/ui';
import * as DG from 'datagrok-api/dg';

export const _package = new DG.Package();

//name: info
export function info() {
  grok.shell.info(_package.webRoot);
}

//tags: app
//name: Enamine Store
export function startApp(context: any): void {
  const molecule = ui.moleculeInput('', 'c1ccccc1O');
  const searchMode = ui.choiceInput('Mode', 'Similar', ['Exact', 'Similar', 'Substructure']);
  const currency = ui.choiceInput('Currency', 'USD', ['USD', 'EUR']);
  const similarity = ui.choiceInput('Similarity', '0.8', ['0.2', '0.4', '0.6', '0.8']);
  const catalog = ui.choiceInput('Catalog', '', ['', 'BB', 'SCR', 'REAL']);
  const filtersHost = ui.div([molecule.root, searchMode.root, currency.root, similarity.root, catalog.root],
    'enamine-store-controls,pure-form');

  const emptyTable = DG.DataFrame.create();
  const view = grok.shell.addTableView(emptyTable);
  view.name = 'Enamine Store';
  view.basePath = '';
  view.description = 'Enamine Store search viewer';
  view.root.className = 'grok-view grok-table-view enamine-store';

  function update(): void {
    ui.setUpdateIndicator(view.root, true);
    grok.data.callQuery('EnamineStore:Search', {
      'code': `search_${molecule.value}_${searchModeToCommand(searchMode.value as string)}`,
      'currency': currency.value,
      'sim': parseFloat(similarity.value as string),
      'mode': catalog.value,
    }, true, 100).then(fc => {
      const data = JSON.parse(fc.getParamValue('stringResult'))['data'];
      view.dataFrame = data !== null ? dataToTable(data, 'enaminestore') : emptyTable;
      ui.setUpdateIndicator(view.root, false);
    });
    //TODO: add reject section to process errors
  }

  update();

  molecule.onChanged(() => update());
  searchMode.onChanged(() => {
    similarity.enabled = searchMode.value === 'Similar';
    update();
  });
  currency.onChanged(() => update());
  similarity.onChanged(() => update());
  catalog.onChanged(() => update());

  const acc = view.toolboxPage.accordion;
  acc.addPane('Enamine Store', () => filtersHost, true, acc.panes[0]);
}

//name: Enamine Store
//description: Enamine Store Samples
//tags: panel, widgets
//input: string smiles {semType: Molecule}
//output: widget result
//condition: true
export function enamineStore(smiles: any): DG.Widget {
  const panels = ui.div([
    createSearchPanel('Exact', smiles),
    createSearchPanel('Similar', smiles),
    createSearchPanel('Substructure', smiles),
  ]);
  return DG.Widget.fromRoot(panels);
}

//description: Creates search panel
function createSearchPanel(panelName: string, smiles: any): HTMLElement {
  const currency = 'USD';
  const headerHost = ui.divH([ui.h2(panelName)], 'enamine-store-panel-header');
  const compsHost = ui.divH([ui.loader()]);
  const panel = ui.divV([headerHost, compsHost], 'enamine-store-panel');
  grok.data.callQuery('EnamineStore:Search', {
    'code': `search_${smiles}_${searchModeToCommand(panelName)}`,
    'currency': currency,
  }, true, 100).then(fc => {
    if (compsHost.firstChild)
      compsHost.removeChild(compsHost.firstChild);
    const data = JSON.parse(fc.getParamValue('stringResult'))['data'];
    if (data === null) {
      compsHost.appendChild(ui.divText('No matches'));
      return;
    }
    for (let comp of data) {
      let smiles = comp['smile'];
      let mol = grok.chem.svgMol(smiles, 150, 75);
      // let id = comp['Id'];
      let props: Record<string, any>;
      props = {
        'ID': comp['Id'],
        'Formula': comp['formula'],
        'MW': comp['mw'],
        'Availability': comp['availability'],
        'Delivery': comp['deliveryDays'],
      };
      for (let pack of comp['packs'])
        props[`${pack['amount']} ${pack['measure']}`] = `${pack['price']} ${currency}`;
      const htmlEl: HTMLElement = ui.divV([ui.tableFromMap(props), ui.divText('Click to open in the store.')]);
      ui.tooltip.bind(mol, htmlEl.innerHTML);
      mol.addEventListener('click', function() {
        window.open(comp['productUrl'], '_blank');
      });
      compsHost.appendChild(mol);
    }
    headerHost.appendChild(ui.iconFA('arrow-square-down', () =>
      grok.shell.addTableView(dataToTable(data, `EnamineStore ${panelName}`)), 'Open compounds as table'));
    compsHost.style.overflowY = 'auto';
  }).catch(err => {
    if (compsHost.firstChild)
      compsHost.removeChild(compsHost.firstChild);
    const div = ui.divText('No matches');
    ui.tooltip.bind(div, `${err}`);
    compsHost.appendChild(div);
  });
  return panel;
}

// description: Converts JSON data into DataFrame
function dataToTable(data: any, name: string): DG.DataFrame {
  const columns = [
    DG.Column.fromStrings('smiles', data.map((comp: any) => comp['smile'])),
    DG.Column.fromStrings('ID', data.map((comp: any) => comp['Id'])),
    DG.Column.fromStrings('Formula', data.map((comp: any) => comp['formula'])),
    DG.Column.fromFloat32Array('MW', new Float32Array(data.map((comp: any) => comp['mw']))),
    DG.Column.fromInt32Array('Availability', new Int32Array(data.map((comp: any) => comp['availability']))),
    DG.Column.fromStrings('Delivery', data.map((comp: any) => comp['deliveryDays'])),
  ];
  let currency = null;
  const packsArrays = new Map();
  for (let n = 0; n < data.length; n++) {
    let packs = data[n]['packs'];
    for (let m = 0; m < packs.length; m++) {
      let pack = packs[m];
      let name = `${pack['amount']} ${pack['measure']}`;
      if (!packsArrays.has(name))
        packsArrays.set(name, new Float32Array(data.length));
      packsArrays.get(name)[n] = pack['price'];
      if (currency === null && pack['currencyName'] !== null)
        currency = pack['currencyName'];
    }
  }
  for (let name of packsArrays.keys()) {
    let column = DG.Column.fromFloat32Array(name, packsArrays.get(name));
    column.semType = 'Money';
    column.setTag('format', `money(${currency === 'USD' ? '$' : '€'})`);
    columns.push(column);
  }
  const table = DG.DataFrame.fromColumns(columns);
  table.name = name;
  return table;
}

//description: Converts search mode friendly name to command
function searchModeToCommand(name: string): string {
  // const dict = {'Exact': 'exact', 'Similar': 'sim', 'Substructure': 'sub'};
  const dict = new Map<string, string>();
  dict.set('Exact', 'exact');
  dict.set('Similar', 'sim');
  dict.set('Substructure', 'sub');
  let comandStr = dict.get(name);
  if (comandStr === undefined) comandStr = 'exact'; //to prevent passing undefined as result
  return comandStr;
  // return dict[name];
}
