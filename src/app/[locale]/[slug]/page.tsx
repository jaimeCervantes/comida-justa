import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import {
  canBeReportedBy,
  canBeViewedBy,
  MODERATION_REASONS,
  resolveModerationStatus,
} from "~/domain/entities/post/moderation";
import { resolvePostTranslation } from "~/domain/entities/post/translations";
import type { Coordinates } from "~/domain/entities/seller/coordinates";
import type { MappedStore } from "~/domain/entities/seller/map";
import { buildBreadcrumbJsonLd } from "~/domain/seo/jsonLd/breadcrumbs";
import { redirectKeepingLocale } from "~/i18n/redirectKeepingLocale";
import { resolveLocale, routing } from "~/i18n/routing";
import { auth } from "~/infra/auth";
import { isAdmin } from "~/infra/auth/isAdmin";
import { readViewerId } from "~/infra/auth/readViewerId";
import { storeOfPost } from "~/infra/dataAccess/sellers/PostgresPostStore";
import { readVisitorLocation } from "~/infra/location/visitorLocation";
import type { PostUser } from "~/infra/types/Posts";
import StoresMap from "~/presentation/location/StoresMap";
import Breadcrumbs from "~/presentation/navigation/Breadcrumbs";
import JsonLd from "~/presentation/seo/JsonLd";
import { postBreadcrumbs } from "../breadcrumbs";
import { postCategoryLabel } from "./categoryLabel";
import { getPostDetails, getRelatedPosts } from "./data";
import { buildPostStructuredData } from "./jsonLd";
import CommentList from "./loadComments/CommentList";
import { buildPostMetadata } from "./metadata";
import ModerationControls from "./ui/ModerationControls";
import ModerationNotice from "./ui/ModerationNotice";
import PostDetail from "./ui/PostDetail";
import RelatedPosts from "./ui/RelatedPosts";
import ReportPostForm, { type ReportLabels } from "./ui/ReportPostForm";

/**
 * El mismo código de motivo, redactado como **pregunta a quien denuncia**.
 *
 * El panel y el aviso al autor usan `reasonOffTopic` («No trata de descanso, alimentación…»), que
 * es el nombre que lee quien modera. A quien está mirando una publicación se le pregunta otra cosa
 * («No tiene que ver con salud ni bienestar»). Dos redacciones para un solo valor, igual que hizo
 * `origin` con el selector del vendedor y el reporte de admin.
 */
