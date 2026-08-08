"use server";
import { after } from "next/server";
import { getLocale, getTranslations } from "next-intl/server";
import { DEFAULT_POST_KIND, type PostKind } from "~/domain/entities/post/kind";
import { resolveOriginForUser } from "~/domain/entities/post/origin";
import PostEntity from "~/domain/entities/post/Post";
import { resolveKeyStrict } from "~/domain/entities/post/taxonomy";
import type { User } from "~/domain/entities/post/types";
import PostValidator from "~/domain/schemas/PostValidator";
import getErrorMessage from "~/domain/shared/getErrorMessage";
import { redirectKeepingLocale } from "~/i18n/redirectKeepingLocale";
import { routing } from "~/i18n/routing";
import { auth } from "~/infra/auth";
import { isAdmin } from "~/infra/auth/isAdmin";
import { SIGNIN_PATH } from "~/infra/constants";
import { getCategoryTaxonomy } from "~/infra/dataAccess/categories/cachedCategoryTaxonomy";
import { createPostRepository } from "~/infra/dataAccess/createOnePost/factory";
import { createIndexPostEmbeddingUseCase } from "~/infra/dataAccess/indexPostEmbedding/factory";
import { createSellerRepository } from "~/infra/dataAccess/sellers/factory";
import { createTranslatePostUseCase } from "~/infra/dataAccess/translatePost/factory";
import type { ActionState } from "~/infra/types/Actions";
import CreateOnePostUseCase from "~/use_cases/createOnePost/createOnePostUseCase";

const useCase = new CreateOnePostUseCase(
  new PostValidator(),
  new PostEntity(),
  createPostRepository(),
);

/** El idioma en el que se escribe hoy toda publicación; la traducción vive bajo esa clave. */
const PUBLISH_LOCALE = "es";

/** Los idiomas del sitio que no son aquel en el que se escribió: a esos hay que traducir. */
const TRANSLATION_TARGETS = routing.locales.filter(
  (locale) => locale !== PUBLISH_LOCALE,
);

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

/**
 * Traduce la publicación a los demás idiomas **después** de responder.
 *
 * Va en su propio `after()` y no dentro del anterior a propósito: si Gemini tarda 30 segundos en
 * traducir, el embedding —que es lo que hace que el chatbot la encuentre— no tiene por qué esperar
 * detrás. Son dos trabajos independientes que fallan por su cuenta.
 *
 * El caso de uso no lanza nunca: lo que no se pueda traducir queda pendiente y lo recoge
 * `pnpm run backfill-translations`.
 */
function translateAfterResponse(postId: string): void {
  if (TRANSLATION_TARGETS.length === 0) return;

  after(async () => {
    const useCaseInstance = createTranslatePostUseCase();

    for (const targetLocale of TRANSLATION_TARGETS) {
      const result = await useCaseInstance.execute({
        postId,
        sourceLocale: PUBLISH_LOCALE,
        targetLocale,
      });

      if (result.translated) continue;

      /* Dos avisos y no uno: "queda pendiente, lo recoge el backfill" solo es verdad cuando falló
         el proveedor. Si lo que falló fue guardar, el backfill volverá a pagarle a Gemini para
         estrellarse contra la misma base, y quien lea el registro tiene que ir a mirar ahí. */
      if (result.reason === "provider-failed") {
        console.warn(
          `[translations] post ${postId} queda pendiente en ${targetLocale}: no contestó el traductor. Lo recoge \`pnpm run backfill-translations\`.`,
          result.error,
        );
      } else if (result.reason === "storage-failed") {
        console.error(
          `[translations] post ${postId} NO se guardó en ${targetLocale}: falló la base, no el traductor. La traducción ya se pagó y se perdió; revisa la conexión antes de relanzar el backfill.`,
          result.error,
        );
      }
    }
  });
}

export async function createPost(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const t = await getTranslations("publish");
  const session = await auth();

  if (!session) {
    redirectKeepingLocale(SIGNIN_PATH, await getLocale());
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

  // Fuera del catálogo se ignora (queda `null`) en vez de romper la publicación.
  const taxonomy = await getCategoryTaxonomy();
  const category = resolveKeyStrict(
    taxonomy,
    formData.get("category") as string,
  );
  const requestedSubCategory = resolveKeyStrict(
    taxonomy,
    formData.get("subCategory") as string,
  );

  // Una sub-categoría que no cuelga de la categoría elegida la rechaza el FK compuesto de `posts`.
  // Se descarta aquí para que el formulario no reviente con un 500 por una combinación imposible.
  const subCategory =
    category &&
    taxonomy.nodes.get(requestedSubCategory ?? "")?.parentKey === category
      ? requestedSubCategory
      : null;

  const errors = {
    title: title ? null : t("errorTitleRequired"),
    content: content ? null : "El contenido es obligatorio",
    phone: phone ? null : t("errorPhoneRequired"),
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

  // La publicación nace con su tienda; deducirla después por `user_id` costaría una consulta en
  // cada lectura y se rompería el día que una tienda tenga más de un dueño.
  const userId = (session.user as User | undefined)?.id;
  const seller = userId
    ? await createSellerRepository().findByUserId(userId)
    : null;

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
      sellerId: seller?.id ?? null,
      createdAt: new Date(),
      media: {
        url: media.url,
        type: media.type.split("/")[0],
        alt: title,
      },
      user: session?.user as User,
    });
  } catch (err) {
    const genericMessage = t("errorUnexpected");

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
    translateAfterResponse(result.id);
  }

  redirectKeepingLocale(
    { pathname: "/[slug]", params: { slug: result?.slug ?? "" } },
    await getLocale(),
  );
}
