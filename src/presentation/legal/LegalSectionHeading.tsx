import type { ReactNode } from "react";
import { Heading } from "~/presentation/design_system/typography/Heading";

/**
 * El encabezado numerado de una sección legal.
 *
 * La insignia con el número estaba copiada **diez veces** en `/condiciones-de-servicio` con esta
 * cadena entera: `bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full
 * w-7 sm:w-8 h-7 sm:h-8 flex items-center justify-center text-sm font-semibold shrink-0`. Y en
 * `/politica-de-privacidad` solo una de sus secciones la llevaba: las demás habían derivado a un
 * `h2` distinto, que es lo que pasa siempre que algo se copia en vez de nombrarse.
 *
 * El azul se cambió por el verde de la marca: no había ninguna razón para que las páginas legales
 * usaran un color que el sitio no usa en ningún otro sitio.
 */
export default function LegalSectionHeading({
  number,
  children,
}: {
  number: number;
  children: ReactNode;
}) {
  return (
    <Heading
      level={2}
      /* El tamaño lo pone el nivel, no un `text-xl sm:text-2xl` que lo pisaba. */
      className="flex items-center gap-3 mb-4 sm:mb-5"
    >
      <span
        aria-hidden="true"
        className="bg-brand-green-soft text-brand-green-900 rounded-full w-7 sm:w-8 h-7 sm:h-8 flex items-center justify-center text-sm font-semibold shrink-0"
      >
        {number}
      </span>
      {children}
    </Heading>
  );
}
