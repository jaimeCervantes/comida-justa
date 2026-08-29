"use client";
import { useTranslations } from "next-intl";
import { MdMyLocation } from "react-icons/md";
import { Link } from "~/i18n/navigation";
import { Button } from "~/presentation/design_system/buttons/Button";
import { useShareLocation } from "./useShareLocation";

/**
 * Por qué esta sección no está diciendo distancias, y qué hacer al respecto.
 *
 * Se pinta **solo cuando no sabemos dónde está quien mira**; en cuanto lo sabemos desaparece, y lo
 * que queda son las distancias, que es la información de verdad.
 *
 * Dice tres cosas, y cada una a quien le toca:
 *
 * 1. **Que no se compartió la ubicación** y que por eso no hay cercanía. Sin esto, un catálogo sin
 *    distancias parece un catálogo roto, y quien lo mira no tiene forma de saber que la que falta
 *    es su parte.
 * 2. **Un incentivo al negarse**, no un reproche. Quien dijo que no ya contestó: lo que se le
 *    ofrece es la razón para cambiar de opinión —saber qué está a dos cuadras y qué a dos horas— y
 *    la puerta abierta para hacerlo cuando quiera.
 * 3. **Que vender aquí exige tienda con ubicación.** Es la otra mitad de la cercanía: sin
 *    vendedores situados no hay distancias que mostrarle a nadie, por muy bien localizado que esté
 *    quien busca. Se le calla a quien ya tiene tienda, que no necesita el consejo.
 *
 * Se dibujaba como una caja con borde y relleno propios porque lo montaban seis páginas sueltas.
 * Ahora su único montaje es `NearbyBar`, que ya pone la superficie: aquí queda **una fila que se
 * parte cuando no cabe**, para no plantar un recuadro en el chrome de todas las rutas.
 *
 * **Los tres párrafos se volvieron el nombre del bloque.** Eran dos o tres renglones en escritorio
 * y hasta cinco en un teléfono, en el chrome de todas las rutas — la mayor parte de lo que impedía
 * que la barra fuera una fila. Las tres frases (por qué no hay distancias, el incentivo a quien se
 * negó) viven ahora en el `aria-label` y el `title` del bloque: un lector de pantalla las anuncia
 * enteras al entrar en la región, y en pantalla no gastan un solo renglón. Lo que queda dibujado es
 * lo que se pulsa — el botón y la invitación a abrir tienda—, que es justo lo que un párrafo
 * escondía.
 */
export default function LocationNotice({
  showSellerCta = true,
}: {
  /** `false` para quien ya abrió su tienda: ese ya no necesita que se lo cuenten. */
  showSellerCta?: boolean;
}) {
  const t = useTranslations("distance");
  const { state, isBusy, share } = useShareLocation();
  const denied = state === "failed";
  /* El incentivo solo entra para quien ya dijo que no: es una razón para cambiar de opinión, no un
     regaño que se le repita a quien todavía no ha contestado. */
  const label = denied
    ? `${t("deniedNotice")} ${t("incentive")}`
    : t("noticeIdle");

  return (
    <aside
      data-testid="location-notice"
      aria-label={label}
      title={label}
      className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 text-sm text-text-support"
    >
      <Button
        type="button"
        onClick={share}
        isLoading={isBusy}
        loadingLabel={t("locating")}
        startIcon={<MdMyLocation aria-hidden />}
        size="xs"
        color="green"
        data-testid="share-location"
      >
        {denied ? t("shareAgain") : t("share")}
      </Button>

      {showSellerCta ? (
        <p data-testid="seller-location-cta" className="whitespace-nowrap">
          {t("sellerCta")}{" "}
          {/* `text-highlight` y no `text-pw-green`: es el token que el slice 12 dejó para las
              tintas y los enlaces, y resuelve al vivo en oscuro. */}
          <Link
            href="/cuenta"
            className="font-semibold text-highlight underline"
          >
            {t("sellerCtaLink")}
          </Link>
        </p>
      ) : null}
    </aside>
  );
}
