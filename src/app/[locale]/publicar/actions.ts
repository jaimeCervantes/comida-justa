"use server";
import { after } from "next/server";
import { getLocale, getTranslations } from "next-intl/server";
import type { ParsedRoute } from "~/domain/entities/post/gpx";
import {
  DEFAULT_POST_KIND,
  isValidKind,
  type PostKind,
} from "~/domain/entities/post/kind";
import { parsePostMediaPayload } from "~/domain/entities/post/mediaPayload";
import { resolveOriginForUser } from "~/domain/entities/post/origin";
import PostEntity from "~/domain/entities/post/Post";
import { parseRoutePayload } from "~/domain/entities/post/routeFile";
import { resolveKeyStrict } from "~/domain/entities/post/taxonomy";
import type { User } from "~/domain/entities/post/types";
import RouteFileError, {
  type RouteFileProblem,
} from "~/domain/errors/RouteFileError";
import { parseDateTimeLocalInTimeZone } from "~/domain/schedule/localDateTime";
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
import { createReviewPostContentUseCase } from "~/infra/dataAccess/moderatePost/factory";
import { createRouteRepository } from "~/infra/dataAccess/routes/factory";
import { createSellerRepository } from "~/infra/dataAccess/sellers/factory";
import { createTranslatePostUseCase } from "~/infra/dataAccess/translatePost/factory";
import type { ActionState } from "~/infra/types/Actions";
import { ROUTE_FILE_ERROR_KEYS } from "~/infra/UI/labels/routeFileErrorKeys";
import CreateOnePostUseCase from "~/use_cases/createOnePost/createOnePostUseCase";

const useCase = new CreateOnePostUseCase(
  new PostValidator(),
  new PostEntity(),
  createPostRepository(),
);

/**
 * Comprueba el recorrido que llega del formulario.
 *
 * **Ya no llega el archivo, llegan sus puntos.** El `.gpx` viajaba aquí dentro y el cuerpo de una
 * Server Action admite 1 MB: en producción reventaba con un 413 y quien publicaba perdía todo lo
 * escrito. Como del archivo solo interesan los puntos —y `parseGpx` recorta a 2.000—, ahora lo
 * interpreta el navegador (`RouteFileField`) y lo que cruza la red es lo que se va a guardar.
 *
 * De ahí que esto valide en vez de interpretar: los puntos son datos del cliente, y de aquí van
 * derechos a `ST_GeogFromText`. Ver `domain/entities/post/routeFile.ts`.
 *
 * Devuelve el problema en vez de lanzarlo para que la acción pueda contestarle a la persona en su
 * idioma y **sin perder lo que ya escribió**.
 */
function readRoute(entry: FormDataEntryValue | null): {
  route: ParsedRoute | null;
  problem?: RouteFileProblem;
} {
  const payload = typeof entry === "string" ? entry.trim() : "";

  // Sin recorrido no hay nada que comprobar: una rodada sin GPX sigue siendo una rodada.
  if (!payload) return { route: null };

  try {
    return { route: parseRoutePayload(payload) };
  } catch (error) {
    if (error instanceof RouteFileError)
      return { route: null, problem: error.problem };
    throw error;
  }
}

