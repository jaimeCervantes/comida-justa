export interface ShareMediaItem {
  type?: string | null;
  url?: string | null;
  alt?: string | null;
}

export interface SharePreview {
  /** Lo que va en `og:image`. Siempre hay una: si la publicación no aporta ninguna, es la de respaldo. */
  imageUrl: string;
  imageAlt?: string;
  /** Solo cuando la publicación es un video. Va en `og:video`, jamás en `og:image`. */
  videoUrl?: string;
  /** `false` cuando la imagen es la de respaldo; decide si la tarjeta de Twitter puede ser grande. */
  hasOwnImage: boolean;
}

const IMAGE = "image";
const VIDEO = "video";

/**
 * Qué imagen y qué video se anuncian al compartir una publicación.
 *
 * Antes se mandaba `media[0].url` sin mirar el tipo, y **8 de las 24 publicaciones son video**:
 * su `og:image` era un `.mp4`, así que WhatsApp mostraba un hueco gris justo en los contenidos
 * más compartibles. Un video no es una imagen aunque las dos sean "media".
 *
 * La imagen de respaldo entra solo cuando la publicación no tiene ninguna propia; entonces la
 * tarjeta se degrada a la pequeña, porque un logo estirado a ancho completo se ve peor que un
 * logo pequeño.
 */
export function buildSharePreview(
  media: readonly ShareMediaItem[] | undefined,
  fallbackImageUrl: string,
): SharePreview {
  const withUrl = (media ?? []).filter(
    (item): item is ShareMediaItem & { url: string } => Boolean(item?.url),
  );
  const image = withUrl.find((item) => item.type === IMAGE);
  const video = withUrl.find((item) => item.type === VIDEO);

  return {
    imageUrl: image?.url ?? fallbackImageUrl,
    imageAlt: image?.alt ?? undefined,
    videoUrl: video?.url,
    hasOwnImage: Boolean(image),
  };
}
