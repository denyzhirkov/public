/* Do not change these import lines. Datagrok will import API library in exactly the same manner */
import * as grok from 'datagrok-api/grok';
import * as ui from 'datagrok-api/ui';
import * as DG from 'datagrok-api/dg';
import './dataframe/data_frame';
import './dataframe/calculated-columns';
import './dataframe/events';
import './shell/shell';
import './shell/windows';
import './viewer/viewer';
import './views/events';
import './views/layouts';
import './dapi/files';
import './dapi/fetch';
import './dapi/admin';
import './dapi/groups';
import './ui/inputs';
import './ui/forms';
import './dapi/dapi';
import './dapi/entities';
import './dapi/layouts';
import './dapi/projects';
import './dapi/tables';
import './dapi/user-data-storage';
import './dapi/users';
import './shell/ml';
import './ui/divs';
import './ui/buttons';
import './widgets/legend';
import './ui/icons';
import './ui/tables';
import './ui/rangeSlider';
import './ui/accordion';
import './ui/tabControl';

import {runTests} from "@datagrok-libraries/utils/src/test";
export let _package = new DG.Package();


//name: test
//input: string category {optional: true}
//input: string test {optional: true}
//output: dataframe result
//top-menu: Tools | Dev | JS API Tests
export async function test(category: string, test: string): Promise<DG.DataFrame> {
  let data = await runTests({category, test});
  return DG.DataFrame.fromObjects(data)!;
}
