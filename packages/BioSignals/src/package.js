/* Do not change these import lines. Datagrok will import API library in exactly the same manner */
import * as grok from 'datagrok-api/grok';
import * as ui from 'datagrok-api/ui';
import * as DG from "datagrok-api/dg";

import {getRelevantMethods} from "./getRelevantMethods.js";
import {getFilterParameters} from "./getFilterParameters.js";
import {getExtractorParameters} from "./getExtractorParameters.js";
import {getIndicatorParameters} from "./getIndicatorParameters.js";
import {applyFilter} from "./applyFilter.js";
import {physionetDatabasesDictionary} from "./physionetDatabasesDictionary.js";
import {AnnotatorViewer} from "./annotatorViewer.js";

export let _package = new DG.Package();

//name: AnnotatorViewer
//tags: viewer
//output: viewer result
export function annotator() {
  return new AnnotatorViewer();
}

async function applyExtractor(data, fsamp, paramsT) {
  return grok.functions.call("BioSignals:extractors",
  {
    'data': data,
    'fsamp': fsamp,
    'paramsT': paramsT
  });
}

async function getIndicator(data, fsamp, paramsT, infoType, indicator) {
  return grok.functions.call("BioSignals:indicators",
  {
    'data': data,
    'fsamp': fsamp,
    'paramsT': paramsT,
    'info': infoType[infoType.length-1].value,
    'preset': indicator.value
  });
}

export function parametersToDataFrame(filtersLST, allParams) {
  let paramsT = DG.DataFrame.create(filtersLST.length);
  paramsT.columns.addNew('type', 'string');
  let string_parameters = ['ftype', 'normMethod', 'kind', 'allnan', 'method', 'irftype'];
  for (let j = 0; j < filtersLST.length; j++) {
    paramsT.columns.byName('type').set(j, filtersLST[j].value);
    Object.keys(allParams[j]).forEach(key => {
      if (!paramsT.columns.names().includes(key)) {
        if (string_parameters.includes(key)) {
          paramsT.columns.addNew(key, 'string');
        } else {
          paramsT.columns.addNew(key, 'double');
        }
        paramsT.columns.byName(key).set(j, allParams[j][key].value);
      }
    })
  }
  return paramsT;
}

function showTheRestOfLayout(formView) {
  ui.dialog('Demo Pipeline')
      .add(formView)
      .showModal(true);
}

function getEmptyChart() {
  return DG.Viewer.fromType(
      DG.VIEWER.LINE_CHART,
      DG.DataFrame.fromColumns([
        DG.Column.fromList(DG.TYPE.FLOAT, 'time', [])
      ])
  );
}

function createPipelineObject(pipeline, functionCategory, typesList, parametersList) {
  let c = 0;
  const typeList = typesList.map((choiceInput) => choiceInput.value);
  for (const type of typeList) {
    pipeline[functionCategory][type] = {};
    let keys = Object.keys(parametersList[c]).map(function(key) {return key;});
    for (const key of keys) {
      pipeline[functionCategory][type][key] = parametersList[c][key].value;
    }
    c++;
  }
  return pipeline;
}

