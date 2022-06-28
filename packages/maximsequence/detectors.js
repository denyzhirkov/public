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
    const nucleTypes = /[^ATCG]/ig;
    if ( col.type != 'string' ) return null; //TODO: try to use COLUMN_TYPE.STRING;
    for ( let i = 0; i < col.categories.length; i++ ) {
      if ( col.categories[i].match(nucleTypes) != null ) return null;
    }
    return 'dna_nucleotide';
  }
}
