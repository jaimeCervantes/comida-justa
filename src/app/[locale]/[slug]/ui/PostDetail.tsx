import { getTranslations } from "next-intl/server";
import { MdPhone } from "react-icons/md";
import { canBeOrdered, isSellable } from "~/domain/entities/post/availability";
import { resolvePostTranslation } from "~/domain/entities/post/translations";
import type { PostMediaFile } from "~/domain/entities/post/types";
import { buildWhatsappOrderLink } from "~/domain/entities/post/whatsappOrder";
import { routing } from "~/i18n/routing";
import { PUBLIC_BASE_URL, SITE_CURRENCY } from "~/infra/constants";
import type { Post, PostUser } from "~/infra/types/Posts";
import AddToCartButton from "~/presentation/cart/AddToCartButton/AddToCartButton";
import { cn } from "~/presentation/design_system/styling/merge-class-names";
import { CARD_ROW } from "~/presentation/design_system/surfaces/cardSpacing";
import { Heading } from "~/presentation/design_system/typography/Heading";
import ShareLocationButton from "~/presentation/location/ShareLocationButton";
import StoreDistance from "~/presentation/location/StoreDistance";
import MediaGallery from "~/presentation/media/MediaGallery/MediaGallery";
import CurrencyAmount from "~/presentation/money/CurrencyAmount";
import { setAvailability } from "~/presentation/post/availabilityAction";
import CategoryTag from "~/presentation/post/CategoryTag/CategoryTag";
import OpenStoreHint from "~/presentation/post/OpenStoreHint";
import ProvenanceBadge, {
  showsProvenanceBadge,
} from "~/presentation/post/ProvenanceBadge";
import SoldOutBadge from "~/presentation/post/SoldOutBadge/SoldOutBadge";
import WhatsappButton from "~/presentation/post/WhatsappButton/WhatsappButton";
import ShareMenu from "~/presentation/sharing/ShareMenu/ShareMenu";
import { postCategoryLabel } from "../categoryLabel";
import OwnerControls from "./OwnerControls";
import PostIdentity from "./PostIdentity";
import PostLinks from "./PostLinks";

/**
 * Presenta una publicación ya cargada. La búsqueda (y el 404 si no existe) vive en la página,
 * fuera de cualquier `<Suspense>`, para que el status HTTP sea el correcto.
 *
 * **Los comentarios ya no viven aquí.** Los compone la página, porque su sitio depende del ancho:
 * en móvil van después del mapa de la tienda y en escritorio quedan debajo de las dos columnas.
 * Un componente que se pinta dentro de este no puede colocarse fuera de él.
 */
