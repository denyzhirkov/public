/* Do not change these import lines to match external modules in webpack configuration */
import * as grok from 'datagrok-api/grok';
import * as ui from 'datagrok-api/ui';
import * as DG from 'datagrok-api/dg';

export const _package = new DG.Package();

const _host = 'https://api.chem-space.com';
let _token: string | null = null;

//name: info
export function info() {
  grok.shell.info('Chemspace store: ' + _package.webRoot);
}

//tags: app
//name: Chemspace store
export async function startApp(context: any) {
  const catalogToParam: Record<string, any> = {'BB': 'smarts/bb', 'SCR': 'smarts/sc', 'REAL': 'advanced/1'};
  const modeToParam: Record<string, any> = {'Similar': 'sim', 'Substructure': 'sub'};

  const token = await getApiToken();

  const molecule = ui.moleculeInput('', 'c1ccccc1O');
  const mode = ui.choiceInput('Mode', 'Similar', ['Similar', 'Substructure']);
  const similarity = ui.choiceInput('Similarity', '0.6', ['0.2', '0.4', '0.6', '0.8']);
  const catalog = ui.choiceInput('Catalog', 'SCR', ['BB', 'SCR', 'REAL']);
  const filtersHost = ui.div([molecule.root, mode.root, similarity.root, catalog.root],
    'chemspace-controls,pure-form');

  const emptyTable = DG.DataFrame.create();
  const view = grok.shell.addTableView(emptyTable);
  view.name = 'Chemspace';
  view.basePath = '';
  view.description = 'Chemspace search viewer';
  view.root.className = 'grok-view grok-table-view chemspace';

  function update() {
    ui.setUpdateIndicator(view.root, true);

    function setDataFrame(t: DG.DataFrame) {
      view.dataFrame = t;
      let order = ['smiles', 'CS-id', 'id', 'similarity', 'iupac_name', 'molformula', 'mw',
        'molweight', 'cas', 'hac', 'logp', 'rotb', 'hba', 'hbd',
        'ring_count', 'fsp3', 'tpsa', 'mfcd', 'price_category', 'vendor_id', 'link'
      ];
      if (t.rowCount > 0) {
        const names = t.columns.names();
        order = order.filter((o) => names.includes(o));
        view.grid.columns.setOrder(order);
      }
      ui.setUpdateIndicator(view.root, false);
    }
    const valCatalog = (catalog.value !== null) ? catalog.value : 'SCR';
    const valMode = (mode.value !== null) ? mode.value : 'Similar';
    const valSimilarity = (similarity.value !== null) ? similarity.value : '0.6';
    queryMultipart(`search/${catalogToParam[valCatalog]}/${modeToParam[valMode]}`,
      molecule.value,
      mode.value === 'Similar' ? {'simThreshold': parseFloat(valSimilarity) * 100} : null,
      token)
      .then((t) => setDataFrame(t as DG.DataFrame))
      .catch((err) => setDataFrame(emptyTable));
  }

  update();

  molecule.onChanged(() => update());
  mode.onChanged(() => {
    similarity.enabled = mode.value === 'Similar';
    update();
  });
  similarity.onChanged(() => update());
  catalog.onChanged(() => update());

  const acc = view.toolboxPage.accordion;
  acc.addPane('Chemspace', () => filtersHost, true, acc.panes[0]);
}

//name: Chemspace Samples
//description: Chemspace Samples
//tags: panel, widgets
//input: string smiles {semType: Molecule}
//output: widget result
//condition: true
export function chemspaceSamplesPanel(smiles: any): DG.Widget {
  const panels = ui.div();
  getApiToken().then(() => {
    panels.appendChild(createSearchPanel('Similar', smiles));
    panels.appendChild(createSearchPanel('Substructure', smiles));
  });
  return new DG.Widget(panels);
}

