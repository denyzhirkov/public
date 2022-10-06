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
export function complement(nucleotides) {
	let compl = '';

	for (let i of nucleotides) {
			if (i === 'A') compl += 'T';
			else if (i === 'T') compl += 'A';
			else if (i === 'G') compl += 'C';
			else if (i === 'C') compl += 'G';
	}
	return compl;
}


//name: complementWidget
//tags: panel, widgets
//input: string nucleotides {semType: dna_nucleotide}
//output: widget result
//condition: true
export function complementWidget(nucleotides) {
	return new DG.Widget(ui.divText(complement(nucleotides)));
}


//name: fuzzyJoin
//input: dataframe df1
//input: dataframe df2
//input: int N
export function fuzzyJoin(df1, df2, N) {
    let col1 = df1.columns.bySemType('dna_nucleotide');
    let col2 = df2.columns.bySemType('dna_nucleotide');
	let col1_len = col1.length, col2_len = col2.length;
	let col1_arr = [], col2_arr = [];

	for (let i = 0; i < col1_len; i++) col1_arr.push(col1.getString(i));
	for (let i = 0; i < col2_len; i++) col2_arr.push(col2.getString(i));

    let col1_str = col1_arr.join(' ');
    let col2_str = col2_arr.join(' ');
    let df = df1.append(df2);
    df.columns.addNew('Counts', 'int');
    let row, subs, cnt;

    for (let i = 0; i < col1_len; i++) {
        cnt = 0;
        row = col1_arr[i];
        subs = row.match(new RegExp('[atcgATCG]{' + N + '}', 'g'));
        for (let j of subs)
            cnt += (col2_str.match(new RegExp(j, 'g')) || []).length;
        df.getCol('Counts').set(i, cnt);
    }

	for (let i = 0; i < col2_len; i++) {
        cnt = 0;
        row = col2_arr[i];
        subs = row.match(new RegExp('[atcgATCG]{' + N + '}', 'g'));
        for (let j of subs)
            cnt += (col1_str.match(new RegExp(j, 'g')) || []).length;
        df.getCol('Counts').set(col1_len + i, cnt);
    }

    grok.shell.addTableView(df);
}