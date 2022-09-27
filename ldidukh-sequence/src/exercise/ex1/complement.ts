/* Do not change these import lines to match external modules in webpack configuration */
import * as DG from 'datagrok-api/dg';

export const _package = new DG.Package();


//input: string nucleotides {semType: dna_nucleotide}
//output: string result {semType: dna_nucleotide}
export function complement(nucleotides:string): string {
    //const dna_map = new BidirectionalMap({'A': 'T','C': 'G'});
    var complement_string = nucleotides.replace("A","T");//dna_map.get(nucleotides[0]);
    return complement_string;
  }