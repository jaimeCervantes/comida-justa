import { useTranslations } from "next-intl";
import { type PillarKey, pillarColorClasses } from "./pilaresData";

/**
 * La bibliografía de un pilar.
 *
 * Existe porque las cuatro páginas repetían el mismo bloque `<li><a …>` una vez por referencia
 * —hasta cuarenta veces en la del sueño—, con la URL escrita dos veces y las clases de color
 * copiadas a mano en cada una. Ahora entra la clave del pilar y el color lo resuelve el token.
 */
export default function PillarReferences({
  pillar,
  references,
}: {
  pillar: PillarKey;
  references: readonly string[];
}) {
  const t = useTranslations("pillars");
  const color = pillarColorClasses[pillar];

  return (
    <section>
      <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-4">
        {t("references")}
      </h3>
      <ul className="list-disc pl-6 space-y-2 text-slate-700 dark:text-slate-300 text-base break-all">
        {references.map((reference) => (
          <li key={reference}>
            <a
              href={reference}
              target="_blank"
              rel="noopener noreferrer"
              className={color.link}
            >
              {reference}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
