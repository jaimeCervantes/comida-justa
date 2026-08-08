import type { PostUser } from "~/infra/types/Posts";
import IdentityLink from "~/presentation/identity/IdentityLink";
import type { StoreIdentity } from "~/presentation/identity/StoreIdentity";
import StoreLogo from "~/presentation/identity/StoreLogo";
import Avatar from "~/presentation/user/Avatar";
import { profileHref } from "../../cuenta/profilePath";
import { storeHref } from "../../cuenta/storePath";

/**
 * De quién es esta publicación, bajo el título.
 *
 * Los enlaces ya existían al final de la ficha (`PostLinks`), pero como texto: quien decide comprar
 * lo hace arriba —mirando foto, precio e insignias— y a esa altura la página no decía de quién era,
 * teniendo la tienda un logo y la persona una foto o sus iniciales.
 *
 * Devuelve un **fragmento**, no una fila: comparte renglón con la categoría y la distancia, y esa
 * línea la arma `PostDetail`. Aquí solo van las dos caras, sin nombre a la vista —repetirlo alarga
 * el renglón sin decir nada que la imagen no diga—, pero con el nombre en el árbol para quien
 * escucha (`hideLabel`). La frase completa es la del final, que es una salida y no una identidad.
 *
 * Se calla entero cuando no hay nada que firmar —5 de las 23 publicaciones de la base no tienen ni
 * tienda ni autor con perfil—, en vez de dejar un separador huérfano en la línea.
 */
export default function PostIdentity({
  seller,
  author,
}: {
  seller?: StoreIdentity | null;
  author?: PostUser | null;
}) {
  // Solo se enlaza a un perfil que exista: publicar no obliga a reclamar una dirección.
  const authorUsername = author?.username;
  const authorName = author?.name ?? authorUsername;

  if (!seller && !authorUsername) return null;

  return (
    <>
      {seller ? (
        <IdentityLink
          href={storeHref(seller.handle)}
          label={seller.name}
          hideLabel
          testId="post-identity-store"
          media={
            <StoreLogo
              logoUrl={seller.logoUrl}
              name={seller.name}
              testId="post-identity-store-media"
            />
          }
        />
      ) : null}

      {authorUsername && authorName ? (
        <IdentityLink
          href={profileHref(authorUsername)}
          label={authorName}
          hideLabel
          testId="post-identity-author"
          media={
            <span aria-hidden="true" data-testid="post-identity-author-media">
              <Avatar user={author ?? undefined} size="sm" />
            </span>
          }
        />
      ) : null}
    </>
  );
}
