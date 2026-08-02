"use server";
import { after } from "next/server";
import { getLocale } from "next-intl/server";
import { resolveKeyStrict } from "~/domain/entities/post/taxonomy";
import type { User } from "~/domain/entities/post/types";
import PostValidator from "~/domain/schemas/PostValidator";
import { redirectKeepingLocale } from "~/i18n/redirectKeepingLocale";
import { auth } from "~/infra/auth";
import { SIGNIN_PATH } from "~/infra/constants";
import { getCategoryTaxonomy } from "~/infra/dataAccess/categories/cachedCategoryTaxonomy";
import { createIndexPostEmbeddingUseCase } from "~/infra/dataAccess/indexPostEmbedding/factory";
import { createPostAdminRepository } from "~/infra/dataAccess/managePost/factory";
import UpdateOnePostUseCase from "~/use_cases/managePost/updateOnePostUseCase";

export type EditPostState = {
  errorMessage?: string;
};

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

  const useCase = new UpdateOnePostUseCase(
    createPostAdminRepository(),
    new PostValidator(),
  );

  const result = await useCase.execute({
    userId,
    slug: String(formData.get("slug") ?? ""),
    title: String(formData.get("title") ?? ""),
    content: String(formData.get("content") ?? ""),
    price: Number(formData.get("price")) || null,
    category,
    subCategory,
  });

  if ("errorMessage" in result && result.errorMessage) {
    return { errorMessage: result.errorMessage };
  }

  if ("textChanged" in result && result.textChanged) {
    reindexAfterResponse(result.postId, result.locale);
  }

  redirectKeepingLocale(
    {
      pathname: "/[slug]",
      params: { slug: "slug" in result ? result.slug : "" },
    },
    await getLocale(),
  );
}

function reindexAfterResponse(postId: string, locale: string): void {
  after(async () => {
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
