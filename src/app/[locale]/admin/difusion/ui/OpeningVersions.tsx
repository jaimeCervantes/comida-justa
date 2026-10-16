"use client";

import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { Button } from "~/presentation/design_system/buttons/Button";
import { TextArea } from "~/presentation/design_system/forms/TextArea";
import { Heading } from "~/presentation/design_system/typography/Heading";

interface OpeningVersionsProps {
  /** Las versiones que ya tiene el texto, de la 2 en adelante. */
  initial: readonly string[];
  maxLength: number;
}

/**
 * Las otras formas de empezar un texto. Cada una viaja como un campo `versions` más, en orden; la
 * acción descarta las vacías. La llave de cada una es propia y no su posición, para que quitar la
 * segunda no deje su texto pegado en la que sigue.
 */
export default function OpeningVersions({
  initial,
  maxLength,
}: OpeningVersionsProps) {
  const t = useTranslations("outreach");
  const sequence = useRef(initial.length);
  const [versions, setVersions] = useState(() =>
    initial.map((text, key) => ({ key, text })),
  );

  const add = (): void => {
    sequence.current += 1;
    setVersions((current) => [...current, { key: sequence.current, text: "" }]);
  };

  const change = (key: number, text: string): void =>
    setVersions((current) =>
      current.map((version) =>
        version.key === key ? { ...version, text } : version,
      ),
    );

  const remove = (key: number): void =>
    setVersions((current) => current.filter((version) => version.key !== key));

  return (
    <section data-testid="outreach-versions" className="mb-4">
      <Heading level={2} className="mb-1">
        {t("versionsHeading")}
      </Heading>
      <p className="mb-3 text-sm text-text-support">{t("versionsHint")}</p>

      {versions.map((version, index) => (
        <div key={version.key} className="mb-3">
          <TextArea
            name="versions"
            label={t("versionLabel", { n: index + 2 })}
            value={version.text}
            onChange={(event) => change(version.key, event.target.value)}
            maxLength={maxLength}
            rows={6}
            containerClassName="mb-2"
          />
          <Button size="sm" onClick={() => remove(version.key)}>
            {t("removeVersion", { n: index + 2 })}
          </Button>
        </div>
      ))}

      <Button size="sm" onClick={add}>
        {t("addVersion")}
      </Button>
    </section>
  );
}
