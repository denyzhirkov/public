/**
 * The class contains semantic type detectors.
 * Detectors are functions tagged with `DG.FUNC_TYPES.SEM_TYPE_DETECTOR`.
 * See also: https://datagrok.ai/help/develop/how-to/define-semantic-type-detectors
 * The class name is comprised of <PackageName> and the `PackageDetectors` suffix.
 * Follow this naming convention to ensure that your detectors are properly loaded.
 */
class VmakarichevSequencePackageDetectors extends DG.Package {

    //tags: semTypeDetector
    //input: column col
    //output: string semType
    detectNucleotides(col) {   
        
        //const elements = new Set("ATGC");
        const elements = new Set("ATGC atgc");
        
        let categories = col.categories;

        for(let index = 0; index < categories.length; index++){

            let data = categories[index];

            for(let j in data){
                if(!elements.has(data[j])){
                    return null;
                }
            }
        }
        col.semType = "dna_nucleotide";
        return col.semType;     
    }


    //tags: semTypeDetector
    //input: column col
    //output: string semType
    detectENA(col) {   

        return "ENA";     
    }

    //input: string str
    //output: bool result
    isPotentialENAId(str) {
        console.log(str);
        console.log(/[A-Z]{2}[0-9]{6}/.test(str))
        // returns true, if name is of the form [A-Z]{2}[0-9]{6}
<<<<<<< HEAD
       return true; //(/[A-Z]{2}[0-9]{6}/.test(str) && (str.length == 6));
=======
      return (/^[A-Z]{2}[0-9]{6}/.test(str));

>>>>>>> 7d7ec7a5c0d86f7ea93da0c16aef39568fd25cd2
     }


}
