/**
 * The class contains semantic type detectors.
 * Detectors are functions tagged with `DG.FUNC_TYPES.SEM_TYPE_DETECTOR`.
 * See also: https://datagrok.ai/help/develop/how-to/define-semantic-type-detectors
 * The class name is comprised of <PackageName> and the `PackageDetectors` suffix.
 * Follow this naming convention to ensure that your detectors are properly loaded.
 */


class LdidukhSequencePackageDetectors extends DG.Package {


    isDnaNucleotides(sequence) {
        return /^[ATGC]+$/.test(sequence);
    }
   
    //tags: semTypeDetector
    //input: column col
    //output: string semType 
    detectNucleotides(col) {
=
        if (col.type === DG.TYPE.STRING){
            
            var result =  col.categories.map(this.isDnaNucleotides).filter(Boolean).length;
    
            if (result == col.categories.length ) return "dna_nucleotide";
            //if (is_dna_nucleotide == col.categories.length ) return "dna_nucleotide";
            else return null;
        }
    }
}

   