import { useTranslations } from "next-intl";
import { MdOpenInNew } from "react-icons/md";
import { type AppHref, Link } from "~/i18n/navigation";
import ShareMenu from "~/presentation/sharing/ShareMenu/ShareMenu";

/**
 * Una dirección pública propia: el enlace para ir a verla y el botón para repartirla.
 *
 * Es el mismo par en la tarjeta de la tienda y en la de la dirección personal, así que vive una
 * sola vez. Tres decisiones que no se ven a simple vista:
 *
 * **Se enseña el camino, no la dirección absoluta.** `https://hazlosano.com/tienda/hazlo-sano`
 * partía el renglón y empujaba al botón de compartir fuera de la tarjeta. Lo que se comparte sigue
 * siendo la absoluta (`shareUrl`): lo que se acorta es lo que se lee, no lo que se copia.
 *
 * **Se abre en una pestaña nueva.** Quien pulsa aquí está comprobando cómo se ve su página antes de
 * repartirla, no navegando: perder la cuenta a medio configurar es justo lo que no quiere.
 *
 * **El aviso de pestaña nueva va en `title` y no como texto oculto.** Un `<span class="sr-only">`
 * dentro del enlace pasa a formar parte de su **nombre accesible**, y el nombre de este enlace es
 * su dirección: los escenarios lo localizan por ella (`/tienda/<handle>$`). El icono es la señal
 * visible y el `title` la escrita; ninguno de los dos toca el nombre.
 */
export default function PublicAddressRow({
  href,
  path,
  shareUrl,
  shareTitle,
  shareText,
  shareTestId,
}: {
  /** El destino tipado, para que `Link` lo traduzca al idioma activo. */
  href: AppHref;
  /** El camino tal como se lee: `/tienda/hazlo-sano`. */
  path: string;
  /** La dirección **absoluta**, que es la que se reparte. */
  shareUrl: string;
  shareTitle: string;
  shareText: string;
  shareTestId: string;
}) {
  const t = useTranslations("account");

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
      <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        title={t("opensInNewTab")}
        className="inline-flex min-w-0 items-center gap-1.5 font-bold text-pw-orange hover:underline"
      >
        <span className="truncate">{path}</span>
        <MdOpenInNew size="16" aria-hidden className="shrink-0" />
      </Link>

      <ShareMenu
        testId={shareTestId}
        url={shareUrl}
        title={shareTitle}
        text={shareText}
      />
    </div>
  );
}
