import type { ReactNode } from "react";

/**
 * El armazón que comparten las cuatro páginas de pilar: cabecera, subtítulo y el cuerpo con su
 * ritmo tipográfico. Solo cambia el color del título, que entra como prop.
 */
export default function PillarArticle({
  heading,
  subtitle,
  headingClassName,
  children,
}: {
  heading: string;
  subtitle: string;
  /** El color del pilar; lo demás del encabezado es igual en las cuatro. */
  headingClassName: string;
  children: ReactNode;
}) {
  return (
    <article className="">
      <header className="mb-10">
        <h1
          className={`text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 ${headingClassName}`}
        >
          {heading}
        </h1>
        <p className="text-xl text-slate-600 da dark:text-slate-400">
          {subtitle}
        </p>
      </header>

      <div className="space-y-8 text-lg text-slate-800 da dark:text-slate-200 leading-relaxed">
        {children}
      </div>
    </article>
  );
}

/** Una fila de «etiqueta en negrita + texto» de las cajas destacadas. */
export function LabeledItem({ label, text }: { label: string; text: string }) {
  return (
    <li className="flex flex-col sm:flex-row gap-2 sm:gap-4">
      <span className="font-bold text-slate-900 da dark:text-slate-50 shrink-0 sm:w-28 text-xl">
        {label}
      </span>
      <span className="text-slate-700 da dark:text-slate-300 text-lg">
        {text}
      </span>
    </li>
  );
}

/** La caja con barra lateral de color que cierra cada pilar. */
export function PillarCallout({
  className,
  children,
}: {
  className: string;
  children: ReactNode;
}) {
  return (
    <div className={`border-l-4 p-6 rounded-r-xl my-8 ${className}`}>
      {children}
    </div>
  );
}
