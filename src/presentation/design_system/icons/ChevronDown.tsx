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
 *
 * El otro sitio donde debería usarse es el `▼` literal del selector de idioma, que hoy es un
 * carácter de texto y cambia de tamaño y de grosor según la fuente que resuelva el sistema.
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
