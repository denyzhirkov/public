/* Do not change these import lines. Datagrok will import API library in exactly the same manner */
import * as grok from 'datagrok-api/grok';
import * as ui from 'datagrok-api/ui';
import * as DG from 'datagrok-api/dg';
import * as meta from './sdtm-meta';

export let _package = new DG.Package();

let links = {
  ae: { key: 'USUBJID', start: 'AESTDY', end: 'AEENDY', event: 'AETERM' },
  cm: { key: 'USUBJID', start: 'VISITDY', event: 'CMTRT' },
  ex: { key: 'USUBJID', start: 'EXSTDY', end: 'EXENDY', event: 'EXTRT' },
  lb: { key: 'USUBJID', start: 'LBDY', event: 'LBTEST' }
};

let typeMap = { 'Char': 'string', 'Num': 'int' };
let datetimeFormat = 'ISO 8601';
let checkType = (column: DG.Column, variable) => (column.type === typeMap[variable.type] ||
  (column.type === 'datetime' && variable.format === datetimeFormat));

let applyRule = (column: DG.Column, variable) => {
  // let matcher = (variable.type === 'Char') ? DG.ValueMatcher.string(variable.rule) : DG.ValueMatcher.numerical(variable.rule);
  if (variable.type === 'Char') {
    let matcher = DG.ValueMatcher.string(variable.rule);

    for (let i = 0; i < column.length; i++) {
      if (!matcher.match(column.get(i))) return false;
    }
    return true;
  }
  return false;
};

let terminology: DG.DataFrame;
let submissionValueCol: DG.Column;
let submissionValues = [];

//name: SDTM Summary
//tags: panel, widgets
//input: dataframe df
//output: widget result
//condition: df.tags.get("sdtm") == "true"
export function sdtmSummaryPanel(df: DG.DataFrame): DG.Widget {
  let domain = df.getTag('sdtm-domain');
  let domainUpper = domain.toUpperCase();
  let text = `SDTM domain: ${domainUpper}\n`;
  for (let [c, v] of Object.entries(meta.classes)) {
    if (v[domainUpper]) text += `${v[domainUpper]}\nClass: ${c}\n`;
  }
  for (let column of df.columns) {
    let name = column.name;
    let variable = meta.domains[domain][name];
    text += `${name} ${variable ? checkType(column, variable) ?
      'valid' : 'invalid' : 'unknown variable'}\n`;
    if (variable && variable.rule) text += `Passed tests: ${applyRule(column, variable)}\n`;
  }
  return new DG.Widget(ui.divText(text));
}

//name: SDTM Variable
//tags: panel, widgets
//input: column varCol
//output: widget result
//condition: t.tags.get("sdtm") == "true"
export function sdtmVariablePanel(varCol: DG.Column): DG.Widget {
  let domain = meta.domains[varCol.dataFrame.getTag('sdtm-domain')];
  let variable = domain[varCol.name];
  let text = `${varCol.name}\n${variable ?
    variable.label + '\nType: ' + (checkType(varCol, variable) ?
      'valid' : 'invalid') : 'Unknown variable'}\n`;
  let missingValueCount = varCol.stats.missingValueCount;
  let convertButton, outliers;

  let isTerm = submissionValues.includes(varCol.name);
  text += `CDISC Submission Value: ${isTerm}\n`;

  if (isTerm) {
    let match = terminology.rows.match({ 'CDISC Submission Value': varCol.name }).toDataFrame();
    text += `CDISC Synonym(s): ${match.get('CDISC Synonym(s)', 0)}\n`;
    text += `CDISC Definition: ${match.get('CDISC Definition', 0)}\n`;
    text += `NCI Preferred Term: ${match.get('NCI Preferred Term', 0)}\n`;

    let relatedRecords = terminology.rows.match({ 'Codelist Code': match.get('Code', 0) }).toDataFrame();
    let rowCount = relatedRecords.rowCount;
    if (rowCount) {
      let valueCol = relatedRecords.getCol('CDISC Submission Value');
      let synCol = relatedRecords.getCol('CDISC Synonym(s)');
      let nciTermCol = relatedRecords.getCol('NCI Preferred Term');
      let synonyms = {};

      for (let i = 0; i < rowCount; i++) {
        let submissionValue = valueCol.get(i);
        [...synCol.get(i).split('; '), nciTermCol.get(i), submissionValue].forEach(s => {
          if (s) synonyms[s.toLowerCase()] = submissionValue;
        });
      }

      let valuesToConvert = varCol.categories.filter(v => v && !valueCol.categories.includes(v));
      if (valuesToConvert.length) {
        outliers = ui.divText('Out-of-vocabulary values:\n' + valuesToConvert.join(', '));
        outliers.style = 'color: red';
        convertButton = ui.button('Convert', () => {
          varCol.init(i => synonyms[varCol.get(i).toLowerCase()] || varCol.get(i));
        }, 'Convert to CDISC submission values');
      }
    }
  }
  let container = [ui.divText(text)];
  if (missingValueCount) container.push(ui.divText(`Missing values: ${missingValueCount}`));
  if (outliers) container.push(outliers, convertButton);
  return new DG.Widget(ui.divV(container));
}


//name: Clinical Case
//tags: app
export function clinicalCaseApp(): void {
  showStudySummary();
  showPatientProfile();
  showLabs();
}

