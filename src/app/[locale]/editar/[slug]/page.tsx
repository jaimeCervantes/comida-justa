import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { optionsFor } from "~/domain/entities/post/taxonomy";
import type { User } from "~/domain/entities/post/types";
import { resolveLocale } from "~/i18n/routing";
import { auth } from "~/infra/auth";
import { isAdmin } from "~/infra/auth/isAdmin";
import { redirectToSignIn } from "~/infra/auth/redirectToSignIn";
import { getCategoryTaxonomy } from "~/infra/dataAccess/categories/cachedCategoryTaxonomy";
import { createPostAdminRepository } from "~/infra/dataAccess/managePost/factory";
import { createRouteRepository } from "~/infra/dataAccess/routes/factory";
import { updatePost } from "./actions";
import EditPostForm from "./ui/EditPostForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("edit");

  return {
    title: t("metaTitle"),
    // Es una pantalla de administración: no hay nada que indexar.
    robots: { index: false, follow: false },
  };
}

export default async function EditarPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const session = await auth();
  const { locale: rawLocale, slug } = await params;
  const locale = resolveLocale(rawLocale);

  if (!session) {
    redirectToSignIn(locale, { pathname: "/editar/[slug]", params: { slug } });
  }

  setRequestLocale(locale);
  const userId = (session.user as User | undefined)?.id;
  const post = await createPostAdminRepository().findBySlug(slug);

  // 404 y no 403 a quien no es su dueño: la existencia de una publicación es pública, pero que
  // exista una pantalla para editarla no tiene por qué revelarse. Mismo criterio que /admin.
  if (!post || post.ownerId !== userId) {
    notFound();
  }

  /* El recorrido guardado, sólo para enseñarlo: sin él, el campo del formulario diría «este evento
     no tiene recorrido» sobre uno que sí lo tiene, y quien edite el título creería que lo perdió.
     Se pide siempre y no sólo para eventos porque `kind` no puede cambiarse al editar: un anuncio
     nunca tuvo ruta, así que la consulta devuelve `null` y no cuesta nada. */
  const route = await createRouteRepository().findByPostId(post.id);

  const taxonomy = await getCategoryTaxonomy();
  const categoryOptions = optionsFor(taxonomy, null, locale);
  const subCategoryOptionsByCategory = Object.fromEntries(
    categoryOptions.map(({ value }) => [
      value,
      optionsFor(taxonomy, value, locale),
    ]),
  );

  return (
    <EditPostForm
      action={updatePost}
      post={{
        slug: post.slug,
        title: post.title,
        content: post.content,
        contactPhone: post.contactPhone ?? "",
        price: post.price,
        kind: post.kind,
        origin: post.origin,
        category: post.category,
        subCategory: post.subCategory,
        startsAt: post.startsAt,
        endsAt: post.endsAt,
        durationMinutes: post.durationMinutes,
        media: post.media,
        /* Sólo la forma, que es lo único que se sabe del recorrido meses después: el archivo `.gpx`
           no se guarda en ningún sitio. Los puntos tampoco suben al formulario — pesan y no se
           pintan; para verlos está la ficha. */
        route: route
          ? {
              lengthMeters: route.lengthMeters,
              sourcePoints: route.sourcePoints,
            }
          : null,
      }}
      isAdmin={isAdmin(session.user?.email)}
      categoryOptions={categoryOptions}
      subCategoryOptionsByCategory={subCategoryOptionsByCategory}
    />
  );
}
