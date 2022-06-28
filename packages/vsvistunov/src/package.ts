/* Do not change these import lines to match external modules in webpack configuration */
import * as grok from 'datagrok-api/grok';
import * as DG from 'datagrok-api/dg';

export const _package = new DG.Package();

//name: info
export function info(): void {
  grok.shell.info(_package.webRoot);
}

//name: complement
//input: string nucleotides {semType: dna_nucleotide}
//output: string result
export function complement(nucleotides: string): string {
  const complement = new Map([
    ['A', 'T'],
    ['C', 'G'],
    ['G', 'C'],
    ['T', 'A'],
  ]);
  let result: string = '';
  let complementNucleotide: string | undefined = '';
  for (let i: number = 0; i < nucleotides.length; i++) {
    complementNucleotide = complement.get(nucleotides[i]);
    if (complementNucleotide)
      result = result + complementNucleotide;
    else
      result = result + nucleotides[i];
  }
  return result;
}
