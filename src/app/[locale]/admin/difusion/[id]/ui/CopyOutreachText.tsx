"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { MdContentCopy } from "react-icons/md";
import { Button } from "~/presentation/design_system/buttons/Button";

type Feedback = "copied" | "failed";

/**
 * Copia el texto exacto que se ve. Es el único paso entre la app y el grupo: lo demás lo hace la
 * persona en Facebook, que es lo que mantiene su cuenta a salvo.
 */
export default function CopyOutreachText({ text }: { text: string }) {
  const t = useTranslations("outreach");
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const copy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
      setFeedback("copied");
    } catch {
      // Sin contexto seguro `writeText` rechaza. El texto está a la vista, así que se puede
      // seleccionar a mano: decirlo es mejor que un botón que aparenta no hacer nada.
      setFeedback("failed");
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        color="green"
        startIcon={<MdContentCopy aria-hidden />}
        onClick={copy}
      >
        {t("copy")}
      </Button>
      {feedback ? (
        <p
          data-testid="outreach-copy-feedback"
          role="status"
          className="text-sm text-text-support"
        >
          {feedback === "copied" ? t("copied") : t("copyFailed")}
        </p>
      ) : null}
    </div>
  );
}
