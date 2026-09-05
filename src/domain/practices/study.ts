/**
 * Un estudio de la bibliografía de un pilar, y lo que sostiene.
 *
 * Vivía como una URL suelta dentro de un array (`references.ts`), sin nada que la acompañara: la
 * página pintaba cuarenta y tres enlaces crudos y quien leía no podía saber de qué trataba ninguno
 * ni qué afirmación del artículo respaldaba. Aquí el estudio es un dato con nombre, y `supports` es
 * el vínculo que antes sólo existía como comentario de código.
 */

/** Cómo se nombra el propio artículo. Nulo cuando no consta: no se deduce del tema. */
export type StudyDesign =
  | "rct"
  | "meta_analysis"
  | "systematic_review"
  | "cohort"
  | "cross_sectional"
  | "mechanism"
  | "guideline";

export type StudyCitation = {
  /** Sin el prefijo `https://doi.org/`: el DOI es el identificador, la URL lo resuelve. */
  doi: string;
  title: string | null;
  journal: string | null;
  year: number | null;
  design: StudyDesign | null;
  /** Los títulos de las prácticas que este estudio sostiene, ya en el idioma pedido. */
  supports: readonly string[];
};

const DOI_RESOLVER = "https://doi.org/";

/**
 * La URL con la que se resuelve un DOI.
 *
 * Existe para que el resolutor esté escrito **una vez**. La versión anterior guardaba la URL entera
 * en el array y la repetía en el `href` y en el texto del enlace, así que un cambio de resolutor
 * habría que hacerlo en ciento dieciséis sitios.
 */
export function doiUrl(doi: string): string {
  return `${DOI_RESOLVER}${doi}`;
}

/**
 * Cómo se anuncia un estudio cuando Crossref no supo decir su título.
 *
 * Se muestra el DOI: es lo único cierto que se tiene de él, y es exactamente lo que la página
 * enseñaba antes de este catálogo. Perder el título degrada; perder el enlace sería romper.
 */
export function studyLabel(study: StudyCitation): string {
  return study.title ?? study.doi;
}
