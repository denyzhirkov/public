/* Do not change these import lines to match external modules in webpack configuration */
import * as grok from 'datagrok-api/grok';
import * as ui from 'datagrok-api/ui';
import * as DG from 'datagrok-api/dg';
import { DataFrame } from 'datagrok-api/dg';

export const _package = new DG.Package();

/*
class BidirectionalMap {
  fwdMap = {}
  revMap = {}

  constructor(map:Map<string,string>) {
      this.fwdMap = { ...map }
      this.revMap = Object.keys(map).reduce(
          (acc, cur) => ({
              ...acc,
              [map[cur]]: cur,
          }),
          {}
      )
  }

  get(key: string): string | undefined {
      return this.fwdMap[key] || this.revMap[key];
  }

}
*/


/*
export function keyTextBijection(bijectionMap:BidirectionalMap) {

  const bijection = {};
  Object.keys(bijectionMap).forEach(key => {

    bijection[key] = bijectionMap[key];
    bijection[bijectionMap[key]] = key;
  
  });
  return bijection;
}
*/


//input: string nucleotides {semType: dna_nucleotide}
//output: string result {semType: dna_nucleotide}
export function complement(nucleotides:string): string {
  //const dna_map = new BidirectionalMap({'A': 'T','C': 'G'});
  var complement_string = nucleotides.replace("A","T");//dna_map.get(nucleotides[0]);
  return complement_string;
}

//name: complementWidget
//tags: panel, widgets
//input: string nucleotides {semType: dna_nucleotide}
//output: widget result
//condition: true
export function complementWidget(nucleotides:string):DG.Widget{
  return new DG.Widget(ui.divText('nucleotides - ' + complement(nucleotides)));
}

//name: fuzzyJoin
//input: dataframe df1
//input: dataframe df2
//input: int N
//input: string col1
//input: string col2
export function fuzzyJoin(df1:DataFrame,df2:DataFrame, N:BigInteger, col1:string, col2:string):DataFrame{
  let df = df2.append(df1);
  df.columns.addNew('Counts', 'int');
  return df;
}

//name: getOrders
//output: dataframe df
//export async function getOrders(packageName:string, queryName:string, countryName:string ) {
//  return await grok.data.query( { country: countryName});
//}

export function info() {
  grok.shell.info(_package.webRoot);
}
