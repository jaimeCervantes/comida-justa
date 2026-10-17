import type { PostKind } from "~/domain/entities/post/kind";
import type { OutreachProductMatch } from "../searchOutreachProductsUseCase";
import type { TitleLocales } from "./IOutreachTextRepository";

/**
 * Los productos cuyo título contiene **todas** las palabras, en cualquier orden y aunque sea a
 * medias, sin acentos, ñ ni mayúsculas. Las palabras llegan ya dobladas (`searchWords`), y quien
 * implementa dobla el título de la misma forma.
 *
 * Orden: primero los títulos que empiezan con la primera palabra, luego los más cortos y luego por
 * orden alfabético. El título que se devuelve es el del idioma pedido, aunque haya casado otro.
 */
export default interface IOutreachProductFinder {
  findByWords(
    words: readonly string[],
    page: number,
    pageSize: number,
    locales: TitleLocales,
    kinds: readonly PostKind[],
  ): Promise<{ matches: OutreachProductMatch[]; total: number }>;
}
