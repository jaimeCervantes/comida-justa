import { getTranslations } from "next-intl/server";
import type { DirectoryKind } from "~/domain/entities/seller/directory";
import { Link } from "~/i18n/navigation";
import StoreSummaryCard from "~/presentation/directory/StoreSummaryCard";
import { storeHref } from "../cuenta/storePath";
import { listDirectory } from "./data";

/**
 * Las dos secciones de la comunidad, con la misma plantilla y distinto filtro.
 *
 * Cada una lleva **su texto arriba y el directorio debajo**, y no al revés: hoy productores está
 * vacía y negocios tiene una sola tienda, así que una página que fuera solo lista sería una página
 * hueca. Con el texto, vale desde el primer día y se llena sola después.
 */
export default async function DirectorySection({
  kind,
}: {
  kind: DirectoryKind;
}) {
  const t = await getTranslations("directory");
  const tDistance = await getTranslations("distance");
  const { stores, outsideRadius } = await listDirectory(kind);

  const heading =
    kind === "producers" ? t("producersHeading") : t("businessesHeading");
  const intro =
    kind === "producers" ? t("producersIntro") : t("businessesIntro");
  const empty =
    kind === "producers" ? t("producersEmpty") : t("businessesEmpty");

  return (
    <main>
      <h1 className="text-2xl font-bold mb-3">{heading}</h1>
      <p className="mb-6 max-w-3xl">{intro}</p>

      {/* Lo que sale queda fuera de tu radio sostenible. Decirlo es la diferencia entre "no hay
          nadie cerca de ti" y una lista que finge que sí lo están. */}
      {outsideRadius ? (
        <p
          data-testid="nothing-nearby"
          className="mb-4 text-sm text-text-support"
        >
          {tDistance("nothingNearby")}
        </p>
      ) : null}

      {stores.length === 0 ? (
        <p className="mb-6 text-text-support" data-testid="directory-empty">
          {empty}
        </p>
      ) : (
        <ul className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(320px,1fr))] list-none p-0">
          {stores.map((store) => (
            <li key={store.handle}>
              <StoreSummaryCard
                store={store}
                href={storeHref(store.handle)}
                publicationsLabel={t("publications", {
                  count: store.publicationCount,
                })}
                visitLabel={t("visit")}
              />
            </li>
          ))}
        </ul>
      )}

      {/* Quien llega aquí buscando dónde comprar es también quien podría vender. */}
      <p className="mt-8">
        <Link
          href="/cuenta"
          className="font-medium text-highlight hover:underline"
        >
          {t("cta")}
        </Link>
      </p>
    </main>
  );
}
