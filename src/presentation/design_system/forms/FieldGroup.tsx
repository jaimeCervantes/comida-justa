import type { ReactNode } from "react";
import { cn } from "../styling/merge-class-names";

/**
 * Un tramo de un formulario largo: unos cuantos campos bajo un nombre.
 *
 * **Es un `<fieldset>` con `<legend>` y no un `<div>` con un título.** La diferencia no se ve, se
 * oye: un lector de pantalla anuncia «Contacto, teléfono de contacto» al entrar en el campo, así
 * que el grupo se sabe sin salir del campo. Con un `<h3>` suelto, el nombre del tramo se queda
 * arriba y el campo se anuncia solo — que es exactamente el muro que este componente viene a
 * romper, pero para quien no ve la pantalla.
 *
 * **La separación la reparte el grupo, no los campos.** Cada `TextField` traía su propio
 * `containerClassName="mb-6"`, o sea seis decisiones de espaciado para una que debería ser una. Es
 * la misma regla que `cardSpacing`: el contenedor reparte y los hijos no se separan solos.
 *
 * No traduce nada: `legend` y `hint` llegan hechos, como en `EmptyState` y `Alert`.
 */
export function FieldGroup({
  legend,
  hint,
  children,
  testId,
  className,
}: {
  /** El nombre del tramo, ya traducido. */
  legend: string;
  /** Para qué sirve el tramo. Opcional: un nombre claro no necesita explicación. */
  hint?: string;
  children: ReactNode;
  testId?: string;
  className?: string;
}) {
  return (
    <fieldset
      data-testid={testId}
      /* `min-w-0` no es adorno: un `<fieldset>` trae `min-width: min-content` del navegador, y sin
         esto un campo ancho dentro de una cuadrícula estira la columna entera en vez de contenerse
         —el mismo desbordamiento horizontal que ya documentó `ACCOUNT_PAGE_LAYOUT`—. */
      className={cn("min-w-0 border-0 p-0", className)}
    >
      <legend className="mb-1 text-body-lg font-semibold text-text-base">
        {legend}
      </legend>

      {hint ? (
        <p className="mb-4 text-sm text-text-support">{hint}</p>
      ) : (
        <div className="mb-4" />
      )}

      <div className="flex flex-col gap-5">{children}</div>
    </fieldset>
  );
}
