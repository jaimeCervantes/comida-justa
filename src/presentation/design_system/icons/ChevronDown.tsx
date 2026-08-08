import type { SVGProps } from "react";

/**
 * La flecha de "esto se despliega".
 *
 * Es nuestra y no la de `react-icons` porque las de ahí vienen rellenas: a 20 px, un triángulo
 * sólido pesa más que el texto que tiene al lado y se lleva la vista al borde derecho del campo, que
 * es justo donde no hay nada que leer. Esta es un trazo, así que acompaña en vez de competir.
 *
 * Hereda tamaño y color de quien la pinta (`currentColor`, y el `size-*` que le llegue del
 * contenedor), y va marcada como decorativa: siempre acompaña a un control que ya se anuncia solo.
 * Por eso quien la use para decir "abierto" o "cerrado" tiene que decirlo también en el control
 * —`aria-expanded`—, como hace el selector de idioma.
 *
 * **Solo apunta hacia abajo.** Para "abierto" se gira 180°, que es una clase y no un segundo
 * archivo; el selector de idioma tenía un `▲` y un `▼` distintos por no poder girar un carácter.
 */
export function ChevronDown(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
