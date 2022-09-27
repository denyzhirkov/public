import { DataFrame } from 'datagrok-api/dg';
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