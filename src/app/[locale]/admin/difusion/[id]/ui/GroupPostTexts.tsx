import { getTranslations } from "next-intl/server";
import CopyText from "./CopyText";

const TEXT_BOX =
  "mb-3 whitespace-pre-wrap break-words rounded-card border border-separator bg-surface-elevation-1 p-4 font-sans";

/**
 * El texto para grupos normales, armado y listo para copiar: uno solo, o uno por versión.
 *
 * `pre-wrap` y no `pre`: conserva los renglones tal cual se pegarán, sin obligar a desplazarse de
 * lado en un teléfono. Con varias versiones cada una lleva su número, que es el que dice cada grupo
 * («Le toca la versión 2»).
 */
export default async function GroupPostTexts({
  versions,
}: {
  versions: readonly string[];
}) {
  const t = await getTranslations("outreach");

  if (versions.length <= 1) {
    const text = versions[0] ?? "";

    return (
      <>
        <pre data-testid="outreach-text" className={TEXT_BOX}>
          {text}
        </pre>
        <CopyText text={text} label={t("copy")} />
      </>
    );
  }

  return (
    <ol className="flex flex-col gap-4">
      {versions.map((text, index) => (
        <li
          // Las versiones no tienen identidad propia: su número es su lugar.
          // biome-ignore lint/suspicious/noArrayIndexKey: el orden es el dato, no cambia al pintar.
          key={index}
          data-testid="outreach-version"
          data-version={index + 1}
        >
          <h3 className="mb-1 font-semibold">
            {t("versionHeading", { n: index + 1 })}
          </h3>
          <pre data-testid="outreach-version-text" className={TEXT_BOX}>
            {text}
          </pre>
          <CopyText text={text} label={t("copyVersion", { n: index + 1 })} />
        </li>
      ))}
    </ol>
  );
}