function showMainDialog(table, signalType, column, samplingFreq, isDataFrameLocal) {

  let inputCase = (isDataFrameLocal) ? column.value[0] : table.columns.byName('testEcg');

  let accordionFilters = ui.accordion();
  let accordionExtractors = ui.accordion();
  let accordionIndicators = ui.accordion();
  let extractorOutputsObj = {};

  let relevantMethods = getRelevantMethods(signalType.stringValue);

  // Filter dialogue
  let filterTypesList = [];
  let filterInputsList = [];
  let filterParametersList = [];
  let filterContainerList = [];
  let filterChartsList = [];
  let addFilterButton = ui.div();
  let addFilterChartButton = ui.div();
  let filterInputsNew = ui.inputs(filterTypesList);
  let filterOutputsObj = {[inputCase]: column};
  let i = 0;
  addFilterButton.appendChild(ui.button('Add Filter', () => {
    let containerFilter = ui.div();
    filterContainerList[i] = containerFilter;
    let nameOfLastFiltersOutput = Object.keys(filterOutputsObj)[Object.keys(filterOutputsObj).length - 1];
    let filterInputPreset = (Object.keys(filterOutputsObj).length === 1) ? inputCase : nameOfLastFiltersOutput;
    filterInputsList[i] = ui.choiceInput('Input', filterInputPreset, Object.keys(filterOutputsObj));
    filterChartsList[i] = getEmptyChart();
    filterTypesList[i] = ui.choiceInput('Filter ' + (i + 1), '', relevantMethods.filters);
    let filterInputsOld = ui.inputs([filterTypesList[i]]);
    filterContainerList[i].appendChild(filterInputsOld);
    filterTypesList[i].onChanged(function () {
      let filterType = filterTypesList[i - 1].value;
      filterParametersList[i - 1] = getFilterParameters(filterType);
      filterInputsNew = ui.div([
        ui.block25([
          ui.inputs(
            [filterTypesList[i - 1]]
                .concat([filterInputsList[i - 1]])
                .concat(Object.values(filterParametersList[i - 1]))
                .concat(addFilterChartButton)
          )]
        ),
        ui.block75([filterChartsList[i - 1]])
      ]);
      filterContainerList[i - 1].replaceChild(filterInputsNew, filterInputsOld);
      filterInputsOld = filterInputsNew;
    });
    accordionFilters.addPane('Filter ' + (i + 1), () => containerFilter, true)
    i++;
  }));

  addFilterChartButton.appendChild(ui.button('Plot', async () => {
    let pi = DG.TaskBarProgressIndicator.create('Calculating and plotting filter\'s output...');
    let [plotFL, nameOfLastFiltersOutput] =
        await applyFilter(i, table.columns.byName('time'), inputCase, filterInputsList, filterOutputsObj, filterTypesList, filterParametersList, samplingFreq.value);
    filterChartsList[i - 1].dataFrame = plotFL;
    Object.assign(filterOutputsObj, {[nameOfLastFiltersOutput]: plotFL});
    pi.close();
  }));

  // Information extraction dialogue
  let extractorTypesList = [];
  let extractorChartsList = [];
  let extractorInputsList = [];
  let extractorParametersList = [];
  let extractorContainerList = [];
  let addExtractorButton = ui.div();
  let addExtractorChartButton = ui.div();
  let extractorInputsNew = ui.inputs(extractorTypesList);
  let j = 0;
  addExtractorButton.appendChild(ui.button('Add Extractor', () => {
    let containerExtractor = ui.div();
    extractorContainerList[j] = containerExtractor;
    let nameOfLastFiltersOutput = Object.keys(filterOutputsObj)[Object.keys(filterOutputsObj).length - 1];
    let extractorInputPreset = (Object.keys(filterOutputsObj).length === 1) ? filterInputsList[0].value : nameOfLastFiltersOutput;
    extractorInputsList[j] = ui.choiceInput('Input', extractorInputPreset, Object.keys(filterOutputsObj));
    extractorChartsList[j] = getEmptyChart();
    extractorTypesList[j] = ui.choiceInput('Extractor ' + (j + 1), '', relevantMethods.extractors);
    let extractorInputsOld = ui.inputs([extractorTypesList[j]]);
    extractorContainerList[j].appendChild(extractorInputsOld);
    extractorTypesList[j].onChanged(function () {
      let extractorType = extractorTypesList[j - 1].value;
      extractorParametersList[j - 1] = getExtractorParameters(extractorType);
      extractorInputsNew = ui.div([
        ui.block25([
          ui.inputs(
            [extractorTypesList[j - 1]]
                .concat([extractorInputsList[j - 1]])
                .concat(Object.values(extractorParametersList[j - 1]))
                .concat(addExtractorChartButton)
          )]
        ),
        ui.block75([extractorChartsList[j - 1]])
      ]);
      extractorContainerList[j - 1].replaceChild(extractorInputsNew, extractorInputsOld);
      extractorInputsOld = extractorInputsNew;
    });
    accordionExtractors.addPane('Extractor ' + (j + 1), () => containerExtractor, true)
    j++;
  }));

  let nameOfLastExtractorsOutput = '';
  addExtractorChartButton.appendChild(ui.button('Plot', async () => {
    let pi = DG.TaskBarProgressIndicator.create('Calculating and plotting extractor...');
    let extractorParametersDF = parametersToDataFrame(extractorTypesList, extractorParametersList);
    let t = DG.DataFrame.fromColumns([filterOutputsObj[filterInputsList[i-1].value].columns.byName(filterInputsList[i-1].value)]);
    let plotInfo = await applyExtractor(t, samplingFreq.value, extractorParametersDF);
    nameOfLastExtractorsOutput = 'Output of Extractor ' + j + ' (' + extractorTypesList[j-1].value + ')';
    pi.close();
    extractorChartsList[j-1].dataFrame = plotInfo;
    Object.assign(extractorOutputsObj, {[nameOfLastExtractorsOutput]: plotInfo});
  }));

  // Indicators dialogue
  let indicatorTypesList = [];
  let indicatorChartsList = [];
  let indicatorInputsList = [];
  let indicatorParametersList = [];
  let indicatorContainerList = [];
  let addIndicatorButton = ui.div();
  let addIndicatorChartButton = ui.div();
  let indicatorInputsNew = ui.inputs(indicatorTypesList);
  let k = 0;
  addIndicatorButton.appendChild(ui.button('Add Indicator', () => {
    let containerIndicator = ui.div();
    indicatorContainerList[k] = containerIndicator;
    let nameOfLastExtractorsOutput = Object.keys(extractorOutputsObj)[Object.keys(extractorOutputsObj).length - 1];
    let indicatorInputPreset = (Object.keys(extractorOutputsObj).length === 1) ? extractorInputsList[0].value : nameOfLastExtractorsOutput;
    indicatorInputsList[k] = ui.choiceInput('Input', indicatorInputPreset, Object.keys(extractorOutputsObj));
    indicatorChartsList[k] = getEmptyChart();
    indicatorTypesList[k] = ui.choiceInput('Indicator ' + (k + 1), '', relevantMethods.indicators);
    let indicatorInputsOld = ui.inputs([indicatorTypesList[k]]);
    indicatorContainerList[k].appendChild(indicatorInputsOld);
    indicatorTypesList[k].onChanged(function () {
      let indicatorType = indicatorTypesList[k - 1].value;
      indicatorParametersList[k - 1] = getIndicatorParameters(indicatorType);
      indicatorInputsNew = ui.div([
        ui.block25([
          ui.inputs(
            [indicatorTypesList[k - 1]]
                .concat([indicatorInputsList[k - 1]])
                .concat(Object.values(indicatorParametersList[k - 1]))
                .concat(addIndicatorChartButton)
          )]
        ),
        ui.block75([indicatorChartsList[k - 1]])
      ]);
      indicatorContainerList[k - 1].replaceChild(indicatorInputsNew, indicatorInputsOld);
      indicatorInputsOld = indicatorInputsNew;
    });
    accordionIndicators.addPane('Indicator ' + (k + 1), () => containerIndicator, true)
    k++;
  }));

  addIndicatorChartButton.appendChild(ui.button('Plot', async () => {
    let pi = DG.TaskBarProgressIndicator.create('Calculating and plotting indicator...');
    let indicatorParametersDF = parametersToDataFrame(indicatorTypesList, indicatorParametersList);
    let t = DG.DataFrame.fromColumns([extractorOutputsObj[indicatorInputsList[k-1].value].columns.byName('RR intervals')]);
    let indicatorDf = await getIndicator(t, samplingFreq.value, indicatorParametersDF, indicatorTypesList, indicatorTypesList[k-1]);
    let nameOfLastIndicatorsOutput = 'Output of Indicator ' + k + ' (' + indicatorTypesList[k-1].value + ')';
    indicatorChartsList[k-1].dataFrame = indicatorDf;
    pi.close();
    Object.assign(extractorOutputsObj, {[nameOfLastIndicatorsOutput]: indicatorDf});
  }));

  let savePipelineButton = ui.div();
  savePipelineButton.appendChild(ui.button('Save pipeline', () => {

    let pipeline = {'Filters': {}, 'Estimators': {}, 'Indicators': {}};

    pipeline = createPipelineObject(pipeline, 'Filters', filterTypesList, filterParametersList);
    pipeline = createPipelineObject(pipeline, 'Estimators', extractorTypesList, extractorParametersList);
    pipeline = createPipelineObject(pipeline, 'Indicators', indicatorTypesList, indicatorParametersList);

    pipeline = JSON.stringify(pipeline);

    grok.dapi.users.current().then(async(user) => {
      const pathToFolder = user.login + ':Home/';
      grok.dapi.files.writeAsText(pathToFolder + 'pipeline.txt', pipeline);
    });
  }));

  let formView = ui.div([
    ui.block25([
      ui.inputs([
        column,
        samplingFreq,
        signalType,
        savePipelineButton
      ])],'formview'),
    ui.block75([
      DG.Viewer.fromType('AnnotatorViewer', table)
    ]),
    ui.h2('Filtering and Preprocessing'),
    accordionFilters,
    addFilterButton,
    ui.h2('Information extraction'),
    accordionExtractors,
    addExtractorButton,
    ui.h2('Physiological Indicators'),
    accordionIndicators,
    addIndicatorButton
  ],'formview');
  showTheRestOfLayout(formView);
}