//description: Creates search panel
function createSearchPanel(panelName: string, smiles: any): HTMLElement {
  const searchModeToCommand: Record<string, any> = {'Similar': 'smarts/bb/sim', 'Substructure': 'smarts/bb/sub'};

  const headerHost = ui.divH([ui.h2(panelName)], 'chemspace-panel-header');
  const compsHost = ui.divH([ui.loader()]);
  const panel = ui.divV([headerHost, compsHost], 'chemspace-panel');

  queryMultipart(`search/${searchModeToCommand[panelName]}`, smiles,
    panelName === 'Similar' ? {'simThreshold': 40} : null, _token)
    .then((t) => {
      if (compsHost.firstChild)
        compsHost.removeChild(compsHost.firstChild);
      const tbl: DG.DataFrame = (t as DG.DataFrame);
      if ((t as DG.DataFrame).rowCount === 0) {
        compsHost.appendChild(ui.divText('No matches'));
        return;
      }

      function getTooltip(n: number) {
        const props = {
          'ID': tbl.get('CS-id', n),
          'IUPAC': tbl.get('iupac_name', n),
          'Formula': tbl.get('molformula', n),
          'MW': tbl.get('molweight', n),
        };
        return ui.divV([ui.tableFromMap(props), ui.divText('Click to open in the store.')]);
      }

      for (let n = 0; n < Math.min((t as DG.DataFrame).rowCount, 20); n++) {
        let smiles = tbl.get('smiles', n);
        let mol = grok.chem.svgMol(smiles, 150, 75);
        ui.tooltip.bind(mol, () => getTooltip(n));
        mol.addEventListener('click', function() {
          window.open(tbl.get('link', n), '_blank');
        });
        compsHost.appendChild(mol);
      }
      headerHost.appendChild(ui.iconFA('arrow-square-down', () => {
        tbl.name = `Chemspace ${panelName}`;
        grok.shell.addTableView(tbl);
      }, 'Open compounds as table'));
      compsHost.style.overflowY = 'auto';
    })
    .catch((err: any) => {
      if (compsHost.firstChild)
        compsHost.removeChild(compsHost.firstChild);
      const div = ui.divText('No matches');
      ui.tooltip.bind(div, `${err}`);
      compsHost.appendChild(div);
    });

  return panel;
}

//name: Chemspace Prices
//description: Chemspace Prices
//tags: panel, widgets
//input: string id {semType: chemspace-id}
//output: widget result
//condition: true
export function chemspacePricesPanel(id: string): DG.Widget {
  const panel = ui.div([ui.loader()]);
  getApiToken().then(() => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', `${_host}/v2/cs-id/${id}/prices`);
    xhr.setRequestHeader('Authorization', `Bearer ${_token}`);
    xhr.setRequestHeader('Accept', 'application/json; version=2.6');

    function onError() {
      while (panel.firstChild)
        panel.removeChild(panel.firstChild); //root.firstChild
      panel.appendChild(ui.divText('Not found'));
    }

    xhr.onload = function() {
      if (this.status >= 200 && this.status < 300) {
        const map = JSON.parse(xhr.responseText);
        const t = pricesDataToTable(map['items']);
        const grid = DG.Grid.create(t);
        grid.root.style.width = '400px';
        grid.root.style.height = '300px';
        while (panel.firstChild)
          panel.removeChild(panel.firstChild);
        panel.appendChild(ui.div([grid.root]));
        const button = ui.bigButton('ORDER', () => window.open(map['link'], '_blank'));
        button.style.marginTop = '6px';
        panel.appendChild(button);
      } else
        onError();
    };
    xhr.onerror = () => onError();
    xhr.send();
  });

  return new DG.Widget(panel);
}

//description: Converts prices JSON items into DataFrame
function pricesDataToTable(items: any): DG.DataFrame {
  const table = DG.DataFrame.fromJson(JSON.stringify(items));
  table.columns.remove('vendor_code');
  const packsArrays = new Map();
  for (let n = 0; n < items.length; n++) {
    let packs = items[n]['prices'];
    for (let m = 0; m < packs.length; m++) {
      let pack = packs[m];
      let name = `${pack['pack_g']} g`;
      if (!packsArrays.has(name))
        packsArrays.set(name, new Array(items.length));
      packsArrays.get(name)[n] = pack['price_usd'];
    }
  }
  for (let name of Array.from(packsArrays.keys()).sort()) {
    let column = DG.Column.fromList(DG.TYPE.FLOAT, name, packsArrays.get(name));
    column.semType = 'Money';
    column.setTag('format', 'money($)');
    table.columns.add(column);
  }
  return table;
}

//description: Gets access token
async function getApiToken(): Promise<string|null> {
  if (_token === null) {
    const t = await grok.data.query('Chemspace:AuthToken', null, true, 100);
    _token = t.get('access_token', 0);
  }
  return _token;
}

//description: Perform query with multipart form data
function queryMultipart(path: string, smiles: any, params: any, token: string|null) {
  // TODO: Deprecate after WebQuery 'multipart/form-data' support
  return new Promise(function(resolve, reject) {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('SMILES', smiles);
    const queryParams = params !== null ? `?${Object.keys(params).map((key) => key + '=' + params[key]).join('&')}` : '';
    xhr.open('POST', `${_host}/v2/${path}${queryParams}`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.setRequestHeader('Accept', 'application/json; version=2.6');
    xhr.onload = function() {
      if (this.status >= 200 && this.status < 300) {
        const list = JSON.parse(xhr.responseText)['items'];
        if (list.length > 0)
          resolve(DG.DataFrame.fromJson(JSON.stringify(list)));
        else
          reject();
      } else
        reject();
    };
    xhr.onerror = () => reject();
    xhr.send(formData);
  });
}