const REPORT_REASON_KEYS = {
  off_topic: "reportOffTopic",
  health_claim: "reportHealthClaim",
  spam: "reportSpam",
  offensive: "reportOffensive",
  restricted_product: "reportRestrictedProduct",
} as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}): Promise<Metadata> {
  const { slug, locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const post = await getPostDetails(slug);

  // Sin publicación no hay nada que anunciar: la página responde 404 y el layout pone lo suyo.
  return post
    ? buildPostMetadata(post, slug, locale, routing.defaultLocale)
    : {};
}

/**
 * La tienda detrás de la publicación y dónde está quien mira.
 *
 * Una consulta para las dos cosas que el detalle necesita de ella: la distancia que va junto al
 * título y el punto que pinta el mapa del final. La consulta corre **aunque el visitante no haya
 * compartido su ubicación**, porque el mapa vale igual —"¿dónde está esta tienda?" es una pregunta
 * completa— y solo se queda sin la distancia.
 */
async function resolveStoreContext(slug: string): Promise<{
  visitor: Coordinates | null;
  store: MappedStore | null;
}> {
  const visitor = await readVisitorLocation();

  return { visitor, store: await storeOfPost(slug, visitor) };
}

export default async function Slug({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const session = await auth();
  const { slug, locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  setRequestLocale(locale);
  const viewerId = await readViewerId();
  const tCommon = await getTranslations("common");

  // Se resuelve aquí, fuera de cualquier `<Suspense>`: si la publicación no existe, la respuesta
  // debe salir con status 404 y no con un 200 que solo "parece" un 404. Dentro de un boundary,
  // el shell ya se envió y el status queda congelado en 200.
  const post = await getPostDetails(slug);

  if (!post) {
    notFound();
  }

  /* Lo que un admin bajó no existe para el resto del mundo, pero sigue existiendo para su autor:
     es la única forma que tiene de enterarse, porque el sitio no manda correos. Va aquí y no en la
     consulta a propósito — el repositorio devuelve el estado y quien decide es esta página, que es
     la que sabe quién está mirando. */
  const viewerIsAdmin = isAdmin(session?.user?.email);
  const moderation = {
    userId: String((post.user as PostUser | undefined)?.id ?? ""),
    moderationStatus: post.moderationStatus as string | undefined,
    moderationReason: post.moderationReason as string | undefined,
  };

  if (!canBeViewedBy(moderation, { id: viewerId, isAdmin: viewerIsAdmin })) {
    notFound();
  }

  /* El botón de avisar: solo a quien puede accionarlo de verdad —con sesión, que no sea su autor, y
     sobre algo que está publicado—. El gate real vuelve a comprobarse en la acción, porque una
     Server Action se puede invocar sin pasar por esta pantalla. */
  const canReport = canBeReportedBy(moderation, { id: viewerId });
  const tModeration = await getTranslations("moderation");
  const reportLabels: ReportLabels = {
    cta: tModeration("reportCta"),
    heading: tModeration("reportHeading"),
    placeholder: tModeration("reportPlaceholder"),
    done: tModeration("reportDone"),
    reasons: MODERATION_REASONS.map((reason) => ({
      value: reason,
      label: tModeration(REPORT_REASON_KEYS[reason]),
    })),
  };

  // Lo que declara el producto es la misma etiqueta que ve quien lo lee.
  const categoryLabel = await postCategoryLabel(
    post.category,
    post.subCategory,
    locale,
  );

  const translation = resolvePostTranslation(
    post.translations,
    locale,
    routing.defaultLocale,
  );

  /**
   * Cada idioma tiene su propio slug, así que una publicación pedida en inglés por su dirección
   * española se sirve en su dirección inglesa.
   *
   * Es lo que arreglaba el cambio de idioma en la ficha: el selector reconstruye la ruta con los
   * `params` de la ruta activa, así que al pasar a inglés producía `/en/suero-natural` —el slug
   * español con el prefijo inglés—. Con esa URL, la consulta del detalle emparejaba la fila `es`
   * (el contenido no cambiaba) y la de relacionadas buscaba un slug español en la tabla inglesa
   * (el bloque desaparecía entero).
   *
   * Va aquí y no en el selector porque cubre **todas** las puertas de entrada, no solo esa: un
   * enlace compartido, un resultado indexado o una dirección escrita a mano acaban igual de bien.
   *
   * Solo redirige cuando la traducción es propia del idioma pedido (`!isFallback`). Una
   * publicación que aún no existe en inglés se sirve en español bajo el marco inglés, sin rebotar.
   */
  if (
    translation &&
    !translation.isFallback &&
    translation.slug &&
    translation.slug !== slug
  ) {
    redirectKeepingLocale(
      { pathname: "/[slug]", params: { slug: translation.slug } },
      locale,
    );
  }

  /* Quien llega desde un buscador aterriza aquí sin haber pasado por el catálogo: la miga es su
     única forma de subir, y es lo que permite declarar el `BreadcrumbList`. */
  const title = String(translation?.title ?? post.title ?? "");
  const { crumbs, jsonLdItems } = await postBreadcrumbs({
    categoryKey: post.subCategory ?? post.category,
    title,
    homeLabel: tCommon("home"),
    locale,
  });
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(jsonLdItems);
  const { visitor, store } = await resolveStoreContext(slug);

  return (
    <section className="sm:flex sm:gap-4 flex-wrap">
      <Breadcrumbs
        items={crumbs}
        ariaLabel={tCommon("breadcrumb")}
        className="w-full mb-3"
      />
      {/* Arriba del todo: quien llega aquí y ve su publicación tiene que enterarse antes de
          leerla, no después de bajar hasta los comentarios. */}
      <ModerationNotice
        status={resolveModerationStatus(moderation.moderationStatus)}
        reason={moderation.moderationReason}
      />
      {/* El interruptor va donde el admin se topa con el problema, no en un panel aparte: la
          bandeja de `/admin/moderacion` solo lista lo que YA no está publicado. */}
      <ModerationControls
        postId={String(post.id ?? "")}
        status={resolveModerationStatus(moderation.moderationStatus)}
        isAdmin={viewerIsAdmin}
      />
      <JsonLd
        data={buildPostStructuredData(
          post,
          slug,
          categoryLabel,
          locale,
          routing.defaultLocale,
        )}
      />
      {breadcrumbJsonLd ? <JsonLd data={breadcrumbJsonLd} /> : null}
      {/*
        El orden del DOM es el de MÓVIL —publicación, mapa, comentarios, recomendadas— y las clases
        `sm:order-*` lo reacomodan en escritorio, donde las dos primeras son columnas hermanas y el
        mapa cae debajo de recomendadas.

        Va así y no al revés porque en móvil el mapa tiene que quedar **antes de los comentarios**:
        cuando alguien ya leyó el producto, la pregunta siguiente es si puede ir por él, no qué
        opinan los demás. En escritorio esa pregunta llega más tarde, porque las recomendadas están
        a la vista desde el principio y el mapa a lo ancho es el cierre natural de la página.
      */}
      <PostDetail
        post={post}
        className="sm:w-[50%] mb-4 sm:order-1"
        user={session?.user as PostUser}
        locale={locale}
        slug={slug}
        distanceMeters={store?.meters ?? null}
      />

      {store ? (
        <StoresMap
          visitor={visitor}
          stores={[store]}
          headingKey="storeMapHeading"
          className="w-full sm:order-3"
        />
      ) : null}

      <section data-testid="comments" className="w-full mt-4 mb-4 sm:order-4">
        <Suspense>
          <CommentList
            postId={post.id}
            user={session?.user as PostUser}
            initialComments={post.comments}
          />
        </Suspense>

        {/* Abajo del todo a propósito: avisar es el último recurso de quien ya leyó la
            publicación entera, no una acción que compita con leerla. */}
        {canReport ? (
          <ReportPostForm
            postId={String(post.id ?? "")}
            labels={reportLabels}
          />
        ) : null}
      </section>

      {/* Se resuelve aquí y no dentro del detalle: son dos columnas hermanas, y el parecido no
          es parte de la publicación sino de su vecindario. */}
      <RelatedPosts
        posts={await getRelatedPosts(String(post.id ?? ""), locale)}
        viewerId={viewerId}
        className="sm:order-2"
      />
    </section>
  );
}