function getDescription(i, filtersLST, allParams) {
  let j = filtersLST.length - 1;
  let a = filtersLST[j].value;
  Object.keys(allParams[j]).forEach(key => {
    a = a + ', ' + key + ': ' + allParams[j][key].value;
  });
  return 'Output of Filter ' + i + ': ' + a + '.';
}

async function readPhysionetRecord(fileInfos, fileNameWithoutExtension) {
  return grok.functions.call("BioSignals:readPhysionetRecord",
  {
    'fileATR': fileInfos.find((({name}) => name === fileNameWithoutExtension + '.atr')),
    'fileDAT': fileInfos.find((({name}) => name === fileNameWithoutExtension + '.dat')),
    'fileHEA': fileInfos.find((({name}) => name === fileNameWithoutExtension + '.hea')),
    'record_name_without_extension': fileNameWithoutExtension
  });
}

async function readPhysionetAnnotations(fileInfos, fileNameWithoutExtension) {
  let f = await grok.functions.eval("BioSignals:readPhysionetAnnotations");
  let call = f.prepare({
    'fileATR': fileInfos.find((({name}) => name === fileNameWithoutExtension + '.atr')),
    'fileDAT': fileInfos.find((({name}) => name === fileNameWithoutExtension + '.dat')),
    'fileHEA': fileInfos.find((({name}) => name === fileNameWithoutExtension + '.hea')),
    'record_name_without_extension': fileNameWithoutExtension
  });
  await call.call();
  const df = call.getParamValue('df');
  const age = call.getParamValue('age');
  const sex = call.getParamValue('sex');
  const dateOfRecording = call.getParamValue('date_of_recording');
  const samplingFrequency = call.getParamValue('sampling_frequency');
  const heartRate = call.getParamValue('heart_rate');
  return [df, age, sex, dateOfRecording, samplingFrequency, heartRate];
}

