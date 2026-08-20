import Image from "next/image";
import type { StoreSummary } from "~/domain/entities/seller/directory";
import { type AppHref, Link } from "~/i18n/navigation";
import { Surface } from "~/presentation/design_system/surfaces/Surface";
import { Heading } from "~/presentation/design_system/typography/Heading";
import { Text } from "~/presentation/design_system/typography/Text";
import StoreDistance from "~/presentation/location/StoreDistance";

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
    <Surface
      as="article"
      radius="2xl"
      border="subtle"
      elevation="xs"
      className="flex gap-4 p-4"
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
        <Heading level={2} size="xs">
          <Link href={href} className="hover:underline">
            {store.name}
          </Link>
        </Heading>

        {store.description ? (
          <Text variant="label" className="mt-1 line-clamp-3">
            {store.description}
          </Text>
        ) : null}

        <p className="mt-2 flex flex-wrap items-center gap-2 text-label text-text-support">
          {publicationsLabel}
          <StoreDistance meters={store.distanceMeters ?? null} />
        </p>

        <Link
          href={href}
          className="mt-2 inline-block text-label font-medium text-highlight hover:underline"
        >
          {visitLabel}
        </Link>
      </div>
    </Surface>
  );
}
