import { labelFor } from "~/domain/entities/post/taxonomy";
import { getCategoryTaxonomy } from "~/infra/dataAccess/categories/cachedCategoryTaxonomy";

/**
 * La etiqueta que describe a una publicación, en el idioma que se está sirviendo.
 *
 * **La sub-categoría gana sobre la categoría** por ser la más específica: quien mira un pan quiere
 * leer "Panadería", no "Alimentación". Lo piden dos —la página, para declararla en JSON-LD, y el
 * detalle, para pintarla—, y la taxonomía viene cacheada, así que resolverlo dos veces no cuesta
 * una consulta; tenerlo escrito dos veces sí costaría que un día digan cosas distintas.
 */
export async function postCategoryLabel(
  category: string | null | undefined,
  subCategory: string | null | undefined,
  locale?: string,
): Promise<string | null> {
  const taxonomy = await getCategoryTaxonomy();

  return (
    labelFor(taxonomy, subCategory, locale) ??
    labelFor(taxonomy, category, locale)
  );
}
