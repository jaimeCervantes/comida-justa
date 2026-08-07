import type { ReactNode } from "react";
import { type PillarKey, pillarColorClasses } from "./pilaresData";

/**
 * El armazón que comparten las cuatro páginas de pilar: cabecera, subtítulo y el cuerpo con su
 * ritmo tipográfico. Solo cambia el color, y ya no entra como cadena de clases: entra la clave del
 * pilar y el color se resuelve aquí.
 *
 * Antes cada página se traía sus propias clases (`text-violet-500`, `bg-emerald-50/50 dark:…`) y
 * eso fue justo lo que se pudrió: un find/replace dejó `da dark:` como clase suelta,
 * `bg-violet-50/da` y `text-violet-100xt-lg`, y nadie lo notó porque el color estaba escrito
 * cuatro veces en cuatro archivos. Con la clave, un pilar solo puede pintarse de su color.
 */
export default function PillarArticle({
  pillar,
  heading,
  subtitle,
  children,
}: {
  pillar: PillarKey;
  heading: string;
  subtitle: string;
  children: ReactNode;
}) {
  const color = pillarColorClasses[pillar];

  return (
    <article>
      <header className="mb-10">
        <h1
          className={`text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 ${color.text}`}
        >
          {heading}
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400">{subtitle}</p>
      </header>

      <div className="space-y-8 text-lg text-slate-800 dark:text-slate-200 leading-relaxed">
        {children}
      </div>
    </article>
  );
}

/** El encabezado de sección que las cuatro páginas repiten. */
export function PillarSectionHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-4">
      {children}
    </h2>
  );
}

/** Una fila de «etiqueta en negrita + texto» de las cajas destacadas. */
export function LabeledItem({ label, text }: { label: string; text: string }) {
  return (
    <li className="flex flex-col sm:flex-row gap-2 sm:gap-4">
      <span className="font-bold text-slate-900 dark:text-slate-50 shrink-0 sm:w-28 text-xl">
        {label}
      </span>
      <span className="text-slate-700 dark:text-slate-300 text-lg">{text}</span>
    </li>
  );
}

/** La caja destacada con el par «cambio / impacto» de cada pilar. */
export function PillarPanel({
  pillar,
  children,
}: {
  pillar: PillarKey;
  children: ReactNode;
}) {
  const color = pillarColorClasses[pillar];

  return (
    <div
      className={`rounded-2xl p-6 sm:p-8 my-8 border shadow-xs ${color.bg} ${color.border}`}
    >
      <ul className="space-y-6">{children}</ul>
    </div>
  );
}

/** La caja con barra lateral de color que cierra cada pilar. */
export function PillarCallout({
  pillar,
  children,
}: {
  pillar: PillarKey;
  children: ReactNode;
}) {
  const color = pillarColorClasses[pillar];

  return (
    <div
      className={`border-l-4 p-6 rounded-r-xl my-8 ${color.bg} ${color.border}`}
    >
      <p className={`text-lg m-0 ${color.text}`}>{children}</p>
    </div>
  );
}