/** Minutos enteros y positivos. Cualquier otra cosa cuenta como ausente y la contesta el error. */
function readPositiveInt(value: FormDataEntryValue | null): number | null {
  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function readPositiveNumber(value: FormDataEntryValue | null): number | null {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

/** El idioma en el que se escribe hoy toda publicación; la traducción vive bajo esa clave. */
const PUBLISH_LOCALE = "es";

/** Los idiomas del sitio que no son aquel en el que se escribió: a esos hay que traducir. */
const TRANSLATION_TARGETS = routing.locales.filter(
  (locale) => locale !== PUBLISH_LOCALE,
);

/**
 * Deja la publicación indexada para el chatbot.
 *
 * Corre dentro del `after()` de la revisión y **solo si pasó**: el vector es justamente lo que la
 * hace encontrable por el bot, así que dárselo a algo que se acaba de bajar sería abrirle la puerta
 * de atrás. Si el proveedor falla, la publicación ya existe y queda pendiente para el backfill.
 */
async function indexNow(postId: string): Promise<void> {
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
}

/**
 * Traduce la publicación a los demás idiomas.
 *
 * Corre **en paralelo** al indexado y no detrás: si Gemini tarda 30 segundos en traducir, el
 * embedding —que es lo que hace que el chatbot la encuentre— no tiene por qué esperar. Son dos
 * trabajos independientes que fallan por su cuenta, y por eso quien los lanza usa `allSettled`.
 *
 * También cuelga de la revisión: traducir algo que se acaba de bajar es pagarle a Gemini por un
 * texto que nadie va a leer.
 *
 * El caso de uso no lanza nunca: lo que no se pueda traducir queda pendiente y lo recoge
 * `pnpm run backfill-translations`.
 */
async function translateNow(postId: string): Promise<void> {
  if (TRANSLATION_TARGETS.length === 0) return;

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
        // i18n-ignore: registro del servidor; lo lee quien opera, no un visitante.
        `[translations] post ${postId} queda pendiente en ${targetLocale}: no contestó el traductor. Lo recoge \`pnpm run backfill-translations\`.`,
        result.error,
      );
    } else if (result.reason === "storage-failed") {
      console.error(
        // i18n-ignore: registro del servidor; lo lee quien opera, no un visitante.
        `[translations] post ${postId} NO se guardó en ${targetLocale}: falló la base, no el traductor. La traducción ya se pagó y se perdió; revisa la conexión antes de relanzar el backfill.`,
        result.error,
      );
    }
  }
}

/**
 * Revisa la publicación **después** de responder, y solo entonces la indexa y la traduce.
 *
 * El orden es la mitad del valor de este slice, y por dos razones:
 *
 * 1. **El vector es la puerta del chatbot.** Indexar antes de juzgar dejaría lo rechazado
 *    encontrable por el bot durante la ventana en que se revisa, que es justo lo que se quiere
 *    cerrar.
 * 2. **Traducir cuesta dinero.** Pagarle a Gemini por el texto en inglés de algo que se acaba de
 *    bajar es tirarlo.
 *
 * Los dos trabajos de después van con `allSettled` y no en serie: son independientes, y que la
 * traducción tarde treinta segundos no puede retrasar el embedding.
 */
