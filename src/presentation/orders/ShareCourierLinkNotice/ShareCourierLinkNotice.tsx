"use client";
import { useTranslations } from "next-intl";
import { FaWhatsapp } from "react-icons/fa";
import { Surface } from "~/presentation/design_system/surfaces/Surface";

/**
 * El enlace del repartidor, listo para mandarse.
 *
 * **Sin número de destino.** A diferencia de `NotifySellerButton`, aquí no hay a quién escribirle
 * todavía —el repartidor no tiene cuenta ni teléfono conocido por el sitio—, así que el botón abre
 * `wa.me` sin número: WhatsApp deja elegir el contacto en el propio selector, en vez de fingir que
 * hay uno.
 *
 * El enlace también se enseña como texto, para quien prefiera copiarlo y pegarlo donde ya tiene
 * abierta la conversación con su repartidor.
 */
export default function ShareCourierLinkNotice({
  url,
  className = "",
}: {
  url: string;
  className?: string;
}) {
  const t = useTranslations("orders");
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(
    t("courierLinkMessage", { url }),
  )}`;

  return (
    <Surface
      radius="chip"
      background="raised"
      border="subtle"
      className={`p-3 ${className}`}
      data-testid="courier-link-notice"
    >
      <p className="mb-2 font-medium text-text-base">
        {t("courierLinkHeading")}
      </p>
      <p className="mb-2 text-label text-text-support">
        {t("courierLinkHint")}
      </p>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        data-testid="courier-link-url"
        className="mb-3 block break-all text-label font-medium text-pw-green underline"
      >
        {url}
      </a>
      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        data-testid="courier-link-whatsapp"
        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-control bg-pw-green px-2 py-2 text-label text-white transition-colors hover:bg-pw-green/80"
      >
        <FaWhatsapp size="20" aria-hidden />
        {t("courierLinkWhatsapp")}
      </a>
    </Surface>
  );
}
