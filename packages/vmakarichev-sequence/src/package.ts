/* Do not change these import lines to match external modules in webpack configuration */
import * as grok from 'datagrok-api/grok';
import * as ui from 'datagrok-api/ui';
import * as DG from 'datagrok-api/dg';

export const _package = new DG.Package();

//name: info
export function info() {
  grok.shell.info(_package.webRoot);
}

//name: complement
//input: string nucleotides {semType: dna_nucleotide}
//output: string result {semType: dna_nucleotide}
export function complement(nucleotides: string): string {  
  
let result = '';
for (let index = 0; index < nucleotides.length; index++) {
    let comSymbol = '';
    switch(nucleotides[index]) {
      case 'A':
        comSymbol = 'T';
        break;
      case 'T':
        comSymbol = 'A';
        break;
      case 'G':
        comSymbol = 'C';
        break;
      case 'C':
        comSymbol = 'G';
        break;
      default:
          break;
    }    
    result += comSymbol;
  }
return result; 
}

//name: complementWidget
 //tags: panel, widgets
 //input: string nucleotides {semType: dna_nucleotide}
 //output: widget result
 //condition: true
 export function complementWidget(nucleotides: string): DG.Widget {
  return new DG.Widget(ui.divV([
    ui.divText("complement:"),
    ui.divText(complement(nucleotides))
  ]));
 }

 //name: enaSequence
 //tags: panel, widgets
 //input: string cellText {semType: ENA}
 //output: widget result
 //condition: isPotentialENAId(cellText)
 export async function enaSequence(cellText: string): Promise<DG.Widget<any>> {
  const url = `https://www.ebi.ac.uk/ena/browser/api/fasta/${cellText}`;
  const fasta = await (await grok.dapi.fetchProxy(url)).text();
  //let box = ui.box(ui.divText(fasta));
  /*grok.shell.newView('Box',[box]);*/
  return new DG.Widget(ui.box(ui.divText(fasta)));
}

//name: countSubsequenceJS
//language: javascript
//input: dataframe sequences
//input: column columnName
//input: string subsequence = "A"
export function countSubsequenceJS(sequences: DG.DataFrame, columnName: DG.Column, subsequence: string) {

  /* Returns number of occurrences of the subsequence subseq in the sequence seq*/
  function countNumberOfSubsequences(seq: string, subseq: string): number {
    let lenOfSeq = seq.length;
    let lenOfSubsec = subseq.length;
    
    let first = 0;
    let last = subseq.length;

    let counter = 0;

    while(last <= lenOfSeq) {
        if(subseq == seq.slice(first, last)) {
            counter++;
            first = last;
            last = first + lenOfSubsec;
        } else {
            first +=1;
            last += 1;
        }
    }
    
    return counter;
  }
  
  // initialization
  let len = sequences.rowCount;
  let countArray = new Int32Array(len);
  
  // computation for each row of the column considered
  for(let i = 0; i < len; i++) {    
    countArray[i] = countNumberOfSubsequences(columnName.get(i).replace(" ", "").toUpperCase(), subsequence);
  }

  sequences.columns.add(DG.Column.fromInt32Array("N("+subsequence+")", countArray));
}