//tags: fileViewer, fileViewer-atr, fileViewer-dat, fileViewer-hea
//input: file file
//output: view view
export async function bioSignalViewer(file) {
  let view = DG.View.create();
  const currentFolder = file.fullPath.substring(0, file.fullPath.length - file.name.length);
  const isRecursive = false;
  const fileNameWithoutExtension = file.name.substring(0, file.name.length - 3);
  const fileInfos = await grok.dapi.files.list(currentFolder, isRecursive, fileNameWithoutExtension);
  if (fileInfos.length === 3) {
    let pi = DG.TaskBarProgressIndicator.create('Reading Physionet record...');
    const t = await readPhysionetRecord(fileInfos, file.name.slice(0, -4));
    pi.close();
    view.append(ui.block([DG.Viewer.lineChart(t)], 'd4-ngl-viewer'));
  }
  else {
    view.append(ui.divText('In order to view this Physionet recording you need to have \'.atr\', \'.dat\', \'.hea\' in the same folder!'));
  }
  return view;
}

export async function loadPhysionetRecord(chosenDatabase, chosenRecord) {
  let f = await grok.functions.eval("BioSignals:loadPhysionetRecord");
  let call = f.prepare({
    'chosenDatabase': chosenDatabase,
    'chosenRecord': chosenRecord.stringValue
  });
  await call.call();
  let df = call.getParamValue('df');
  let sampling_frequency = call.getParamValue('sampling_frequency');
  return [df, sampling_frequency];
}

export async function loadPhysionetAnnotations(chosenDatabase, chosenRecord) {
  let f = await grok.functions.eval("BioSignals:loadPhysionetAnnotations");
  let call = f.prepare({
    'chosenDatabase': chosenDatabase,
    'chosenRecord': chosenRecord.stringValue
  });
  await call.call();
  return call.getParamValue('df');
}

