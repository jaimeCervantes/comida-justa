import type { AppLocale } from "~/i18n/routing";
import { readPillarBibliography } from "~/infra/dataAccess/practices/PostgresPillarBibliography";
import PillarReferences from "./PillarReferences";
import type { PillarKey } from "./pilaresData";

/**
 * Lo que la bibliografía necesita del servidor.
 *
 * Mismo reparto que `PillarPractice` y `PillarLocal`: esta pieza lee y `PillarReferences` pinta. Así
 * la lista se puede probar con datos fijos, sin conexión y sin depender de qué haya sembrado hoy la
 * base.
 */
export default async function PillarBibliography({
  pillar,
  locale,
}: {
  pillar: PillarKey;
  locale: AppLocale;
}): Promise<React.ReactNode> {
  const studies = await readPillarBibliography(pillar, locale);

  return <PillarReferences pillar={pillar} studies={studies} />;
}
