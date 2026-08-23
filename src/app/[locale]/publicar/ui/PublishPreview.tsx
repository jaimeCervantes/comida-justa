"use client";

import { useTranslations } from "next-intl";
import { mediaTypeFromMime } from "~/domain/entities/post/mediaPayload";
import {
  publicationPillarForCategory,
  publicationPillarNumber,
} from "~/domain/entities/post/publicationPillars";
import type { CategoryOption } from "~/domain/entities/post/taxonomy";
import { Badge } from "~/presentation/design_system/badges/Badge";
import { Surface } from "~/presentation/design_system/surfaces/Surface";
import ImageWithSkeleton from "~/presentation/media/ImageWithSkeleton/ImageWithSkeleton";
import type { PostMediaFieldItem } from "~/presentation/media/PostMediaField/PostMediaField";
import { type PublishDraft, publishShowsPrice } from "../publishChecklist";

/**
 * «Así se verá»: la publicación, tal como quedará en el listado, mientras se escribe.
 *
 * Es la pieza del 5.3 que responde a la pregunta que nadie hace en voz alta —«¿esto se va a ver
 * bien?»— y que hoy solo se puede contestar publicando y mirando. Enseñar la tarjeta antes de
 * enviar es lo que convierte el título en una decisión: «Miel» y «Miel cruda de azahar · 500 g»
 * ocupan lo mismo en el campo y no se parecen en nada aquí.
 *
 * Se apoya en las mismas piezas que la tarjeta de verdad —`Surface`, `Badge` con su número de
 * pilar, `ImageWithSkeleton`— y no en una copia con clases a mano: una vista previa que no envejece
 * con la tarjeta es una promesa que se rompe sola en el siguiente rediseño.
 *
 * **No se anuncia a los lectores de pantalla.** Es un eco de lo que la persona acaba de escribir en
 * campos que ya tienen su etiqueta; leerlo otra vez a cada tecla convertiría el formulario en un
 * balbuceo. `aria-hidden` aquí es lo mismo que en el número del pilar: la redundancia es visual,
 * para una limitación visual.
 */
export default function PublishPreview({
  draft,
  cover,
  categoryOptions,
}: {
  draft: PublishDraft;
  /** La portada: `items[0]`, el mismo índice que acaba en `post_media.sort_order`. */
  cover: PostMediaFieldItem | null;
  /** Para poner el nombre del pilar en el idioma de la ruta, sin volver a pedirlo al servidor. */
  categoryOptions: readonly CategoryOption[];
}): React.ReactNode {
  const t = useTranslations("publish");
  const pillar = publicationPillarForCategory(draft.category);
  const categoryLabel = categoryOptions.find(
    (option) => option.value === draft.category,
  )?.label;
  const price = publishShowsPrice(draft.kind) ? draft.price.trim() : "";
  const isVideo = cover ? mediaTypeFromMime(cover.type) === "video" : false;

  return (
    <div>
      <p className="mb-2 text-caption font-semibold uppercase tracking-[0.14em] text-text-muted">
        {t("previewLabel")}
      </p>

      <Surface
        radius="card"
        background="raised"
        border="subtle"
        elevation="sm"
        className="overflow-hidden"
        data-testid="publish-preview"
        aria-hidden="true"
      >
        {/* El hueco de la portada existe desde el principio, con foto o sin ella: es lo que dice
            que la publicación **lleva** foto, y por tanto que falta la suya. El alto es fijo para
            que la tarjeta no dé un salto el día que llega la imagen. */}
        <div className="relative grid h-40 place-items-center bg-surface-elevation-2">
          {cover && !isVideo ? (
            <ImageWithSkeleton
              src={cover.url}
              alt=""
              width={480}
              height={280}
              sizes="320px"
              frameClassName="size-full"
              className="size-full object-cover"
            />
          ) : (
            <span className="text-label text-text-muted">
              {cover ? t("previewVideo") : t("previewNoPhoto")}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-2 p-4">
          {/* El pilar va arriba, como en la tarjeta del 5.2: es lo primero que ordena lo que se
              está mirando. Sin categoría no se inventa ninguno — igual que en el listado. */}
          {pillar && categoryLabel ? (
            <Badge tone={pillar} counter={publicationPillarNumber(pillar)}>
              {categoryLabel}
            </Badge>
          ) : null}

          <p className="text-body font-semibold text-text-base">
            {draft.title.trim() || t("previewNoTitle")}
          </p>

          {price ? (
            <p className="text-body font-semibold text-text-base">
              {t("previewPrice", { amount: price })}
            </p>
          ) : null}
        </div>
      </Surface>
    </div>
  );
}
