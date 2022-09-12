//name: CountSubsequenceJS
//language: javascript
//input: dataframe sequences
//input: column columnName
//input: string subsequence = "A"
export function CountSubsequenceJS(sequences: DG.DataFrame, columnName: DG.Column, subsequence: string) {

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