import { slugify } from "~/domain/shared/slugify";
import type ITranslationService from "~/use_cases/common/ports/ITranslationService";
import type IPostTranslationRepository from "./ports/IPostTranslationRepository";

export interface TranslatePostInput {
  postId: string;
  sourceLocale: string;
  targetLocale: string;
}

/**
 * Por qué no hay traducción.
 *
 * `provider-failed` y `storage-failed` se separan porque **piden cosas distintas**: el primero se
 * arregla solo en la siguiente corrida del backfill —Gemini vuelve, la traducción se repite— y el
 * segundo no, porque la traducción ya se pagó y lo que falló fue guardarla. Mandan además a mirar
 * sitios distintos: el estado del proveedor o el de la base.
 */
export type TranslatePostFailure =
  | "already-exists"
  | "source-missing"
  | "provider-failed"
  | "storage-failed";

export type TranslatePostResult =
  | { translated: true; slug: string }
  | {
      translated: false;
      reason: TranslatePostFailure;
      error?: unknown;
    };

/** Lo que devuelve un paso que puede fallar sin que eso sea una excepción para quien lo llamó. */
type Attempt<T> = { ok: true; value: T } | { ok: false; error: unknown };

async function attempt<T>(run: () => Promise<T>): Promise<Attempt<T>> {
  try {
    return { ok: true, value: await run() };
  } catch (error) {
    return { ok: false, error };
  }
}

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
 *
 * **Cada paso responde por sí mismo.** Antes un solo `try` envolvía la traducción y las dos
 * escrituras, así que un error de Postgres salía etiquetado como fallo del proveedor y el aviso
 * prometía un backfill que iba a fallar igual. Y las dos lecturas de arriba estaban fuera de todo
 * `try`, o sea que "nunca lanza" dejaba de ser cierto justo cuando la base era el problema.
 */
export default class TranslatePostUseCase {
  constructor(
    private readonly repository: IPostTranslationRepository,
    private readonly translator: ITranslationService,
  ) {}

  async execute(input: TranslatePostInput): Promise<TranslatePostResult> {
    const { postId, sourceLocale, targetLocale } = input;

    const existing = await attempt(() =>
      this.repository.hasTranslation(postId, targetLocale),
    );
    if (!existing.ok) return this.storageFailed(existing.error);
    if (existing.value) return { translated: false, reason: "already-exists" };

    const found = await attempt(() =>
      this.repository.findTranslation(postId, sourceLocale),
    );
    if (!found.ok) return this.storageFailed(found.error);

    /* En una constante propia y no `found.value`: dentro del callback de abajo TypeScript ya no
       puede sostener el estrechamiento del `if`. */
    const source = found.value;
    if (!source) return { translated: false, reason: "source-missing" };

    const translated = await attempt(() =>
      this.translator.translate({
        title: source.title,
        content: source.content,
        sourceLocale,
        targetLocale,
      }),
    );
    if (!translated.ok) {
      return {
        translated: false,
        reason: "provider-failed",
        error: translated.error,
      };
    }

    return this.persist(postId, targetLocale, translated.value);
  }

  /**
   * Guardar lo que el proveedor ya contestó.
   *
   * A partir de aquí cualquier fallo es de la base y **ya se pagó la traducción**: repetirla en el
   * siguiente backfill cuesta otra llamada para obtener lo mismo.
   */
  private async persist(
    postId: string,
    targetLocale: string,
    translated: { title: string; content: string },
  ): Promise<TranslatePostResult> {
    const slug = await attempt(() =>
      this.repository.createUniqueSlug(slugify(translated.title)),
    );
    if (!slug.ok) return this.storageFailed(slug.error);

    const saved = await attempt(() =>
      this.repository.saveTranslation({
        postId,
        locale: targetLocale,
        title: translated.title,
        content: translated.content,
        slug: slug.value,
      }),
    );
    if (!saved.ok) return this.storageFailed(saved.error);

    /* Alguien pudo escribir la fila entre el `hasTranslation` de arriba y este `insert`: dos
       pestañas, o el backfill corriendo mientras se publica. La carrera es real porque la base
       no tiene el índice único que la impediría. */
    return saved.value
      ? { translated: true, slug: slug.value }
      : { translated: false, reason: "already-exists" };
  }

  private storageFailed(error: unknown): TranslatePostResult {
    return { translated: false, reason: "storage-failed", error };
  }
}
