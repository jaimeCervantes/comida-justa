import { useTranslations } from "next-intl";
import { Link } from "~/i18n/navigation";
import { PILLARS_OVERVIEW_HREF } from "~/i18n/routes";

/**
 * La puerta que le faltaba al jardín.
 *
 * El jardín de arriba cuenta las repeticiones que la comunidad compartió, pero contar no invita: se
 * leía el número colectivo sin saber por dónde se entra a sumarle el propio. Esta banda va justo
 * después, mientras ese dato todavía está a la vista, y antes de que el feed cambie de tema.
 *
 * **Es un enlace y no un `Button`.** Navega, así que con un `<button>` se perderían el clic derecho,
 * el «abrir en pestaña nueva» y el anuncio del destino en un lector de pantalla; además `Button` es
 * `"use client"` y esto no necesita cliente. El `Link` es el de `~/i18n/navigation`: el de
 * `next/link` se llevaría a quien lee en inglés a la ruta española.
 *
 * No recibe nada del jardín a propósito: un jardín en cero es justo cuando más falta hace que la
 * invitación siga en pie.
 */
export default function CommunityPracticeInvitation(): React.ReactNode {
  const t = useTranslations("habitCommunity");

  return (
    <section
      data-testid="community-practice-invitation"
      className="@container overflow-hidden rounded-2xl border border-pw-green/30 bg-pw-green/5 p-4"
    >
      {/* Las dos columnas las decide el ancho de la propia banda, no el de la ventana: en móvil el
          enlace cae debajo del texto y ocupa toda la línea, que es donde se pulsa con el pulgar. */}
      <div className="grid gap-5 @3xl:grid-cols-[minmax(0,1fr)_auto] @3xl:items-center @3xl:gap-10">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-pw-green">
            {t("invitation.eyebrow")}
          </p>
          <h2 className="mt-1 text-xl font-black text-text-strong">
            {t("invitation.title")}
          </h2>
          <p className="mt-2 max-w-3xl text-body">{t("invitation.body")}</p>
        </div>
        <Link
          href={PILLARS_OVERVIEW_HREF}
          className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg bg-pw-green px-4 py-2 font-semibold text-white transition-colors hover:bg-pw-green/80"
        >
          {t("invitation.cta")}
          {/* Fuera del nombre accesible: la flecha dice «esto lleva a otro sitio» a quien mira, y
              deletreada no aporta nada a quien escucha. */}
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  );
}
