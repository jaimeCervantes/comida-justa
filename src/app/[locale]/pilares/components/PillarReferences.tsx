import { useTranslations } from "next-intl";
import type { StudyCitation, StudyDesign } from "~/domain/practices/study";
import { doiUrl, studyLabel } from "~/domain/practices/study";
import { Heading } from "~/presentation/design_system/typography/Heading";
import { type PillarKey, pillarColorClasses } from "./pilaresData";

/**
 * La bibliografía de un pilar: qué estudio es, y qué práctica sostiene.
 *
 * Antes era una lista de URLs crudas —cuarenta y tres en la del sueño, con el DOI escrito dos veces,
 * en el `href` y como texto— y nadie podía saber de qué trataba ninguna. El vínculo entre un estudio
 * y la afirmación que respalda existía, pero sólo como comentario en `references.ts`: lo veía quien
 * leía el repositorio, no quien leía la página.
 *
 * **Los estudios que no sostienen ninguna práctica siguen aquí.** De los cuarenta y tres del
 * descanso, trece dicen qué hacer y treinta explican por qué existe el pilar. Esconder los segundos
 * dejaría la sección más limpia y la volvería una mentira por omisión: no toda la bibliografía
 * respalda cada consejo, y decirlo es justamente lo que hace creíble a la que sí.
 *
 * No lee la base: recibe `studies` ya resueltos, así que se puede probar sin montar una conexión.
 */
export default function PillarReferences({
  pillar,
  studies,
}: {
  pillar: PillarKey;
  studies: readonly StudyCitation[];
}) {
  const t = useTranslations("pillars");
  const color = pillarColorClasses[pillar];

  if (studies.length === 0) return null;

  return (
    /* El `data-testid` es de la sección, no de cada entrada: los títulos de los estudios se repiten
       entre pilares y el pie de página también tiene enlaces, así que la prueba necesita un sitio al
       que acotar la búsqueda. Es más barato que un `exact: true` que alguien olvidará. */
    <section data-testid="pillar-bibliography">
      <Heading level={3} className="mb-4">
        {t("references")}
      </Heading>

      <ul className="space-y-4">
        {studies.map((study) => (
          <li key={study.doi} className="text-body">
            <a
              href={doiUrl(study.doi)}
              target="_blank"
              rel="noopener noreferrer"
              className={color.link}
            >
              {studyLabel(study)}
            </a>

            <p className="mt-1 text-caption text-text-muted">
              <Source study={study} />
            </p>

            {study.supports.length > 0 && (
              <p className="mt-1 text-caption">
                <span className={`font-semibold ${color.text}`}>
                  {t("supports")}
                </span>{" "}
                {study.supports.join(" · ")}
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * La revista, el año y el tipo de estudio, en una línea.
 *
 * Las tres piezas son opcionales por separado porque Crossref puede no traerlas, así que se juntan
 * las que haya en vez de dibujar una plantilla con huecos.
 */
function Source({ study }: { study: StudyCitation }) {
  const t = useTranslations("pillars");
  const design = study.design ? designLabel(t, study.design) : null;
  const parts = [study.journal, study.year?.toString(), design].filter(
    (part): part is string => Boolean(part),
  );

  return <>{parts.length > 0 ? parts.join(" · ") : study.doi}</>;
}

type PillarsTranslator = ReturnType<typeof useTranslations<"pillars">>;

/**
 * El nombre del diseño de un estudio.
 *
 * Cada clave se escribe entera aunque `StudyDesign` sea una unión cerrada: una clave compuesta en
 * tiempo de ejecución no aparece al buscarla, y este catálogo va a crecer.
 */
function designLabel(t: PillarsTranslator, design: StudyDesign): string {
  if (design === "meta_analysis") return t("designMetaAnalysis");
  if (design === "systematic_review") return t("designSystematicReview");
  if (design === "guideline") return t("designGuideline");
  if (design === "rct") return t("designRct");
  if (design === "cohort") return t("designCohort");
  if (design === "cross_sectional") return t("designCrossSectional");
  return t("designMechanism");
}
