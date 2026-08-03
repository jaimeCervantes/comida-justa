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
 */
export default function LocationNotice({
  showSellerCta = true,
  className = "",
}: {
  /** `false` para quien ya abrió su tienda: ese ya no necesita que se lo cuenten. */
  showSellerCta?: boolean;
  className?: string;
}) {
  const t = useTranslations("distance");
  const { state, isBusy, share } = useShareLocation();
  const denied = state === "failed";

  return (
    <aside
      data-testid="location-notice"
      className={`mb-4 rounded-lg border border-gray-200 dark:border-gray-700 p-4 ${className}`}
    >
      <p className="text-sm text-gray-700 dark:text-gray-300">
        {denied ? t("deniedNotice") : t("noticeIdle")}
      </p>

      {denied ? (
        <p
          data-testid="location-incentive"
          className="mt-1 text-sm text-gray-700 dark:text-gray-300"
        >
          {t("incentive")}
        </p>
      ) : null}

      <Button
        type="button"
        onClick={share}
        isLoading={isBusy}
        loadingLabel={t("locating")}
        startIcon={<MdMyLocation aria-hidden />}
        size="sm"
        color="green"
        className="mt-3"
        data-testid="share-location"
      >
        {denied ? t("shareAgain") : t("share")}
      </Button>

      {showSellerCta ? (
        <p
          data-testid="seller-location-cta"
          className="mt-3 text-sm text-gray-600 dark:text-gray-400"
        >
          {t("sellerCta")}{" "}
          <Link
            href="/cuenta"
            className="font-semibold text-pw-green underline"
          >
            {t("sellerCtaLink")}
          </Link>
        </p>
      ) : null}
    </aside>
  );
}
