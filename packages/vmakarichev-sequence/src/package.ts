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