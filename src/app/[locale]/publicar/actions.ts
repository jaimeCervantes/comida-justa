"use server";
import { redirect } from "next/navigation";
import { after } from "next/server";
import {
  resolveCategory,
  resolveSubCategory,
} from "~/domain/entities/post/category";
import { DEFAULT_POST_KIND, type PostKind } from "~/domain/entities/post/kind";
import { resolveOriginForUser } from "~/domain/entities/post/origin";
import PostEntity from "~/domain/entities/post/Post";
import type { User } from "~/domain/entities/post/types";
import PostValidator from "~/domain/schemas/PostValidator";
import getErrorMessage from "~/domain/shared/getErrorMessage";
import { auth } from "~/infra/auth";
import { isAdmin } from "~/infra/auth/isAdmin";
import { SIGNIN_PATH } from "~/infra/constants";
import { createPostRepository } from "~/infra/dataAccess/createOnePost/factory";
import { createIndexPostEmbeddingUseCase } from "~/infra/dataAccess/indexPostEmbedding/factory";
import type { ActionState } from "~/infra/types/Actions";
import CreateOnePostUseCase from "~/use_cases/createOnePost/createOnePostUseCase";

const useCase = new CreateOnePostUseCase(
  new PostValidator(),
  new PostEntity(),
  createPostRepository(),
);

/** El idioma en el que se escribe hoy toda publicación; la traducción vive bajo esa clave. */
const PUBLISH_LOCALE = "es";

/**
 * Deja la publicación indexada para el chatbot **después** de responderle a quien publicó.
 *
 * `after()` es lo que mantiene a Gemini fuera del camino crítico: el redirect al detalle no
 * espera al proveedor, y si el proveedor falla la publicación ya existe — queda pendiente de
 * indexar y el backfill la recoge. Publicar nunca se rompe por un embedding.
 */
function indexAfterResponse(postId: string): void {
  after(async () => {
    const result = await createIndexPostEmbeddingUseCase().execute({
      postId,
      locale: PUBLISH_LOCALE,
    });

    if (!result.indexed) {
      console.warn(
        `[embeddings] post ${postId} queda pendiente de indexar: ${result.reason}`,
        result.error,
      );
    }
  });
}

export async function createPost(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth();

  if (!session) {
    redirect(SIGNIN_PATH);
  }

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const mediaJSON = formData.get("media") as string;
  const price = formData.get("price");
  const phone = formData.get("phone") as string;
  const kind: PostKind =
    (formData.get("kind") as string) === "producto"
      ? "producto"
      : DEFAULT_POST_KIND;

  // Server-side defense: only an admin may assign a "hazlo_sano_*" origin.
  const admin = isAdmin(session?.user?.email);
  const origin = resolveOriginForUser(formData.get("origin") as string, admin);

  // Fuera de la allowlist se ignora (queda `null`) en vez de romper la publicación.
  const category = resolveCategory(formData.get("category") as string);
  const subCategory = resolveSubCategory(formData.get("subCategory") as string);

  const errors = {
    title: title ? null : "El título es obligatorio.",
    content: content ? null : "El contenido es obligatorio",
    phone: phone ? null : "El Télefono es obligatorio.",
    media: mediaJSON
      ? null
      : "Los datos del recourso(video, imagen) son obligatorios",
  };

  let media = { url: "", type: "", alt: "" };
  try {
    media = JSON.parse(mediaJSON);
  } catch (error) {
    console.log(error);
  }

  const hasErrors = Object.values(errors).some((errMsg) => errMsg);

  if (hasErrors) {
    return { errors: errors, success: false, id: null, slug: null };
  }

  let result: Awaited<ReturnType<typeof useCase.execute>>;
  try {
    result = await useCase.execute({
      title,
      slug: "",
      content,
      contactInfo: {
        phone,
      },
      price: Number(price) || null,
      kind,
      origin,
      category,
      subCategory,
      createdAt: new Date(),
      media: {
        url: media.url,
        type: media.type.split("/")[0],
        alt: title,
      },
      user: session?.user as User,
    });
  } catch (err) {
    const genericMessage =
      "Sucedio un error al tratar de crear tu publicación. No eres tu, soy yo, tu servidor :(.";

    return {
      errors: {
        errorMessage:
          process.env.NODE_ENV === "development"
            ? getErrorMessage(err, genericMessage)
            : genericMessage,
      },
      id: null,
      slug: null,
    };
  }

  if (result?.error) {
    return { errors: { errorMessage: result.errorMessage }, success: false };
  }

  if (result?.id) {
    indexAfterResponse(result.id);
  }

  redirect(`/${result?.slug}`);
}