//name: fuzzyJoin
//input: dataframe df1
//input: dataframe df2
//input: int N = 1
export function fuzzyJoin(df1: DG.DataFrame, df2: DG.DataFrame, N: number) {

  /* Returns an index of the column, which has given semantic type.
     df - dataframe
     semanticType - semantic type     
     Returns -1 if a df there are no column of the given semantic type */
  function getColumnOfTheGivenSemanticType(df: DG.DataFrame, semanticType: string): number {
    let numOfColumns = df.columns.length;
    for(let i = 0; i < numOfColumns; i++) {
      if(df.columns.byIndex(i).semType == semanticType){
        return i;
      }
    }
    return -1;
  }

  // Defining of the first column of df1 with the semantic type "dna_nucleotide"
  let index = getColumnOfTheGivenSemanticType(df1, "dna_nucleotide");

  if(index == -1){ // if not found
    alert("In the table " + df1.name + ", there is NO column of the semantic type dna_nucleotide!");
    return ;
  }

  let col1 = df1.columns.byIndex(index); // the first column of df1 with the semantic type "dna_nucleotide"
  //alert(col1.name);

  
  // Defining of the first column of df2 with the semantic type "dna_nucleotide"
  index = getColumnOfTheGivenSemanticType(df2, "dna_nucleotide");

  if(index == -1){ // if not found
    alert("In the table " + df2.name + ", there is NO column of the semantic type dna_nucleotide!");
    return ;
  }

  let col2 = df2.columns.byIndex(index); // the first column of df1 with the semantic type "dna_nucleotide"
  //alert(col2.name);

  /*for(let col of df1.columns) {
    if(col.semType == "dna_nucleotide"){
      col1 = col;
      break;
    }
  }

  if(col1 == undefined){
    alert("In the table " + df1.name + ", there is NO column of the semantic type dna_nucleotide!");
    return ;
  }*/

  // initialization of the dataframe df
  let df = df1.append(df2);
  df.name = "fuzzy join of " + df1.name + " and " + df2.name;

  df.columns.addNew("Counts", "int");

  let len = df.rowCount;
  //let countArray = new Int32Array(len);

  let lenOfCol1 = col1.length;
  let lenOfCol2 = col2.length;

  /* Returns number of occurrences of the subsequence subseq in the sequence seq*/
  function countNumberOfSubsequences(seq: string, subseq: string): number {
    let lenOfSeq = seq.length;
    let lenOfSubsec = subseq.length;
    
    let first = 0;
    let last = subseq.length;

    let counter = 0;

    while(last <= lenOfSeq) {
        if(subseq == seq.slice(first, last)) {
            counter++;
            first = last;
            last = first + lenOfSubsec;
        } else {
            first +=1;
            last += 1;
        }
    }
    
    return counter;
  }

  // each cell of col1 is considered
  for(let i = 0; i < lenOfCol1; i++){
    let currentCell = col1.get(i).replace(" ", '').toUpperCase(); // all spaces are removed and all letters now are in upper case

    let lenOfCurrentCell = currentCell.length;

    let first = 0;
    let last = N;

    let counter = 0;

    let setOfSubsequencesAlreadyConsidered = new Set(); // a set of all non-equal subsequences

    // all subsequences of the current cell are considered
    while(last <= lenOfCurrentCell) {
      let currentSubSequence = currentCell.slice(first, last); // setting of the current subsequence
      
      if(!setOfSubsequencesAlreadyConsidered.has(currentSubSequence)){  // if subsequence has not been already considered
        for(let j = 0; j < lenOfCol2; j++) {
          counter += countNumberOfSubsequences(col2.get(j).replace(" ", '').toUpperCase(), currentSubSequence);
        }

        setOfSubsequencesAlreadyConsidered.add(currentSubSequence); // updating of a set of all subsequences that have been already considered
      }

      first++;
      last++;
    }

    //countArray[i] = counter;

    df.getCol("Counts").set(i, counter); // counter is stored in the appropriate cell of dataframe
  }

  // The same actions for the second part of dataframe
  for(let i = lenOfCol1; i < len; i++){
    let currentCell = col2.get(i - lenOfCol1).replace(" ", '').toUpperCase();

    let lenOfCurrentCell = currentCell.length;

    let first = 0;
    let last = N;

    let counter = 0;

    let setOfSubsequencesAlreadyConsidered = new Set();

    while(last <= lenOfCurrentCell) {
      let currentSubSequence = currentCell.slice(first, last);
      
      if(!setOfSubsequencesAlreadyConsidered.has(currentSubSequence)){  
        for(let j = 0; j < lenOfCol1; j++) {
          counter += countNumberOfSubsequences(col1.get(j).replace(" ", '').toUpperCase(), currentSubSequence);
        }

        setOfSubsequencesAlreadyConsidered.add(currentSubSequence);
      }

      first++;
      last++;
    }

    //countArray[i] = counter;
    df.getCol("Counts").set(i, counter);
  }

  //df.columns.add(DG.Column.fromInt32Array("Count", countArray));

  grok.shell.addTableView(df);
}

