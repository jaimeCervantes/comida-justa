import Image from "next/image";
import type { StoreSummary } from "~/domain/entities/seller/directory";
import { type AppHref, Link } from "~/i18n/navigation";

/**
 * Una tienda dentro de un directorio.
 *
 * Recibe el destino y los textos ya resueltos. Podría construir el `href` sola, pero el ayudante
 * que lo arma (`storeHref`) vive en una ruta, y un componente de `presentation/` no puede depender
 * de `app/`: la dirección la pone quien la pinta.
 */
export default function StoreSummaryCard({
  store,
  href,
  publicationsLabel,
  visitLabel,
}: {
  store: StoreSummary;
  href: AppHref;
  publicationsLabel: string;
  visitLabel: string;
}) {
  return (
    <article
      className="flex gap-4 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-xs"
      data-testid="store-summary"
    >
      {store.logoUrl ? (
        <Image
          src={store.logoUrl}
          alt={store.name}
          width={96}
          height={96}
          className="h-24 w-24 rounded-full object-cover shrink-0"
        />
      ) : null}

      <div className="min-w-0">
        <h2 className="text-lg font-bold">
          <Link href={href} className="hover:underline">
            {store.name}
          </Link>
        </h2>

        {store.description ? (
          <p className="mt-1 line-clamp-3 text-sm">{store.description}</p>
        ) : null}

        <p className="mt-2 text-sm text-gray-500">{publicationsLabel}</p>

        <Link
          href={href}
          className="mt-2 inline-block text-sm font-medium text-pw-lightgreen hover:underline"
        >
          {visitLabel}
        </Link>
      </div>
    </article>
  );
}
