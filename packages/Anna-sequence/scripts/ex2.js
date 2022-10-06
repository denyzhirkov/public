//name: CountSubsequenceJS
//language: javascript
//input: string sequence
//input: string subsequence
//output: int count

let count = sequence.match(new RegExp(subsequence, 'g')).length;