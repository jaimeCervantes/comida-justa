import { sql } from "drizzle-orm";
import { db } from "~/infra/dataAccess/db/connection";

export type SeedTranslationInput = {
  /** El slug de la publicación ya sembrada, en cualquiera de sus idiomas. */
  postSlug: string;
  locale: string;
  title: string;
  slug: string;
  content: string;
};

/**
 * Le añade a una publicación ya sembrada su fila en otro idioma.
 *
 * `seedPost` escribe solo el español, que es como nace toda publicación: la traducción llega
 * después, en un `after()` que llama a Gemini. Un escenario que necesite las dos filas no puede
 * esperar a ese proceso —tarda, cuesta y puede fallar—, así que la escribe él.
 *
 * No genera embedding a propósito: quien busca por texto no lo necesita, y pedirle uno a Gemini
 * ataría la suite al proveedor. Las filas caen por cascada con `deleteOnePostBySlug`.
 */
export async function seedTranslation(
  input: SeedTranslationInput,
): Promise<void> {
  const result = await db.execute(sql`
    INSERT INTO post_translations (post_id, locale, title, slug, content)
    SELECT post_id, ${input.locale}, ${input.title}, ${input.slug}, ${input.content}
    FROM post_translations
    WHERE slug = ${input.postSlug}
    LIMIT 1
    RETURNING id
  `);

  if ((result.rows as unknown[]).length === 0) {
    throw new Error(
      `seedTranslation: no existe ninguna publicación con el slug "${input.postSlug}".`,
    );
  }
}