//tags: autostart
export async function clinicalCaseInit(): Promise<void> {
  terminology = await grok.data.loadTable(`${_package.webRoot}tables/sdtm-terminology.csv`);
  submissionValueCol = terminology.getCol('CDISC Submission Value');
  submissionValues = submissionValueCol.categories;

  grok.events.onTableAdded.subscribe(args => {
    let t = args.args.dataFrame;
    let domain = meta.domains[t.name.toLowerCase()];
    if (domain) {
      t.setTag('sdtm', 'true');
      t.setTag('sdtm-domain', t.name.toLowerCase());
      for (let variableName in domain)
        if (t.columns.contains(variableName)) {
          //t.col(variableName).semType = 'sdtm-' + t.name.toLowerCase() + '-' + variableName;
          t.col(variableName).setTag(DG.TAGS.DESCRIPTION, domain[variableName]['label']);
        }
    }

    if (Object.keys(links).every(key => grok.shell.tableByName(key))) {
      let clinMenu = grok.shell.topMenu.group('Clin');
      if (!clinMenu.find('Timelines')) clinMenu.item('Timelines', () => clinicalCaseTimelines());
      if (!clinMenu.find('Study Summary')) clinMenu.item('Study Summary', () => showStudySummary());
      if (!clinMenu.find('Patient Profile')) clinMenu.item('Patient Profile', () => showPatientProfile());
    }
  });
}

//name: clinicalCaseTimelines
export function clinicalCaseTimelines(): void {

  let result = null;

  let getTable = function (domain: string) {
    let info = links[domain];
    let t = grok.shell
      .tableByName(domain)
      .clone(null, Object.keys(info).map(e => info[e]));
    t.columns.addNew('domain', DG.TYPE.STRING).init(domain);
    for (let name in info)
      t.col(info[name]).name = name;
    return t;
  }

  for (let domain in links) {
    let t = getTable(domain);
    if (result == null)
      result = t;
    else
      result.append(t, true);
  }

  let v = grok.shell.addTableView(result);
  v.addViewer('TimelinesViewer');
}

function clearStdView(): void {
  const windows = grok.shell.windows;
  windows.showToolbox = false;
  windows.showProperties = false;
  windows.showConsole = false;
  windows.showHelp = false;
}

//name: showStudySummary
export function showStudySummary(): void {
  let dm = grok.shell.tableByName('dm');
  if (dm == null) return;

  let subjsPerDay = dm.groupBy(['RFSTDTC']).uniqueCount('USUBJID').aggregate();
  let refStartCol = subjsPerDay.col('RFSTDTC');
  for (let i = 0, rowCount = subjsPerDay.rowCount; i < rowCount; i++) {
    if (refStartCol.isNone(i)) subjsPerDay.rows.removeAt(i);
  }

  let lc = DG.Viewer.lineChart(subjsPerDay);
  let bc = DG.Viewer.barChart(dm, { split: 'SEX', stack: 'ARMCD' });
  let bp = DG.Viewer.boxPlot(dm, {
    labelOrientation: 'Horz',
    showStatistics: true,
    value: 'AGE',
    category: 'ARM'
  });

  clearStdView();

  let v = grok.shell.newView('Summary', [
    ui.h1('Study Summary'),
    ui.block([ui.divText('Patient Enrollment'), lc.root]),
    ui.divH([
      ui.block25([ui.h2('Sex Distribution'), bc.root]),
      ui.block75([ui.h2('Age Statistics'), bp.root]),
    ], { style: { width: '100%' } }),
  ]);
}

//name: showPatientProfile
export function showPatientProfile(): void {
  let dm = grok.shell.tableByName('dm');
  let idx = dm.currentRow.idx;
  let subjIdCol = dm.col('USUBJID');
  let summaryCols = dm.columns.byNames(['AGE', 'SEX']);
  let summaryMap = Object.fromEntries(summaryCols.map(col => {
    return [col.name, col.get(idx)];
  }));

  let onValueChanged = (id: string) => {
    if (!subjIdCol) return;

    for (let i = 0, len = subjIdCol.length; i < len; i++) {
      if (subjIdCol.get(i) === id) {
        summaryMap = Object.fromEntries(summaryCols.map(col => {
          return [col.name, col.get(i)];
        }));
        break;
      }
      if (i === (len - 1)) {
        Object.keys(summaryMap).forEach(k => {
          summaryMap[k] = '';
        });
      }
    }

    card.removeChild($(card).find('table')[0]);
    card.appendChild(ui.tableFromMap(summaryMap));
  };

  let userInput = ui.stringInput('', subjIdCol.get(idx), onValueChanged);
  let searchBox = ui.divH([ui.iconFA('users', null), userInput.root], {
    style: { 'align-items': 'center', 'margin-left': '8px' },
  });
  let card = ui.card(ui.tableFromMap(summaryMap));
  let mainDiv = ui.divV([
    searchBox,
    card,
  ]);

  clearStdView();

  let v = grok.shell.newView('Patient Profile', [
    ui.h1('Patient Profile Page'),
    mainDiv,
  ]);
}

//name: showLabs
export function showLabs(): void {
  let lb = grok.shell.tableByName('lb');
  if (lb == null) return;

  grok.shell.newView('Labs', [
    ui.divText('Labs view content'),
  ]);
}