//name: BioSignals
//tags: panel, widgets
//input: dataframe table
//output: widget result
//condition: analysisCondition(table)
export function Biosensors(table) {

  let tempButton = ui.div();
  tempButton.appendChild(ui.bigButton('launch', () => {

    let column = ui.columnsInput('Columns', table);
    column.setTooltip('Choose columns to plot');

    let samplingFreq = ui.floatInput('Sampling frequency', '');
    samplingFreq.setTooltip('Number of samples taken per second');

    let signalType = ui.choiceInput('Signal type', '', ['ECG', 'EDA', 'Accelerometer', 'EMG', 'EEG', 'ABP', 'BVP(PPG)', 'Respiration']);
    signalType.onChanged(() => {
      if (!IsSignalTypeDetectedAutomatically) {
        let isDataFrameLocal = true;
        showMainDialog(table, signalType, column, samplingFreq, isDataFrameLocal);
      }
    });

    let chosenDatabase = ui.choiceInput('Physionet database', '', Object.keys(physionetDatabasesDictionary));
    chosenDatabase.onInput(() => {
      let chosenRecord = ui.choiceInput('Physionet record', '', physionetDatabasesDictionary[chosenDatabase.stringValue].record_names);
      formView = ui.div(
        ui.inputs([column, chosenDatabase, chosenRecord])
      );
      showTheRestOfLayout(formView);
      chosenRecord.onInput(async () => {
        let pi = DG.TaskBarProgressIndicator.create('Loading record from Physionet...');
        let chosenDatabaseShortName = physionetDatabasesDictionary[chosenDatabase.stringValue].short_name;
        let [table, samplingFrequency] = await loadPhysionetRecord(chosenDatabaseShortName, chosenRecord);
        samplingFreq.value = samplingFrequency;
        IsSignalTypeDetectedAutomatically = true;
        signalType.stringValue = 'ECG';
        let isDataFrameLocal = false;
        pi.close();

        pi = DG.TaskBarProgressIndicator.create('Loading annotations of chosen record from Physionet...');
        let dataFrameWithAnnotations = await loadPhysionetAnnotations(chosenDatabaseShortName, chosenRecord);
        table = table.append(dataFrameWithAnnotations);
        showMainDialog(table, signalType, table.columns.byName('testEcg'), samplingFreq, isDataFrameLocal);
        pi.close();
      });
    });

    let folderName = ui.stringInput('Path to folder', 'a');
    folderName.onInput(async () => {

      grok.dapi.users.current().then(async(user) => {
        let pi = DG.TaskBarProgressIndicator.create('Calculating table...');

        const pathToFolder = user.login + ':Home/' + folderName.value + '/';
        const personalFoldersInfos = await grok.dapi.files.list(pathToFolder, false, '');
        const personalFoldersNames = personalFoldersInfos.map((folder) => folder.name)
        let subjectsTable = DG.DataFrame.create(personalFoldersNames.length);

        subjectsTable.columns.addNewString('Person');
        subjectsTable.columns.addNewString('Record');
        subjectsTable.columns.addNewString('Sex');
        subjectsTable.columns.addNewInt('Age');
        subjectsTable.columns.addNewString('Date');
        subjectsTable.columns.addNewInt('Heart Rate');

        let sex, age, dateOfRecording, samplingFrequency, annotationsDF, heartRate;
        let indexCounter = 0;
        for (const personalFolderName of personalFoldersNames) {
          let filesInPersonalFolder = await grok.dapi.files.list(pathToFolder + personalFolderName, false, '');
          let uniqueFileNamesWithoutExtension = Array.from(new Set(filesInPersonalFolder.map((file) => file.name.slice(0, -4))));
          for (const fileNameWithoutExtension of uniqueFileNamesWithoutExtension) {
            [annotationsDF, age, sex, dateOfRecording, samplingFrequency, heartRate] = await readPhysionetAnnotations(filesInPersonalFolder, fileNameWithoutExtension);
            subjectsTable.columns.byName('Person').set(indexCounter, personalFolderName);
            subjectsTable.columns.byName('Record').set(indexCounter, fileNameWithoutExtension);
            subjectsTable.columns.byName('Sex').set(indexCounter, sex);
            subjectsTable.columns.byName('Age').set(indexCounter, age);
            subjectsTable.columns.byName('Date').set(indexCounter, dateOfRecording);
            subjectsTable.columns.byName('Heart Rate').set(indexCounter, heartRate);
            indexCounter++;
          }
        }
        let view = grok.shell.addTableView(subjectsTable);
        view.boxPlot({x:'Sex', y:'Heart Rate'});
        pi.close();
      });
    });

    let formView = ui.dialog('Demo Pipeline')
        .add(ui.inputs([column]))
        .add(chosenDatabase)
        .add(folderName)
        .showModal(true);

    let IsSignalTypeDetectedAutomatically = null;
    column.onChanged(() => {

      formView.close();

      if (table.col(column.stringValue).semType) {
        IsSignalTypeDetectedAutomatically = true;
        signalType.stringValue = table.col(column.stringValue).semType.split('-')[1];
        let isDataFrameLocal = true;
        showMainDialog(table, signalType, column, samplingFreq, isDataFrameLocal);
      }
      else {
        IsSignalTypeDetectedAutomatically = false;
        formView.close()
        let formView = ui.div([
          ui.block25([
            ui.inputs([
              ui.h2('Filtering and Preprocessing'),
              column,
              samplingFreq,
              signalType
            ])
          ],'formview'),
          ui.block75([
            DG.Viewer.fromType('Line chart', table, {yColumnNames: column.value.map((c) => {return c.name})})
          ])
        ]);
        showTheRestOfLayout(formView);
      }
    });
  }));
  return new DG.Widget(tempButton);
}