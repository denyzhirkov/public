/* Do not change these import lines to match external modules in webpack configuration */
import * as grok from 'datagrok-api/grok';
import * as ui from 'datagrok-api/ui';
import * as DG from 'datagrok-api/dg';

export const _package = new DG.Package();

//input: string nucleotides {semType: dna_nucleotide}
//output: string result {semType: dna_nucleotide}
export function complement(nucleotides:string): string {
    var complement = nucleotides.replace("A", "T").replace("G", "C");
    return complement
}

//name: complementWidget
//tags: panel, widgets
//input: string nucleotides {semType: dna_nucleotide}
//output: widget result
//condition: true
export function complementWidget(nucleotides:string):DG.Widget{

    return new DG.Widget(ui.divText('nucleotides - ' + complement(nucleotides)));

}

export function info() {
  grok.shell.info(_package.webRoot);
}
