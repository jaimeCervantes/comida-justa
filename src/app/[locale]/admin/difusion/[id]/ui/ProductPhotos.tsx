import { getTranslations } from "next-intl/server";
import type { OutreachPhoto } from "~/domain/outreach/listingArticles";
import Thumbnail from "~/presentation/media/Thumbnail/Thumbnail";

interface ProductPhotosProps {
  /** De quién son: nombra el enlace, porque la miniatura es decorativa. */
  title: string;
  photos: readonly OutreachPhoto[];
}

/**
 * Las fotos de un producto, a la mano para subirlas a Facebook.
 *
 * Cada miniatura abre la foto original en otra pestaña, donde se guarda como cualquier imagen. No
 * se ofrece «descargar»: el atributo `download` no funciona con archivos de otro dominio, y las
 * fotos viven en el almacenamiento, no en el sitio.
 */
export default async function ProductPhotos({
  title,
  photos,
}: ProductPhotosProps) {
  if (photos.length === 0) return null;

  const t = await getTranslations("outreach");

  return (
    <ul data-testid="outreach-photos" className="flex flex-wrap gap-2">
      {photos.map((photo) => (
        <li key={photo.url}>
          <a
            href={photo.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("openPhoto", { title })}
            className="block rounded-chip focus-ring"
          >
            <Thumbnail url={photo.url} size={96} testId="outreach-photo" />
          </a>
        </li>
      ))}
    </ul>
  );
}
