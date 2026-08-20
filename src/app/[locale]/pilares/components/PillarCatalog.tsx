import { Heading } from "~/presentation/design_system/typography/Heading";
import { PillarSectionHeading } from "./PillarArticle";
import { type PillarKey, pillarColorClasses } from "./pilaresData";

/**
 * El catálogo de un pilar: categorías con sus ejemplos y su doble impacto.
 *
 * Nació en Alimentación —ingredientes de proximidad, qué le hacen al cuerpo, qué le hacen al
 * entorno— y Movimiento pedía exactamente la misma tarjeta con otras palabras. Copiarla habría sido
 * el segundo componente casi idéntico que `AGENTS.md` llama fallo de diseño, así que la forma vive
 * aquí una vez y cada pilar trae sus datos y sus etiquetas.
 *
 * **Tarjetas y no una tabla.** Las dos fuentes son tablas de cuatro columnas, y trasladarlas tal
 * cual dejaba la página desbordada a lo ancho justo en el teléfono, que es donde se consulta —al
 * comprar, o al decidir qué hacer esta tarde—. Cada categoría se lee entera de arriba abajo.
 *
 * Los dos impactos van en la misma tarjeta y no en una sección de sostenibilidad aparte: son la
 * misma decisión, y separarlos volvería opcional la mitad que sostiene al barrio.
 */
export type PillarCatalogCategory = {
  title: string;
  items: readonly string[];
  /** Lo que le hace a quien lo practica. */
  bodyImpact: string;
  /** Lo que le hace a su entorno y a la economía de la zona. */
  localImpact: string;
};

export default function PillarCatalog({
  pillar,
  heading,
  intro,
  bodyLabel,
  localLabel,
  categories,
}: {
  pillar: PillarKey;
  heading: string;
  intro: string;
  bodyLabel: string;
  localLabel: string;
  categories: readonly PillarCatalogCategory[];
}): React.ReactNode {
  const color = pillarColorClasses[pillar];

  return (
    <section>
      <PillarSectionHeading>{heading}</PillarSectionHeading>
      <p className="mb-6">{intro}</p>

      <ul className="grid gap-4 lg:grid-cols-2">
        {categories.map((category) => (
          <li
            key={category.title}
            className={`rounded-card border p-6 ${color.bg} ${color.border}`}
          >
            <Heading level={3} size="sm">
              {category.title}
            </Heading>

            <ul className="mt-3 list-disc space-y-1 pl-5 text-base leading-relaxed">
              {category.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <dl className="mt-4 space-y-3 text-base leading-relaxed">
              <div>
                <dt className={`font-bold ${color.text}`}>{bodyLabel}</dt>
                <dd className="mt-1">{category.bodyImpact}</dd>
              </div>
              <div>
                <dt className={`font-bold ${color.text}`}>{localLabel}</dt>
                <dd className="mt-1">{category.localImpact}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </section>
  );
}
