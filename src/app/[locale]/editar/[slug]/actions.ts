"use server";
import { after } from "next/server";
import { getLocale, getTranslations } from "next-intl/server";
import { parsePostMediaPayload } from "~/domain/entities/post/mediaPayload";
import { resolveOriginForUser } from "~/domain/entities/post/origin";
import { resolveKeyStrict } from "~/domain/entities/post/taxonomy";
import type { User } from "~/domain/entities/post/types";
import PostValidator from "~/domain/schemas/PostValidator";
import { redirectKeepingLocale } from "~/i18n/redirectKeepingLocale";
import { auth } from "~/infra/auth";
import { isAdmin } from "~/infra/auth/isAdmin";
import { SIGNIN_PATH } from "~/infra/constants";
import { getCategoryTaxonomy } from "~/infra/dataAccess/categories/cachedCategoryTaxonomy";
import { createIndexPostEmbeddingUseCase } from "~/infra/dataAccess/indexPostEmbedding/factory";
import { createPostAdminRepository } from "~/infra/dataAccess/managePost/factory";
import { createReviewPostContentUseCase } from "~/infra/dataAccess/moderatePost/factory";
import UpdateOnePostUseCase from "~/use_cases/managePost/updateOnePostUseCase";

export type EditPostState = {
  errorMessage?: string;
};

function readPositiveInt(value: FormDataEntryValue | null): number | null {
  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function readDate(value: FormDataEntryValue | null): Date | null {
  if (!value) return null;

  const date = new Date(String(value));

  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Guarda los cambios de una publicación propia y **reindexa si el texto cambió**.
 *
 * El reindexado va en `after()`, igual que al publicar: el vector se deriva del texto, así que
 * editar el título sin regenerarlo dejaría al chatbot recomendando algo que ya no dice eso. Pero
 * generar el embedding es una llamada de red, y guardar no puede depender de que el proveedor
 * conteste: si falla, la edición ya está guardada y la publicación queda pendiente de indexar,
 * que es justo lo que el backfill recoge.
 */
export async function updatePost(
  _prevState: EditPostState,
  formData: FormData,
): Promise<EditPostState> {
  const session = await auth();
  const userId = (session?.user as User | undefined)?.id;

  if (!userId) {
    redirectKeepingLocale(SIGNIN_PATH, await getLocale());
  }

  // Misma defensa que al publicar: un no-admin que fuerza un `hazlo_sano_*` se queda sin
  // procedencia, y el validador rechaza el producto en vez de guardarlo con la marca puesta.
  const origin = resolveOriginForUser(
    formData.get("origin") as string,
    isAdmin(session?.user?.email),
  );

  const taxonomy = await getCategoryTaxonomy();
  const category = resolveKeyStrict(
    taxonomy,
    formData.get("category") as string,
  );
  const requestedSubCategory = resolveKeyStrict(
    taxonomy,
    formData.get("subCategory") as string,
  );

  // Una sub-categoría que no cuelga de la categoría elegida la rechaza el FK compuesto.
  const subCategory =
    category &&
    taxonomy.nodes.get(requestedSubCategory ?? "")?.parentKey === category
      ? requestedSubCategory
      : null;

  const title = String(formData.get("title") ?? "");

  /* La lista completa que la publicación va a tener, en el orden en que se ve en pantalla: el índice
     acaba en `post_media.sort_order`. Se interpreta con la misma función que al publicar, así que un
     JSON roto llega aquí como lista vacía y lo atrapa la comprobación de abajo en vez de vaciarle
     los archivos a la publicación sin decir nada. */
  const media = parsePostMediaPayload(formData.get("media") as string, {
    alt: title,
  });

  /* **Al menos uno**, la única regla nueva de este slice, y vive aquí por lo mismo que su gemela al
     publicar: es del formulario y no de la entidad —quien puede contestarle a la persona en su
     idioma es esta capa—. Sin ella, quitar el último archivo dejaba una publicación que no se puede
     pintar, y el fallo no se vería al guardar sino al abrir la ficha. */
  if (media.length === 0) {
    return {
      errorMessage: (await getTranslations("publish"))("errorMediaRequired"),
    };
  }

  const useCase = new UpdateOnePostUseCase(
    createPostAdminRepository(),
    new PostValidator(),
  );

  const result = await useCase.execute({
    userId,
    slug: String(formData.get("slug") ?? ""),
    title,
    content: String(formData.get("content") ?? ""),
    price: Number(formData.get("price")) || null,
    origin,
    category,
    subCategory,
    startsAt: readDate(formData.get("startsAt")),
    endsAt: readDate(formData.get("endsAt")),
    durationMinutes: readPositiveInt(formData.get("durationMinutes")),
    media,
  });

  if ("errorMessage" in result && result.errorMessage) {
    return { errorMessage: result.errorMessage };
  }

  /* Se revisa **siempre que cambie el texto**, no solo al publicar. Sin esto el filtro duraría dos
     clics: se publica algo sano y se edita a cualquier cosa. Y es además el camino de salida —una
     publicación bajada que su autor corrige se restituye sola, sin depender del admin. */
  if ("textChanged" in result && result.textChanged) {
    reviewAfterResponse(
      result.postId,
      result.locale,
      title,
      String(formData.get("content") ?? ""),
    );
  }

  redirectKeepingLocale(
    {
      pathname: "/[slug]",
      params: { slug: "slug" in result ? result.slug : "" },
    },
    await getLocale(),
  );
}

/**
 * Vuelve a juzgar el texto editado y, solo si pasa, lo reindexa.
 *
 * El orden importa igual que al publicar: el vector es la puerta del chatbot, así que reindexar
 * antes de juzgar dejaría entrar por detrás lo que la edición acaba de romper.
 *
 * Y al revés también funciona, que es lo que hace justa esta feature: si la publicación estaba
 * bajada y el texto nuevo cumple, el veredicto la devuelve a `published` y el reindexado la pone
 * otra vez a disposición del bot.
 */
function reviewAfterResponse(
  postId: string,
  locale: string,
  title: string,
  content: string,
): void {
  after(async () => {
    const verdict = await createReviewPostContentUseCase().execute({
      postId,
      title,
      content,
    });

    if (!verdict.worthIndexing) {
      console.warn(
        // i18n-ignore: traza de servidor, no llega a ninguna pantalla.
        `[moderation] post ${postId} quedó en "${verdict.status}" tras editarlo; no se reindexa.`,
        verdict.error,
      );
      return;
    }

    const outcome = await createIndexPostEmbeddingUseCase().execute({
      postId,
      locale,
    });

    if (!outcome.indexed) {
      console.warn(
        // i18n-ignore: traza de servidor, no llega a ninguna pantalla.
        `[embeddings] post ${postId} quedó pendiente tras editarlo: ${outcome.reason}`,
        outcome.error,
      );
    }
  });
}
