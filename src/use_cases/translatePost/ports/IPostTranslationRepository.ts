import type { PostTranslation } from "~/domain/entities/post/translations";

export interface PostTranslationRow extends PostTranslation {
  postId: string;
}

export default interface IPostTranslationRepository {
  /** La traducción de origen, o `null` si la publicación no existe en ese idioma. */
  findTranslation(
    postId: string,
    locale: string,
  ): Promise<PostTranslation | null>;

  /** `true` si ya hay una fila en ese idioma, aunque esté a medias. */
  hasTranslation(postId: string, locale: string): Promise<boolean>;

  /**
   * Un slug libre a partir del propuesto.
   *
   * `post_translations` **no tiene índice único sobre `slug`** (ver `docs/features/i18n.md`), así
   * que la unicidad se comprueba aquí. Sin esto, un producto traducido podría chocar con el slug de
   * otro y la ruta `/[slug]` serviría cualquiera de los dos.
   */
  createUniqueSlug(slug: string): Promise<string>;

  /**
   * Guarda la traducción sin pisar una que ya exista.
   *
   * Devuelve `false` cuando ya había fila, para que el backfill se pueda correr dos veces sin
   * duplicar ni sobreescribir lo que alguien haya corregido a mano.
   */
  saveTranslation(row: PostTranslationRow): Promise<boolean>;

  /** Las publicaciones a las que les falta el idioma destino. */
  findPostsMissingLocale(
    sourceLocale: string,
    targetLocale: string,
    limit: number,
  ): Promise<PostTranslationRow[]>;
}
