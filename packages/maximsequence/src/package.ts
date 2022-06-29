/* Do not change these import lines to match external modules in webpack configuration */
import * as grok from 'datagrok-api/grok';
import * as ui from 'datagrok-api/ui';
import * as DG from 'datagrok-api/dg';
import {ElementOptions} from 'datagrok-api/src/const';

export const _package = new DG.Package();

//name: info
export function info() {
  grok.shell.info('Maximsequence info: ' + _package.webRoot);
}

//name: complement
//tags: panel, widgets
//input: string nucleotides {semType: dna_nucleotide}
//output: widget result
//condition: true
export function complement(nucleotides: string): object {
  let complementaryNucleotide: string = '';
  const preparedNucleotides: string = nucleotides.toUpperCase();
  let widgetStyle: ElementOptions = { };
  const nucleTypes = /[^ATCG\s]/ig;
  const nucleMap = new Map<string, string>();
  nucleMap.set('A', 'T');
  nucleMap.set('T', 'A');
  nucleMap.set('C', 'G');
  nucleMap.set('G', 'C');
  nucleMap.set(' ', ' ');

  if ( preparedNucleotides.match(nucleTypes) === null ) {
    for (let i = 0; i<preparedNucleotides.length; i++ )
      complementaryNucleotide += nucleMap.get(preparedNucleotides[i]);
  } else {
    complementaryNucleotide = 'Non complementary value'; //nucleotides;
    widgetStyle = {style: {'color': '#F55'}};
    //widgetStyle = {style: {'border': 'solid 1px #F12'}};
  }
  return new DG.Widget(ui.divText(complementaryNucleotide, widgetStyle));
  //return complementaryNucleotide;
}
