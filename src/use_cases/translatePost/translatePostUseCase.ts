import { slugify } from "~/domain/shared/slugify";
import type ITranslationService from "~/use_cases/common/ports/ITranslationService";
import type IPostTranslationRepository from "./ports/IPostTranslationRepository";

export interface TranslatePostInput {
  postId: string;
  sourceLocale: string;
  targetLocale: string;
}

export type TranslatePostResult =
  | { translated: true; slug: string }
  | {
      translated: false;
      reason: "already-exists" | "source-missing" | "provider-failed";
      error?: unknown;
    };

/**
 * Crea la fila de una publicación en otro idioma.
 *
 * **Nunca lanza.** Se dispara desde `after()` al publicar, fuera del camino crítico: si el
 * proveedor está caído, publicar tiene que terminar igual y la traducción queda pendiente para el
 * backfill. Un `throw` aquí no lo vería nadie —la respuesta ya salió— y sí ensuciaría los logs
 * como si fuera un fallo del sitio.
 *
 * Es **idempotente**: si ya hay fila en el idioma destino no la toca. Eso es lo que permite correr
 * el backfill dos veces sin duplicar, y lo que protege una traducción corregida a mano de que la
 * siguiente corrida la pise. Importa especialmente porque `post_translations` **no tiene**
 * `UNIQUE(post_id, locale)`: la base no lo impediría por su cuenta.
 */
export default class TranslatePostUseCase {
  constructor(
    private readonly repository: IPostTranslationRepository,
    private readonly translator: ITranslationService,
  ) {}

  async execute(input: TranslatePostInput): Promise<TranslatePostResult> {
    const { postId, sourceLocale, targetLocale } = input;

    if (await this.repository.hasTranslation(postId, targetLocale)) {
      return { translated: false, reason: "already-exists" };
    }

    const source = await this.repository.findTranslation(postId, sourceLocale);

    if (!source) {
      return { translated: false, reason: "source-missing" };
    }

    try {
      const translated = await this.translator.translate({
        title: source.title,
        content: source.content,
        sourceLocale,
        targetLocale,
      });

      const slug = await this.repository.createUniqueSlug(
        slugify(translated.title),
      );

      const saved = await this.repository.saveTranslation({
        postId,
        locale: targetLocale,
        title: translated.title,
        content: translated.content,
        slug,
      });

      /* Alguien pudo escribir la fila entre el `hasTranslation` de arriba y este `insert`: dos
         pestañas, o el backfill corriendo mientras se publica. La carrera es real porque la base
         no tiene el índice único que la impediría. */
      return saved
        ? { translated: true, slug }
        : { translated: false, reason: "already-exists" };
    } catch (error) {
      return { translated: false, reason: "provider-failed", error };
    }
  }
}
