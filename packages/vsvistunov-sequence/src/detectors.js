
//3. Define a detectNucleotides semantic type detector function as part of the special detectors.js file.
//
//It should check whether a column is a string column, and whether each string represents a nucleotide. If condition is met, it should return "dna_nucleotide" string.
// 
// For best performance, don't iterate over all column values, instead iterate on column.categories
// Full Datagrok Column type API could be found here -  https://datagrok.ai/help/develop/dataframe#dgcolumn- 

class VictorSvistunovSequencePackageDetectors extends DG.Package {
    //tags: semTypeDetector
    //input: column col
    //output: string semType
    colCategorized = col.categories;
    detectNucleotides(colCategorized) {
        // your code goes here
        if ((typeof (colCategorized) === string) && (colCategorized.match('GACT'))) {
            const semType = 'dna_nucleotide';
        } else {
            console.log('ERROR: Conditions are not met - either column is not a string or/and the string doesn\'t  represent a nucleotide! Please, check the input data.');
        }




    }
}