function reviewAfterResponse(
  postId: string,
  title: string,
  content: string,
): void {
  after(async () => {
    const outcome = await createReviewPostContentUseCase().execute({
      postId,
      title,
      content,
    });

    if (outcome.status === "in_review") {
      console.warn(
        // i18n-ignore: registro del servidor; lo lee quien opera, no un visitante.
        `[moderation] post ${postId} quedó sin revisar y espera en /admin/moderacion.`,
        outcome.error,
      );
      return;
    }

    if (!outcome.worthIndexing) {
      console.info(
        // i18n-ignore: registro del servidor; lo lee quien opera, no un visitante.
        `[moderation] post ${postId} se bajó por "${outcome.reason}"; no se indexa ni se traduce.`,
      );
      return;
    }

    await Promise.allSettled([indexNow(postId), translateNow(postId)]);
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
  const price = readPositiveNumber(formData.get("price"));
  const phone = formData.get("phone") as string;
  /* Se resuelve contra la allowlist del dominio en vez de comparar contra un literal: así sumar un
     tipo no exige acordarse de tocar también esta línea, que es justo lo que se olvidaría. */
  const requestedKind = formData.get("kind") as string;
  const kind: PostKind = isValidKind(requestedKind)
    ? requestedKind
    : DEFAULT_POST_KIND;

  /* Las fechas solo se leen en un evento. En lo demás viajan como `null` a propósito: afirmar que
     un producto no ocurre a una hora es distinto de dejarlo sin decidir. */
  const timeZone = formData.get("timeZone");
  const startsAt =
    kind === "evento"
      ? parseDateTimeLocalInTimeZone(formData.get("startsAt"), timeZone)
      : null;
  const endsAt =
    kind === "evento"
      ? parseDateTimeLocalInTimeZone(formData.get("endsAt"), timeZone)
      : null;

  /* La duración solo se lee en un servicio. En lo demás viaja como `null`: un producto no dura, y
     un evento ya dice cuánto con sus dos fechas. */
  const durationMinutes =
    kind === "servicio"
      ? readPositiveInt(formData.get("durationMinutes"))
      : null;

  /* El recorrido solo se lee en un evento, y es opcional: una rodada sin GPX sigue siendo una
     rodada. Lo que NO se hace es guardar la publicación y perder el archivo en silencio. */
  const { route, problem: routeProblem } =
    kind === "evento"
      ? readRoute(formData.get("route"))
      : { route: null, problem: undefined };

  // Server-side defense: only an admin may assign a "hazlo_sano_*" origin.
  const admin = isAdmin(session?.user?.email);
  const origin = resolveOriginForUser(formData.get("origin") as string, admin);
  const requiresPrice = kind === "producto" || kind === "servicio";

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

  /* El campo oculto trae la lista entera, en el orden en que se subieron; el índice acaba en
     `sort_order`. Las dimensiones las midió el navegador antes de subir (`readImageSize`) y viajan
     en este mismo JSON: aquí no se validan más allá de que sean números utilizables, porque el
     `CHECK` de `post_media` ya rechaza un cero o un negativo y el dominio trata «falta una» como
     «no lo sabemos».

     El `alt` se fija al título por la misma razón de siempre: la columna no tiene idioma, así que
     quien pinta lo reemplaza por el de la traducción activa. */
  const media = parsePostMediaPayload(mediaJSON, { alt: title });

  const errors = {
    title: title ? null : t("errorTitleRequired"),
    /* La fecha es lo que convierte una publicación en evento, así que se comprueba aquí —donde se
       le puede contestar a la persona en su idioma— además de en el validador del dominio. */
    startsAt: kind !== "evento" || startsAt ? null : t("errorStartsAtRequired"),
    endsAt:
      startsAt && endsAt && endsAt < startsAt
        ? t("errorEndsBeforeStarts")
        : null,
    route: routeProblem ? t(ROUTE_FILE_ERROR_KEYS[routeProblem]) : null,
    durationMinutes:
      kind !== "servicio" || durationMinutes
        ? null
        : t("errorDurationRequired"),
    price: !requiresPrice || price ? null : t("errorPriceRequired"),
    origin: kind !== "producto" || origin ? null : t("errorOriginRequired"),
    content: content ? null : t("errorContentRequired"),
    phone: phone ? null : t("errorPhoneRequired"),
    /* Se comprueba lo que se pudo interpretar y no que el campo traiga texto. Antes bastaba con que
       el campo no estuviera vacío, así que un JSON roto pasaba el filtro y la publicación se
       guardaba sin ninguna imagen. */
    media: media.length > 0 ? null : t("errorMediaRequired"),
  };

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
      price: kind === "anuncio" ? null : price,
      kind,
      origin,
      category,
      subCategory,
      sellerId: seller?.id ?? null,
      startsAt,
      endsAt,
      durationMinutes,
      createdAt: new Date(),
      media,
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

  /* El recorrido se guarda con la publicación ya creada, porque cuelga de su id. Va antes de
     responder —y no en un `after()`— a propósito: sin ruta el evento se ve incompleto, y ya está
     todo en memoria, así que cuesta una inserción y ninguna llamada de red. */
  if (result?.id && route) {
    try {
      await createRouteRepository().save({
        postId: result.id,
        points: route.points,
        lengthMeters: route.meters,
        sourcePoints: route.originalPoints,
      });
    } catch (error) {
      /* La publicación ya existe y es válida sin ruta: perderla entera por un fallo al guardar el
         trazo sería peor. Se avisa y quien la editó puede volver a subir el archivo. */
      console.error(
        // i18n-ignore: registro del servidor; lo lee quien opera, no un visitante.
        `[routes] post ${result.id} se publicó sin su recorrido: falló al guardarlo.`,
        error,
      );
    }
  }

  if (result?.id) {
    reviewAfterResponse(result.id, title, content);
  }

  redirectKeepingLocale(
    { pathname: "/[slug]", params: { slug: result?.slug ?? "" } },
    await getLocale(),
  );
}
