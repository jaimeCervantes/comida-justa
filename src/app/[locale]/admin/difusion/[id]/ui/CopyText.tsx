"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { MdContentCopy } from "react-icons/md";
import { Button } from "~/presentation/design_system/buttons/Button";

type Feedback = "copied" | "failed";

interface CopyTextProps {
  /** Lo que se copia, exacto. */
  text: string;
  /** Lo que dice el botón: «Copiar», «Copiar título»… */
  label: string;
  /**
   * `main` es el texto completo de un grupo normal: botón verde y aviso largo. `field` es un campo
   * de un artículo de compraventa: discreto, porque en una página hay uno por pan y por campo.
   */
  variant?: "main" | "field";
}

/**
 * Copia el texto exacto que se ve. Es el único paso entre la app y el grupo: lo demás lo hace la
 * persona en Facebook, que es lo que mantiene su cuenta a salvo.
 */
export default function CopyText({
  text,
  label,
  variant = "main",
}: CopyTextProps) {
  const t = useTranslations("outreach");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const isMain = variant === "main";

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
        color={isMain ? "green" : "default"}
        size={isMain ? "md" : "sm"}
        startIcon={<MdContentCopy aria-hidden />}
        onClick={copy}
      >
        {label}
      </Button>
      {feedback ? (
        <p
          data-testid="outreach-copy-feedback"
          role="status"
          className="text-sm text-text-support"
        >
          {feedback === "failed"
            ? t("copyFailed")
            : isMain
              ? t("copied")
              : t("copiedShort")}
        </p>
      ) : null}
    </div>
  );
}
