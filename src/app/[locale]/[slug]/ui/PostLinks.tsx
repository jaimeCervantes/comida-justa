import { getTranslations } from "next-intl/server";
import { type AppHref, Link } from "~/i18n/navigation";
import { profileHref } from "../../cuenta/profilePath";
import { storeHref } from "../../cuenta/storePath";

const LINK_CLASS = "text-pw-lightgreen hover:underline";

interface PostLink {
  key: string;
  href: AppHref;
  label: string;
}

/**
 * Las tres salidas de una publicación: su categoría, su tienda y quien la publicó.
 *
 * Hasta ahora el detalle era un callejón sin salida —quien llegaba desde un buscador solo podía
 * volver atrás—, y para un rastreador era una hoja sin enlaces hacia el resto del catálogo. Cada
 * enlace se pinta **solo si existe su destino**: hay publicaciones sin categoría, sin tienda y de
 * autores que no han reclamado su dirección.
 */
export default async function PostLinks({
  categoryKey,
  categoryLabel,
  seller,
  authorName,
  authorUsername,
}: {
  categoryKey?: string | null;
  categoryLabel?: string | null;
  seller?: { handle: string; name: string } | null;
  authorName?: string | null;
  authorUsername?: string | null;
}) {
  const t = await getTranslations("post");

  const links: PostLink[] = [];

  if (categoryKey && categoryLabel) {
    links.push({
      key: "category",
      href: { pathname: "/categoria/[key]", params: { key: categoryKey } },
      label: t("seeCategory", { category: categoryLabel }),
    });
  }

  if (seller) {
    links.push({
      key: "store",
      href: storeHref(seller.handle),
      label: t("soldBy", { name: seller.name }),
    });
  }

  if (authorUsername) {
    links.push({
      key: "author",
      href: profileHref(authorUsername),
      label: t("publishedBy", { name: authorName ?? authorUsername }),
    });
  }

  if (links.length === 0) return null;

  return (
    <nav className="mt-6 flex flex-wrap gap-x-4 gap-y-1 text-sm">
      {links.map((link) => (
        <Link
          key={link.key}
          href={link.href}
          className={LINK_CLASS}
          data-testid={`post-link-${link.key}`}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
