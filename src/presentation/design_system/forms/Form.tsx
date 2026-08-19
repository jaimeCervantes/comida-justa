"use client";

import type { ComponentPropsWithRef } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FormValidityContext } from "./FormValidityContext";
import type { ValidationMessages } from "./validity";

/* El evento que React 19 le pasa a `onSubmit` de un `<form>`: trae `submitter`, que `FormEvent`
   no tiene. Se deriva del tipo del propio prop para no quedar desalineado si React lo cambia. */
type FormSubmitEvent = Parameters<
  NonNullable<ComponentPropsWithRef<"form">["onSubmit"]>
>[0];

export type FormProps = Omit<ComponentPropsWithRef<"form">, "noValidate"> & {
  /** Las frases por defecto de sus campos, ya traducidas. Cada campo puede pisar las suyas. */
  messages?: ValidationMessages;
  /**
   * Cambia cuando la Server Action contesta con errores.
   *
   * Sirve para lo que el navegador no puede ver: el servidor rechaza «al menos un archivo» o
   * «el evento no puede terminar antes de empezar», y sin esto el mensaje se pinta arriba mientras
   * la persona sigue abajo. Cualquier valor vale; lo único que importa es que sea distinto del
   * anterior. `null` no mueve nada.
   */
  serverErrorSignal?: unknown;
};

/** El primer control que el navegador rechaza, o el primero que alguien marcó como inválido. */
function findFirstInvalid(form: HTMLFormElement): HTMLElement | null {
  for (const element of Array.from(form.elements)) {
    const control = element as HTMLElement & {
      willValidate?: boolean;
      validity?: ValidityState;
    };

    if (control.willValidate && control.validity && !control.validity.valid)
      return control;

    if (control.getAttribute?.("aria-invalid") === "true") return control;
  }

  return null;
}

function focusFirstInvalid(form: HTMLFormElement): void {
  const target = findFirstInvalid(form);

  if (!target) return;

  target.focus({ preventScroll: true });

  // jsdom no implementa `scrollIntoView`, y un campo enfocado ya es útil sin ella.
  if (typeof target.scrollIntoView === "function")
    target.scrollIntoView({ block: "center", behavior: "smooth" });
}

/**
 * Un formulario que apaga el globito del navegador y se queda con su veredicto.
 *
 * `noValidate` no desactiva la validación: desactiva **la interfaz** de la validación. `validity`
 * se sigue calculando en cada campo, que es de donde sale todo lo que se pinta. Lo que se apaga es
 * la burbuja que el navegador dibuja en su propio idioma —no en el de la ruta—, encima del campo,
 * de una en una y desapareciendo sola a los pocos segundos.
 *
 * Al enviar: si algo falla, se cancela el envío con `preventDefault()` —React 19 comprueba
 * `defaultPrevented` antes de invocar la acción, así que `useActionState` sigue funcionando sin
 * tocar la Server Action—, se les dice a todos los campos que enseñen lo suyo a la vez, y se salta
 * al primero que falla. Si todo está en orden, la acción se ejecuta como siempre.
 */
export function Form({
  messages,
  serverErrorSignal,
  onSubmit,
  children,
  ...props
}: FormProps) {
  const [revealErrors, setRevealErrors] = useState(false);
  const form = useRef<HTMLFormElement | null>(null);
  const isFirstSignal = useRef(true);

  const handleSubmit = useCallback(
    (event: FormSubmitEvent) => {
      const element = event.currentTarget;

      if (!element.checkValidity()) {
        event.preventDefault();
        setRevealErrors(true);
        focusFirstInvalid(element);
        return;
      }

      onSubmit?.(event);
    },
    [onSubmit],
  );

  /* El foco salta también cuando quien rechaza es el servidor. Se salta el primer pase para no
     robar el foco al abrir la pantalla: en ese momento la señal aún no ha cambiado de nada. */
  useEffect(() => {
    if (isFirstSignal.current) {
      isFirstSignal.current = false;
      return;
    }

    if (!serverErrorSignal || !form.current) return;

    focusFirstInvalid(form.current);
  }, [serverErrorSignal]);

  const context = useMemo(
    () => ({ revealErrors, messages: messages ?? {} }),
    [revealErrors, messages],
  );

  return (
    <FormValidityContext.Provider value={context}>
      <form ref={form} noValidate onSubmit={handleSubmit} {...props}>
        {children}
      </form>
    </FormValidityContext.Provider>
  );
}
