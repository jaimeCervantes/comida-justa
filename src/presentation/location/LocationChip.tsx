"use client";
import { useLocale, useTranslations } from "next-intl";
import { MdMyLocation } from "react-icons/md";
import {
  type AgeUnit,
  describeAge,
  type VisitorFix,
} from "~/domain/entities/seller/locationFreshness";
import { Button } from "~/presentation/design_system/buttons/Button";
import { useShareLocation } from "./useShareLocation";

/**
 * Desde dónde se están midiendo las distancias, y cómo cambiarlo.
 *
 * Es la mitad que faltaba de `LocationNotice`. Ese explica el caso "no sabemos dónde estás"; en
 * cuanto lo sabíamos **desaparecía y no quedaba nada en su lugar**, así que quien había compartido
 * su ubicación una vez no tenía forma de corregirla: la cookie duraba un año y había que borrarla a
 * mano desde las herramientas del navegador.
 *
 * Dice dos cosas:
 *
 * 1. **Que las distancias se miden desde su ubicación**, y desde cuándo. La antigüedad importa
 *    porque es lo único que delata un dato que ya no es cierto: "hace 4 meses" se lee muy distinto
 *    a "hace 10 minutos", y hasta ahora ninguna de las dos se veía.
 * 2. **Que puede corregirla ahora.** El botón usa el mismo trámite que el aviso, así que un clic
 *    escribe siempre, sin filtro de distancia ni de antigüedad: quien lo aprieta está pidiendo que
 *    se corrija, y decirle que no porque "casi no te moviste" sería ignorar la única señal
 *    inequívoca que hay.
 *
 * La detección automática (`LocationRefresher`) cubre a quien ya concedió el permiso. Esto cubre a
 * todos los demás, que son justo los que no tenían salida.
 */
export default function LocationChip({
  fix,
  className = "",
}: {
  fix: VisitorFix;
  className?: string;
}) {
  const t = useTranslations("distance");
  const locale = useLocale();
  const { isBusy, share } = useShareLocation();
  const age = describeAge(fix.fixedAt, new Date());

  return (
    <aside
      data-testid="location-chip"
      className={`mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-600 dark:text-gray-400 ${className}`}
    >
      <MdMyLocation aria-hidden className="shrink-0" />

      <span>{t("chipLabel")}</span>

      {age ? (
        <span data-testid="location-age">
          {t("chipAge", { ago: relativeAge(locale, age.value, age.unit) })}
        </span>
      ) : null}

      <Button
        type="button"
        onClick={share}
        isLoading={isBusy}
        loadingLabel={t("locating")}
        size="xs"
        color="green"
        data-testid="refresh-location"
      >
        {t("refresh")}
      </Button>
    </aside>
  );
}

/**
 * "hace 2 horas" en el idioma activo, sin una sola cadena en el catálogo.
 *
 * `Intl.RelativeTimeFormat` ya sabe hacer esto en los dos idiomas y en todos los que vengan, con
 * sus plurales y sus casos especiales ("hace un momento", "ayer"). Meter esas variantes en
 * `es.json` sería mantener a mano lo que el navegador regala.
 */
function relativeAge(locale: string, value: number, unit: AgeUnit): string {
  return new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(
    -value,
    unit,
  );
}
