import { getTranslations } from "next-intl/server";
import { type AppHref, Link } from "~/i18n/navigation";
import type { PostUser } from "~/infra/types/Posts";
import IdentityLink from "~/presentation/identity/IdentityLink";
import type { StoreIdentity } from "~/presentation/identity/StoreIdentity";
import StoreLogo from "~/presentation/identity/StoreLogo";
import Avatar from "~/presentation/user/Avatar";
import { profileHref } from "../../cuenta/profilePath";
import { storeHref } from "../../cuenta/storePath";

const LINK_CLASS = "text-highlight hover:underline";

/**
 * Las tres salidas de una publicación: su categoría, su tienda y quien la publicó.
 *
 * Hasta el slice 6 el detalle era un callejón sin salida —quien llegaba desde un buscador solo
 * podía volver atrás—, y para un rastreador era una hoja sin enlaces hacia el resto del catálogo.
 * Cada enlace se pinta **solo si existe su destino**: hay publicaciones sin categoría, sin tienda y
 * de autores que no han reclamado su dirección.
 *
 * Desde el slice 8 la tienda y el autor **también** están arriba, en `PostIdentity`. Se enlazan dos
 * veces a propósito: esto es lo que queda al terminar de leer y lo que recoge un rastreador al
 * final de la página, y aquello es de quién es. Para que quien navega por enlaces no oiga dos veces
 * lo mismo, los textos son distintos —aquí la frase entera, allí el nombre solo— y las imágenes van
 * marcadas como decorativas.
 */
export default async function PostLinks({
  categoryKey,
  categoryLabel,
  seller,
  author,
}: {
  categoryKey?: string | null;
  categoryLabel?: string | null;
  seller?: StoreIdentity | null;
  author?: PostUser | null;
}) {
  const t = await getTranslations("post");

  const authorUsername = author?.username;
  const authorName = author?.name ?? authorUsername;

  const hasCategory = Boolean(categoryKey && categoryLabel);
  const hasAuthor = Boolean(authorUsername && authorName);

  if (!hasCategory && !seller && !hasAuthor) return null;

  return (
    <nav className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
      {categoryKey && categoryLabel ? (
        <Link
          href={
            {
              pathname: "/categoria/[key]",
              params: { key: categoryKey },
            } as AppHref
          }
          className={LINK_CLASS}
          data-testid="post-link-category"
        >
          {t("seeCategory", { category: categoryLabel })}
        </Link>
      ) : null}

      {seller ? (
        <IdentityLink
          href={storeHref(seller.handle)}
          label={t("soldBy", { name: seller.name })}
          testId="post-link-store"
          className={LINK_CLASS}
          media={
            <StoreLogo
              logoUrl={seller.logoUrl}
              name={seller.name}
              size={24}
              testId="post-link-store-media"
            />
          }
        />
      ) : null}

      {authorUsername && authorName ? (
        <IdentityLink
          href={profileHref(authorUsername)}
          label={t("publishedBy", { name: authorName })}
          testId="post-link-author"
          className={LINK_CLASS}
          media={
            <span aria-hidden="true" data-testid="post-link-author-media">
              <Avatar user={author ?? undefined} size="sm" />
            </span>
          }
        />
      ) : null}
    </nav>
  );
}
