import { useTranslations } from "next-intl";
import { MdStorefront } from "react-icons/md";
import { Link } from "~/i18n/navigation";

/**
 * Lo que ve el autor de una publicación que no cuelga de ninguna tienda.
 *
 * Va **después** de publicar y no dentro del formulario a propósito: mientras lo llena, su objetivo
 * es publicar, y meterle ahí una segunda tarea compite con lo que vino a hacer —lo normal entonces
 * es que no termine ninguna de las dos—. Aquí la tarea ya está hecha y hay un "¿y ahora qué?" al
 * que este es la respuesta.
 *
 * Solo lo ve el dueño: a un visitante no le importa de qué cuelga lo que está leyendo.
 */
export default function OpenStoreHint({
  className = "",
}: {
  className?: string;
}) {
  const t = useTranslations("publish");

  return (
    <aside
      data-testid="open-store-hint"
      className={`rounded-card border border-separator p-4 ${className}`}
    >
      <p className="text-sm text-text-base">{t("openStoreAfterPublish")}</p>

      <Link
        href="/cuenta"
        className="mt-2 inline-flex items-center gap-1 font-semibold text-pw-green underline"
      >
        <MdStorefront aria-hidden />
        {t("openStoreAfterPublishLink")}
      </Link>
    </aside>
  );
}
