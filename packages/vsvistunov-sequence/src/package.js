/* Do not change these import lines to match external modules in webpack configuration */
import * as grok from 'datagrok-api/grok';
import * as ui from 'datagrok-api/ui';
import * as DG from 'datagrok-api/dg';

export const _package = new DG.Package();

//name: info
export function info() {
  grok.shell.info(_package.webRoot);
}


//Exercise 1. Semantic Types
//1. 
//Create a complement function in src/package.ts which takes a nucleotide string and returns its complement:
//name: complement
//input: string nucleotides
//output: string result
//Essentially, change each character to the complementary one: A <=> T, G <=> C. Run it and check whether everything works fine.
//
//2. Now, let's specify that this function is meant to accept not any string, but nucleotides only, and to return a nucleotide string as well. In order to do that, let's annotate both input and output parameters with the dna_nucleotide semantic type:
//
//name: complement
//input: string nucleotides {semType: dna_nucleotide}
//output: string result {semType: dna_nucleotide}
//
//At this point, dna_nucleotide string does not have any meaning, but we will connect the dots later.

/**
 * @param dna_nucleotide    $nucleotides
 * @param dna_nucleotide    $result 
 */
export function complement(nucleotides) {
  var result = "";
  for (var i = 0; i < nucleotides.length; ++i) {
    switch (nucleotides[i]) {
      case 'A':
        result = result + 'T';
        break;
      case 'G':
        result = result + 'C';
        break;
      case 'T':
        result = result + 'A';
        break;
      case 'C':
        result = result + 'G';
        break;
      default:
        result = result + nucleotides[i];
    }
  }
}