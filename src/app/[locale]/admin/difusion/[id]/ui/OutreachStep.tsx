import type { ReactNode } from "react";
import { Heading } from "~/presentation/design_system/typography/Heading";

/**
 * Un paso numerado de la publicación («1. Copia el texto y las fotos»), en su tarjeta.
 *
 * Es una región con nombre —el de su encabezado—: quien usa lector de pantalla salta de paso en
 * paso, y la prueba encuentra cada uno por lo que dice y no por cómo está hecho.
 */
export default function OutreachStep({
  id,
  heading,
  hint,
  children,
}: {
  /** Único en la página: liga la región con su encabezado. */
  id: string;
  heading: string;
  hint?: string;
  children: ReactNode;
}) {
  const headingId = `${id}-heading`;

  return (
    <section
      aria-labelledby={headingId}
      className="rounded-card border border-separator p-4"
    >
      <Heading level={3} id={headingId} className="mb-1">
        {heading}
      </Heading>
      {hint ? <p className="mb-3 text-sm text-text-support">{hint}</p> : null}
      {children}
    </section>
  );
}
