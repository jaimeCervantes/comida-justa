import type { CuratedChallengeSlug } from "~/domain/habits/curatedChallenges";
import { Link } from "~/i18n/navigation";
import { pillarHref } from "~/i18n/routes";
import { Heading } from "~/presentation/design_system/typography/Heading";
import { PillarSectionHeading } from "./PillarArticle";
import { type PillarKey, pillarColorClasses } from "./pilaresData";

/**
 * Cómo se conecta un pilar con los otros tres.
 *
 * Nació en Sueño —que es el que recibe de todos— y las otras tres páginas pedían la misma tarjeta
 * con otras palabras, así que la forma vive aquí una vez y cada pilar trae sus datos. Mismo reparto
 * que `PillarCatalog`.
 *
 * **Cada tarjeta se pinta con el color de su destino, no con el del pilar que se está leyendo.** Es
 * lo que la hace verse como un puente y no como tres párrafos más de esta página: el color dice a
 * dónde lleva antes de que nadie lea el título.
 *
 * El enlace sale de `pillarHref` y del `Link` de `~/i18n/navigation`, que conservan el idioma
 * activo. Una cadena escrita a mano mandaría a un lector en inglés a la versión en español.
 */
export type PillarBridge = {
  /** El pilar al que lleva. De él salen el color y el destino. */
  to: PillarKey;
  title: string;
  body: string;
};

/**
 * El segmento estable de cada pilar. Vive aquí y no en `pilaresData` porque allí `slug` es una
 * cadena libre, y `pillarHref` exige la unión cerrada de rutas publicadas.
 */
const PILLAR_SLUGS: Record<PillarKey, CuratedChallengeSlug> = {
  sleep: "sueno",
  nutrition: "alimentacion",
  movement: "movimiento",
  mindSpirit: "mente-espiritu",
};

export default function PillarBridges({
  heading,
  intro,
  linkLabel,
  bridges,
}: {
  heading: string;
  intro: string;
  linkLabel: string;
  bridges: readonly PillarBridge[];
}): React.ReactNode {
  return (
    <section>
      <PillarSectionHeading>{heading}</PillarSectionHeading>
      <p className="mb-6">{intro}</p>

      <ul className="grid gap-4 lg:grid-cols-3">
        {bridges.map((bridge) => {
          const color = pillarColorClasses[bridge.to];

          return (
            <li
              key={bridge.to}
              className={`rounded-card border p-6 ${color.bg} ${color.border}`}
            >
              <Heading level={3} size="xs">
                {bridge.title}
              </Heading>
              <p className="mt-2 text-base leading-relaxed">{bridge.body}</p>
              <Link
                href={pillarHref(PILLAR_SLUGS[bridge.to])}
                className={`focus-ring mt-4 inline-flex rounded-lg font-semibold underline ${color.link}`}
              >
                {linkLabel}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
