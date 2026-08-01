import { useTranslations } from "next-intl";

/**
 * La bibliografía de un pilar.
 *
 * Existe porque las cuatro páginas repetían el mismo bloque `<li><a …>` una vez por referencia
 * —hasta cuarenta veces en la del sueño—, con la URL escrita dos veces y las clases de color
 * copiadas a mano en cada una. Aquí el color entra como prop y las referencias como datos.
 */
export default function PillarReferences({
  references,
  linkClassName,
}: {
  references: readonly string[];
  /** Las clases del enlace, que cambian con el color del pilar. */
  linkClassName: string;
}) {
  const t = useTranslations("pillars");

  return (
    <section>
      <h3 className="text-xl font-bold text-slate-900 da dark:text-slate-50 mb-4">
        {t("references")}
      </h3>
      <ul className="list-disc pl-6 space-y-2 text-slate-700 da dark:text-slate-300 text-base break-all">
        {references.map((reference) => (
          <li key={reference}>
            <a
              href={reference}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClassName}
            >
              {reference}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