export default async function PostDetail({
  post: postDetails,
  className,
  user,
  locale,
  slug,
  distanceMeters = null,
}: {
  post: Post;
  className: string;
  user: PostUser | undefined;
  /**
   * A cuántos metros está la tienda de quien mira, o `null` cuando no lo sabemos —porque la tienda
   * no dio ubicación, o porque quien mira no la compartió—. La resuelve la página: este componente
   * no consulta nada.
   */
  distanceMeters?: number | null;
  /** Idioma de la ruta; decide en qué idioma se lee la etiqueta de categoría. */
  locale?: string;
  /** El de la ruta: es lo que se manda en el mensaje de WhatsApp para identificar el producto. */
  slug?: string;
}) {
  const t = await getTranslations("post");
  const tShare = await getTranslations("share");
  const translation = resolvePostTranslation(
    postDetails.translations,
    locale ?? routing.defaultLocale,
    routing.defaultLocale,
  );
  /* Lo que no depende del idioma se toma tal cual. Antes esto se copiaba campo a campo a un objeto
     `details` que se destruía en la línea siguiente: doce nombres escritos tres veces cada uno para
     acabar en las mismas doce constantes. */
  const {
    price,
    kind,
    origin,
    category,
    subCategory,
    contactInfo,
    id,
    seller,
  } = postDetails;

  const title = translation?.title ?? postDetails.title;
  const content = translation?.content ?? postDetails.content;
  /** `null` en la base significa disponible: solo un `false` explícito lo agota. */
  const isAvailable = postDetails.isAvailable !== false;

  /**
   * El texto alternativo sale de la traducción, no de la columna.
   *
   * `post_media.alt` no tiene idioma —hay una fila por archivo, no por traducción— y al publicar se
   * rellena con el título español (`publicar/actions.ts:186`), descartando cualquier cosa que
   * hubiera escrito quien publica. O sea que siempre **fue** el título. Derivarlo aquí es
   * equivalente y además lo traduce, sin migración: quien lee con lector de pantalla en inglés deja
   * de oír el título en español.
   */
  /* La anotación es necesaria: el `Post` de `infra/types/Posts.d.ts` acaba en una firma de índice
     `{ [k: string]: unknown }`, así que `postDetails.media` llega sin forma y recorrerla dejaría los
     parámetros en `any` implícito. Es deuda anterior a esta entrega —el tipo bueno es el de
     `~/domain/entities/post/types`— y aquí solo se le pone nombre a lo que ya viaja. */
  const files = (postDetails.media ?? []) as PostMediaFile[];

  const media = files.map((file, index) => ({
    ...file,
    /* El primero se anuncia con el título a secas, que es lo que era cuando solo había uno. Del
       segundo en adelante lleva su posición: cuatro imágenes con el mismo texto alternativo hacen
       que un lector de pantalla repita la misma frase cuatro veces sin distinguir nada. */
    alt:
      index === 0
        ? (title ?? file.alt ?? "")
        : t("mediaAltNumbered", {
            title: title ?? "",
            position: index + 1,
            count: files.length,
          }),
  }));

  /* La dirección pública de la ficha. La usan el pedido por WhatsApp y el botón de compartir: si
     se calcularan por separado, un cambio de ruta dejaría a uno de los dos apuntando al vacío. */
  const postUrl = `${PUBLIC_BASE_URL}/${slug ?? ""}`;

  // Solo se ofrece pedir lo que se vende y sigue habiendo: mandar a WhatsApp por algo agotado
  // empieza la conversación con una decepción.
  const orderLink = canBeOrdered({ kind, isAvailable })
    ? buildWhatsappOrderLink({
        title: String(title ?? ""),
        price,
        url: postUrl,
        whatsapp: contactInfo?.whatsapp,
        phone: contactInfo?.phone,
      })
    : null;

  const isOwner = Boolean(user?.id) && user?.id === postDetails.user?.id;

  const categoryLabel = await postCategoryLabel(category, subCategory, locale);

  /* El `data-testid` de la raíz permite que una prueba distinga la ficha de las tarjetas
     relacionadas, que pintan exactamente las mismas insignias. */
  return (
    <article className={className} data-testid="post-detail">
      {/* El título de la página. Iba como `text-3xl` a secas —sin peso—, así que cualquier `h2` en
          negrita del mismo tamaño lo tapaba. `level={1}` le da el tamaño mayor de la escala. */}
      <Heading level={1} className="mb-4">
        {title}
      </Heading>

      {/* `priority` porque es la imagen por la que se entra a esta página: está arriba del todo y es
          la que el navegador mide como "contenido más grande". Es el único sitio de la aplicación
          que la lleva; en los listados sería pedirlo todo a la vez. */}
      <MediaGallery items={media} className="mb-4" priority />

      {/* Todo lo que se mira para decidir, en un solo bloque bajo la imagen: de quién es, qué es, a
          qué distancia queda, cuánto cuesta y a qué número se llama.

          Salieron dos clases que no hacían nada. `gap-1` es la abreviatura de las dos que venían
          detrás (`gap-x-3 gap-y-2`), así que quedaba anulada. Y `justify-baseline` sí existe en
          Tailwind, pero emite `justify-content: baseline`, un valor que esa propiedad **no**
          acepta —baseline es de `align-*`—, así que el navegador descarta la declaración. Juntas
          hacían parecer que la separación y la alineación estaban decididas en tres sitios.

          Ahora sale de `CARD_ROW`, el mismo que la tarjeta: la ficha y la tarjeta enseñan los
          mismos datos y no hay motivo para que se separen distinto.

          Su `empty:hidden` sirve de verdad en la fila de dentro, que es la que se vacía en un
          anuncio (sin precio, sin categoría, sin origen y, al no ser vendible, sin distancia). En
          la de fuera es solo herencia del estándar: mientras haya teléfono —hoy lo traen las 24
          publicaciones— siempre tendrá un hijo, así que ahí no llega a dispararse. */}
      <section className={cn(CARD_ROW, "mb-4")}>
        <p className={cn(CARD_ROW, "text-label")} data-testid="post-identity">
          <PostIdentity seller={seller} author={postDetails.user} />

          {/* Se calla cuando el logo de al lado ya lo dijo: ver `provenanceVisibility.ts`. */}
          {showsProvenanceBadge(origin, Boolean(seller)) ? (
            <ProvenanceBadge origin={origin} />
          ) : null}
          <CategoryTag label={categoryLabel} />
          <SoldOutBadge kind={kind} isAvailable={isAvailable} />
          {/* Solo cuando las dos partes dieron ubicación: si falta una, no se pinta nada y quien
            mira puede compartir la suya desde aquí mismo. */}
          {distanceMeters === null ? (
            isSellable({ kind }) ? (
              <ShareLocationButton size="xs" />
            ) : null
          ) : (
            <StoreDistance meters={distanceMeters} />
          )}
        </p>
        {/* Sin envoltura propia: `CurrencyAmount` ya es un `span` y se calla solo cuando no hay
            precio —un anuncio no lo tiene—. Dentro de un `<p>` dejaba un párrafo vacío que en esta
            fila con `gap-x-3` se veía como un hueco sin motivo. */}
        <CurrencyAmount value={price} currency={SITE_CURRENCY} />

        {/* Hoy las 24 publicaciones traen teléfono, pero nada en el esquema lo garantiza: sin la
            guarda, una sin él pintaba el icono junto a un enlace `tel:undefined` y vacío. */}
        {contactInfo?.phone ? (
          <p className="flex items-center">
            <MdPhone className="mr-2" size="24" aria-hidden />
            <a
              href={`tel:${contactInfo.phone}`}
              className="font-bold text-pw-orange"
            >
              {contactInfo.phone}
            </a>
          </p>
        ) : null}
      </section>

      {/* Compartir va junto a pedir: son las dos salidas de la ficha. Una lleva al vendedor y la
          otra a quien todavía no conoce esto — y para un anuncio, que no se pide, es la única. */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {/* Pedir uno y juntar varios conviven a propósito: quien quiere una sola cosa no debería
            tener que pasar por el carrito, y quien quiere tres no debería abrir tres
            conversaciones. La regla de cuándo se pinta cada uno es la misma (`canBeOrdered`). */}
        <AddToCartButton
          postId={String(id ?? "")}
          kind={kind}
          isAvailable={postDetails.isAvailable}
        />

        <WhatsappButton href={orderLink} testId="whatsapp-order">
          {t("orderOnWhatsapp")}
        </WhatsappButton>

        <ShareMenu
          testId="share-post"
          url={postUrl}
          title={String(title ?? "")}
          text={tShare("postText", { title: String(title ?? "") })}
        />
      </div>

      {isOwner ? (
        <>
          <OwnerControls
            action={setAvailability}
            postId={String(id ?? "")}
            slug={slug ?? ""}
            isAvailable={isAvailable}
            isSellable={isSellable({ kind })}
          />
          {/* Publicó sin tienda: es el momento en que el consejo sirve, con la tarea ya hecha. */}
          {seller ? null : <OpenStoreHint className="mt-4" />}
        </>
      ) : null}
      <section className="whitespace-pre-wrap mt-4">{content}</section>

      <PostLinks
        categoryKey={subCategory ?? category}
        categoryLabel={categoryLabel}
        seller={seller}
        author={postDetails.user}
      />
    </article>
  );
}
