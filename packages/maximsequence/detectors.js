/**
 * The class contains semantic type detectors.
 * Detectors are functions tagged with `DG.FUNC_TYPES.SEM_TYPE_DETECTOR`.
 * See also: https://datagrok.ai/help/develop/how-to/define-semantic-type-detectors
 * The class name is comprised of <PackageName> and the `PackageDetectors` suffix.
 * Follow this naming convention to ensure that your detectors are properly loaded.
 */
class MaximsequencePackageDetectors extends DG.Package {
  //tags: semTypeDetector
  //input: column col
  //output: string semType
  detectNucleotides(col) {
    const nucleTypes = /[^ATCG\s]/ig;
    if ( col.type != 'string' ) return null; //TODO: try to use COLUMN_TYPE.STRING;
    for ( let i = 0; i < col.categories.length; i++ ) {
      if ( col.categories[i].match(nucleTypes) != null ) return null;
    }
    return 'dna_nucleotide';
  }

  //EXCERCISE 8: Creating an info panel with a REST web service
  //input: string str
  //output: bool result
  isPotentialENAId(str) {
    // returns true, if name is of the form [A-Z]{2}[0-9]{6}
    //const nucleTypes = /[A-Z]{2}[0-9]{6}/i;   //TODO: doesn't work properly
    const nucleTypes = /[A-Z][A-Z][0-9][0-9][0-9][0-9][0-9][0-9]/i; //TODO: doesn't work properly
    return (str.match(nucleTypes) != null) ? true : false;
  }
}
