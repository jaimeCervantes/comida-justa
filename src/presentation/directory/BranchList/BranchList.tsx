import { useTranslations } from "next-intl";
import { MdMyLocation, MdPlace } from "react-icons/md";
import { mapPointUrl } from "~/domain/entities/seller/coordinates";
import type { Branch } from "~/domain/entities/seller/types";

/**
 * Las sucursales de una tienda. Se comparte entre `/cuenta` (donde el vendedor las administra) y
 * la página pública, porque lo que se muestra es lo mismo: dónde estás y cómo llegar.
 *
 * **El rótulo del mapa sí lo traduce ella; `emptyMessage` no.** Es la diferencia entre un texto que
 * cambia con quien mira y uno que cambia con **dónde se pinta**: «Ver en el mapa» dice lo mismo en
 * la cuenta y en la tienda, así que sale del catálogo aquí dentro —hasta el slice 2 estaba en duro
 * en español, y se pintaba también en la página pública en inglés—. El mensaje de vacío, en cambio,
 * lo pone quien llama: dice cosas distintas según la pantalla.
 *
 * **No hay estado de «sucursal sin ubicar», y no por olvido.** `branches.location` es `NOT NULL` y
 * `AddBranchUseCase` rechaza el alta sin coordenadas —«sin coordenadas no hay sucursal»—, así que
 * toda sucursal que llegue aquí tiene su punto en el mapa. El slice 2 llegó a escribir un aviso
 * para ese caso y se retiró al descubrirlo: un aviso de algo imposible es código que nadie ve
 * fallar.
 *
 * **Los dos enlaces del mapa no son el mismo, y esa es la gracia.** «Ver en el mapa» abre el
 * `mapUrl` que pegó el vendedor; `checkPointLabel` abre el punto que la base tiene **guardado**,
 * armado desde `coordinates`. Cuando el enlace pegado solo traía el encuadre del mapa y no el pin
 * del negocio, los dos llevan a sitios distintos — y hasta ahora solo se veía el primero, que
 * siempre parece correcto porque es el suyo. Ver
 * `docs/features/commerce/006-2026-09-04-punto-de-la-sucursal.md`.
 */
export default function BranchList({
  branches,
  emptyMessage,
  checkPointLabel,
}: {
  branches: Branch[];
  /** Lo pone quien renderiza: el texto cambia entre la cuenta y la página pública. */
  emptyMessage: string;
  /**
   * El rótulo del enlace al punto guardado, ya traducido. **Solo la cuenta lo pasa.**
   *
   * Sin él no se ofrece: es una herramienta de quien administra la tienda, y a un visitante no le
   * sirve de nada — a él el enlace pegado suele llevarle a la ficha del negocio con su nombre, que
   * es mejor destino.
   */
  checkPointLabel?: string;
}) {
  const t = useTranslations("branches");

  if (branches.length === 0) {
    return (
      <p data-testid="branches-empty" className="text-sm text-text-support">
        {emptyMessage}
      </p>
    );
  }

  return (
    <ul data-testid="branch-list" className="flex flex-col gap-4">
      {branches.map((branch) => (
        <li
          key={branch.id}
          data-testid="branch-item"
          className="flex items-start gap-2"
        >
          <MdPlace size="24" className="shrink-0 text-pw-orange" aria-hidden />
          <div className="min-w-0">
            <p className="font-bold">{branch.name}</p>
            <p className="text-sm">{branch.address}</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              {branch.mapUrl ? (
                <a
                  href={branch.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-highlight hover:underline"
                >
                  {t("seeOnMap")}
                </a>
              ) : null}

              <CheckPointLink branch={branch} label={checkPointLabel} />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

/**
 * El enlace que abre el punto **guardado**, no el que se pegó.
 *
 * Va en pestaña nueva por lo mismo que la dirección pública de la cuenta: quien comprueba dónde
 * quedó su sucursal está verificando, no navegando, y perder la cuenta a medio configurar es justo
 * lo que no quiere.
 */
function CheckPointLink({ branch, label }: { branch: Branch; label?: string }) {
  const href = label ? mapPointUrl(branch.coordinates) : null;

  if (!href || !label) return null;

  return (
    <a
      data-testid="branch-check-point"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-sm text-text-support hover:text-highlight hover:underline"
    >
      <MdMyLocation size="14" aria-hidden className="shrink-0" />
      {label}
    </a>
  );
}
