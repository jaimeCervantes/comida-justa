import { useTranslations } from "next-intl";
import { MdPlace } from "react-icons/md";
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
 */
export default function BranchList({
  branches,
  emptyMessage,
}: {
  branches: Branch[];
  /** Lo pone quien renderiza: el texto cambia entre la cuenta y la página pública. */
  emptyMessage: string;
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
          </div>
        </li>
      ))}
    </ul>
  );
}
