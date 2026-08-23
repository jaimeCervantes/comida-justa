"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { MdError } from "react-icons/md";
import { MAX_POST_MEDIA_FILES } from "~/domain/entities/post/mediaPayload";
import { FieldHelper } from "~/presentation/design_system/forms/FieldHelper";
import ImageVideoUploader, {
  type UploadedMediaResult,
} from "~/presentation/media/ImageVideoUploader/ImageVideoUploader";
import PostMediaTray from "~/presentation/media/PostMediaTray/PostMediaTray";

/**
 * Un archivo de la lista mientras se edita el formulario.
 *
 * Cubre las dos procedencias: el recién subido, que trae `path` —su ruta en Cloud Storage—, y el que
 * ya estaba guardado, que viene de `post_media` y no tiene ninguno. Lo que viaja al servidor es lo
 * mismo en ambos casos, porque `parsePostMediaPayload` solo mira `url`, `type`, `alt` y las medidas.
 */
export interface PostMediaFieldItem {
  url: string;
  /** El MIME (`image/jpeg`) recién subido, o ya la categoría (`image`) si viene de la base. */
  type: string;
  /** Solo en los recién subidos; es por donde se deduplica una tanda repetida. */
  path?: string;
  alt?: string;
  width?: number | null;
  height?: number | null;
}

/** Mueve un elemento de sitio conservando el orden relativo de todos los demás. */
function moveItem<T>(items: readonly T[], from: number, to: number): T[] {
  if (from === to || to < 0 || to >= items.length) return [...items];

  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);

  return next;
}

/**
 * Los archivos de una publicación: elegirlos, verlos, quitarlos y ordenarlos.
 *
 * **Es un solo componente para las dos pantallas.** Publicar y editar hacen exactamente lo mismo con
 * la lista, y la única diferencia real es de dónde sale la primera: vacía al publicar, la que ya
 * tiene la publicación al editar. Cuando esto vivía dentro de `PublishForm`, editar habría exigido
 * copiar el acumulado, el recorte al tope, el deduplicado y el campo oculto a un segundo formulario,
 * y a partir de ahí cada arreglo habría tenido que hacerse dos veces —o, más probable, una—.
 *
 * El orden **es** el dato: el índice acaba en `post_media.sort_order`, y el 0 es la portada que leen
 * la tarjeta del listado, el carrito y el bot de WhatsApp con `ORDER BY sort_order LIMIT 1`.
 */
export default function PostMediaField({
  name = "media",
  initialItems = [],
  onLoadingChange,
  onItemsChange,
  error,
  className,
}: {
  /** El campo oculto que lee la Server Action. */
  name?: string;
  /** Lo que la publicación ya tiene. Vacío al publicar. */
  initialItems?: readonly PostMediaFieldItem[];
  /** Para que el formulario pueda decir «subiendo…» en su botón de envío. */
  onLoadingChange?: (isLoading: boolean | null) => void;
  /**
   * La lista, cada vez que cambia, para quien necesite **enseñarla** fuera de este campo.
   *
   * La pide la vista previa del 5.3: pinta la portada de la publicación, y la portada es
   * `items[0]` —el mismo índice 0 que acaba en `post_media.sort_order` y que leen la tarjeta del
   * listado y el bot—. Sin esto habría que espiar el `<input hidden>`, que es de React y por tanto
   * no emite `input` al cambiar: el resto del formulario se lee así, y esta era la única pieza a la
   * que ese camino no llegaba.
   *
   * Es opcional y la lista sigue viviendo aquí: quien escucha mira, no manda.
   */
  onItemsChange?: (items: readonly PostMediaFieldItem[]) => void;
  /** Lo que contestó la Server Action para la lista de archivos. */
  error?: string | null;
  className?: string;
}) {
  const t = useTranslations("publish");
  const [items, setItems] = useState<PostMediaFieldItem[]>([...initialItems]);

  /**
   * Cada tanda **se suma** a lo que ya había.
   *
   * Se deduplica por `path` —la ruta en Cloud Storage, única por archivo— porque el efecto que
   * dispara esto depende de la lista del hook, y sin el filtro un renderizado extra volvería a
   * añadir la misma tanda. Los que vienen de la base no tienen `path`, así que se identifican por su
   * URL: sin esa caída, dos archivos guardados se habrían visto como «el mismo indefinido».
   */
  const onUploaded = useCallback(
    async (data: UploadedMediaResult | null) => {
      onLoadingChange?.(data?.isLoading ?? null);

      const uploaded = data?.media ?? [];
      if (uploaded.length === 0) return;

      setItems((current) => {
        const known = new Set(current.map((item) => item.path ?? item.url));
        const added = uploaded.filter(
          (item) => !known.has(item.path ?? item.url),
        );

        return [...current, ...added].slice(0, MAX_POST_MEDIA_FILES);
      });
    },
    /* `onLoadingChange` entra en la lista aunque quien lo pasa hoy sea estable (un `setState`, o
       nada en la edición). Suprimir la regla habría sido apostar a que siga siéndolo: el día que
       alguien pase una flecha en línea, este callback se recrearía en cada render y el efecto del
       uploader volvería a anunciar la misma tanda. Con la dependencia declarada, eso es visible. */
    [onLoadingChange],
  );

  const remove = useCallback((index: number) => {
    setItems((current) => current.filter((_, position) => position !== index));
  }, []);

  const move = useCallback((from: number, to: number) => {
    setItems((current) => moveItem(current, from, to));
  }, []);

  /* En efecto y no dentro de cada `setItems`: los cambios entran por tres sitios —subir, quitar y
     reordenar— y avisar desde los tres es la forma de que el cuarto se olvide. Aquí se avisa de
     cualquiera, y además del primer valor, que es el que trae la edición. */
  useEffect(() => {
    onItemsChange?.(items);
  }, [items, onItemsChange]);

  const remaining = MAX_POST_MEDIA_FILES - items.length;

  return (
    <div className={className}>
      <ImageVideoUploader
        label={items.length === 0 ? t("media") : t("mediaAddMore")}
        name={""}
        onUploaded={onUploaded}
        className="mb-2"
        accept="image/*,video/*"
        required={false}
        multiple
        remaining={remaining}
        uploadingLabel={(progress) =>
          t("mediaUploading", { progress: Math.round(progress) })
        }
        uploadedLabel={(count) => t("mediaUploaded", { count })}
      />

      <PostMediaTray
        items={items}
        onRemove={remove}
        onMove={move}
        max={MAX_POST_MEDIA_FILES}
        className={error ? undefined : "mb-6"}
      />

      <FieldHelper tone="error" className="mb-6">
        {error ? (
          <>
            <MdError aria-hidden="true" className="size-4" />
            {error}
          </>
        ) : null}
      </FieldHelper>

      {/* El array entero, en orden: su índice acaba en `post_media.sort_order`.
          Sin `required`: el navegador no valida un input oculto, así que ese atributo prometía una
          comprobación que nunca ocurrió. Quien exige al menos un archivo es la Server Action, que
          además puede decir por qué. */}
      <input name={name} hidden readOnly value={JSON.stringify(items)} />
    </div>
  );
}
