import type { ReactNode } from "react";
import type { PostUser } from "~/infra/types/Posts";
import { Surface } from "~/presentation/design_system/surfaces/Surface";
import IdentityLink from "~/presentation/identity/IdentityLink";
import type { StoreIdentity } from "~/presentation/identity/StoreIdentity";
import StoreLogo from "~/presentation/identity/StoreLogo";
import Avatar from "~/presentation/user/Avatar";
import { profileHref } from "../../cuenta/profilePath";
import { storeHref } from "../../cuenta/storePath";

/**
 * De quién es esto, con nombre y a qué distancia — junto al precio, no al final de la página.
 *
 * Es la lección que el 5.4 del canvas deja escrita: «la persona es parte del producto». Quien
 * decide comprar lo hace arriba, mirando foto, precio y quién lo vende; y hasta ahora, a esa altura,
 * la página solo enseñaba un logo de 28px sin nombre, metido en la misma fila que la categoría y la
 * insignia de agotado. El nombre entero quedaba al final, después del texto.
 *
 * **La distancia se muda aquí desde la fila de datos.** Es la misma cifra, pero al lado de quién la
 * recorre significa otra cosa: «Hazlo Sano, a 3 km» es una frase; «Alimentación · agotado · a 3 km»
 * es una lista.
 *
 * **Lo que el canvas pinta y aquí no está**, y por qué:
 *
 * - El **tiempo de respuesta** («responde en ~2 h»): no existe en la base. Necesitaría medir
 *   conversaciones que hoy ocurren fuera del sitio, en WhatsApp.
 * - La **descripción de la tienda**: existe (`sellers.description`), y aun así no entra. Con los
 *   datos de verdad la de «Hazlo Sano» son 257 caracteres de lista numerada —«1. Sueño:… 2.
 *   Alimentación:…»—, que recortada a una línea no dice nada. La columna es una biografía, no un
 *   lema, y meterla aquí sería copiar la maqueta a costa de la página.
 *
 * Se queda callado del todo cuando no hay ni tienda ni autor con perfil: 5 de las 31 publicaciones
 * de la base están en ese caso, y una tarjeta vacía es peor que ninguna.
 *
 * **La distancia entra como `ReactNode`, no como metros.** Quien la pinta —`StoreDistance` o el
 * botón de compartir ubicación— arrastra `next-auth` por su cadena de importaciones, y con eso
 * dentro esta tarjeta dejaba de poder probarse sin montar media aplicación. Es el mismo trato que
 * `bookingSlot` en `PostDetail`: quien sabe resolver el dato lo resuelve y aquí solo se coloca.
 *
 * **No traduce nada, y por eso es síncrono.** Todo lo que enseña son nombres propios que vienen del
 * dato. Ser `async` para pedir un catálogo que no usa la habría dejado fuera del alcance de una
 * prueba de componente, que es donde viven las combinaciones de «quién firma».
 */
export default function PostSeller({
  seller,
  author,
  location = null,
  className,
}: {
  seller?: StoreIdentity | null;
  author?: PostUser | null;
  /**
   * A qué distancia queda, ya resuelto: la cifra, la invitación a compartir ubicación, o nada.
   * Lo decide `PostDetail`, que es quien sabe si esto se vende y si hay metros que enseñar.
   */
  location?: ReactNode;
  className?: string;
}) {
  const authorUsername = author?.username;
  const authorName = author?.name ?? authorUsername;
  const hasAuthor = Boolean(authorUsername && authorName);

  if (!seller && !hasAuthor) return null;

  return (
    <Surface
      as="section"
      radius="card"
      border="subtle"
      background="raised"
      className={className}
      data-testid="post-identity"
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 p-3">
        {seller ? (
          <IdentityLink
            href={storeHref(seller.handle)}
            label={seller.name}
            testId="post-identity-store"
            className="font-semibold text-text-base"
            media={
              <StoreLogo
                logoUrl={seller.logoUrl}
                name={seller.name}
                size={44}
                testId="post-identity-store-media"
              />
            }
          />
        ) : null}

        {/* La persona va después de la tienda y con su nombre a la vista: publica alguien, no una
            marca. Cuando no hay tienda —una publicación de la comunidad— es lo único que firma. */}
        {authorUsername && authorName ? (
          <IdentityLink
            href={profileHref(authorUsername)}
            label={authorName}
            testId="post-identity-author"
            className="text-label text-text-support"
            media={
              <span aria-hidden="true" data-testid="post-identity-author-media">
                <Avatar user={author ?? undefined} size="sm" />
              </span>
            }
          />
        ) : null}

        {/* A la derecha del todo: es el dato que decide si se puede ir por ello hoy. `empty:hidden`
            para que un anuncio —que no pinta nada aquí— no deje un hueco empujando la fila. */}
        <span className="ml-auto empty:hidden">{location}</span>
      </div>
    </Surface>
  );
}
