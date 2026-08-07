import { MdPlace } from "react-icons/md";
import type { Branch } from "~/domain/entities/seller/types";

/**
 * Las sucursales de una tienda. Se comparte entre `/cuenta` (donde el vendedor las administra) y
 * la página pública, porque lo que se muestra es lo mismo: dónde estás y cómo llegar.
 */
export default function BranchList({
  branches,
  emptyMessage,
}: {
  branches: Branch[];
  /** Lo pone quien renderiza: el texto cambia entre la cuenta y la página pública. */
  emptyMessage: string;
}) {
  if (branches.length === 0) {
    return (
      <p
        data-testid="branches-empty"
        className="text-sm text-gray-600 dark:text-gray-400"
      >
        {emptyMessage}
      </p>
    );
  }

  return (
    <ul data-testid="branch-list" className="flex flex-col gap-4">
      {branches.map((branch) => (
        <li key={branch.id} className="flex items-start gap-2">
          <MdPlace size="24" className="shrink-0 text-pw-orange" aria-hidden />
          <div>
            <p className="font-bold">{branch.name}</p>
            <p className="text-sm">{branch.address}</p>
            {branch.mapUrl ? (
              <a
                href={branch.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-pw-lightgreen hover:underline"
              >
                Ver en el mapa
              </a>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
