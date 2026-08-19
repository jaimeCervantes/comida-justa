"use client";

import type { FocusEvent, ForwardedRef, RefCallback } from "react";
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FormValidityContext } from "./FormValidityContext";
import { type ValidationMessages, validationMessageFor } from "./validity";

/** Los controles que el navegador valida y que este design system envuelve. */
export type ValidatableControl =
  | HTMLInputElement
  | HTMLTextAreaElement
  | HTMLSelectElement;

export type UseFieldValidityOptions<T extends ValidatableControl> = {
  /** Lo que contestó la Server Action para este campo, si contestó algo. */
  serverError?: string | null;
  /** Frases propias del campo; pisan las que trae el formulario. */
  messages?: ValidationMessages;
  /** El `ref` que pasó quien usa el componente: se conserva, no se le quita. */
  forwardedRef?: ForwardedRef<T>;
  onBlur?: (event: FocusEvent<T>) => void;
  onChange?: (event: React.ChangeEvent<T>) => void;
};

export type UseFieldValidityResult<T extends ValidatableControl> = {
  ref: RefCallback<T>;
  /** El único mensaje del campo: el del navegador si lo hay, el del servidor si no. */
  error: string | null;
  onBlur: (event: FocusEvent<T>) => void;
  onChange: (event: React.ChangeEvent<T>) => void;
};

/**
 * El ciclo «tocado → revalidar» de un campo, y el reparto del único hueco que tiene para hablar.
 *
 * **Cuándo se pinta.** Ni al cargar ni en la primera tecla: un formulario vacío no está mal, está
 * sin llenar, y un teléfono a medio escribir tampoco. El campo se marca *tocado* al salir de él o
 * al primer envío fallido; sólo a partir de ahí revalida en cada tecla, para que el error se borre
 * en la misma que lo arregla.
 *
 * **Un solo mensaje.** El del navegador manda sobre el del servidor porque describe lo que hay en
 * pantalla *ahora*; el del servidor es una foto del envío anterior, y por eso se retira en cuanto
 * se edita el campo. Dos maneras de verse mal es ninguna.
 *
 * No lee el catálogo: las frases entran ya traducidas, por prop o por `FormValidityContext`. Ver la
 * regla de `AGENTS.md` sobre `design_system/` y `useTranslations`.
 */
export function useFieldValidity<T extends ValidatableControl>({
  serverError,
  messages,
  forwardedRef,
  onBlur,
  onChange,
}: UseFieldValidityOptions<T>): UseFieldValidityResult<T> {
  const { revealErrors, messages: formMessages } =
    useContext(FormValidityContext);
  const control = useRef<T | null>(null);
  const [touched, setTouched] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);
  const [serverErrorDismissed, setServerErrorDismissed] = useState(false);

  const resolvedMessages = useMemo<ValidationMessages>(
    () => ({ ...formMessages, ...messages }),
    [formMessages, messages],
  );

  const readMessage = useCallback((): string | null => {
    const element = control.current;

    // `willValidate` es falso en un campo deshabilitado o en uno oculto: ahí no hay veredicto.
    if (!element?.willValidate) return null;

    return validationMessageFor(element.validity, resolvedMessages);
  }, [resolvedMessages]);

  const ref = useCallback<RefCallback<T>>(
    (element) => {
      control.current = element;

      if (typeof forwardedRef === "function") forwardedRef(element);
      else if (forwardedRef) forwardedRef.current = element;
    },
    [forwardedRef],
  );

  /* El envío fallido marca todos los campos de golpe. Va en un efecto y no en el manejador porque
     quien lo decide es el formulario, que no conoce a sus campos uno por uno. */
  useEffect(() => {
    if (!revealErrors) return;

    setTouched(true);
    setClientError(readMessage());
  }, [revealErrors, readMessage]);

  /* Un error nuevo del servidor vuelve a mostrarse aunque se hubiera retirado el anterior.

     Se ajusta durante el render y no en un efecto —el patrón que documenta React para «reiniciar
     estado cuando cambia una prop»—: un efecto pintaría primero el campo sin mensaje y lo añadiría
     en un segundo pase, que en una lista de campos se ve como un parpadeo. */
  const [lastServerError, setLastServerError] = useState(serverError ?? null);

  if (lastServerError !== (serverError ?? null)) {
    setLastServerError(serverError ?? null);
    setServerErrorDismissed(false);
  }

  const handleBlur = useCallback(
    (event: FocusEvent<T>) => {
      setTouched(true);
      setClientError(readMessage());
      onBlur?.(event);
    },
    [readMessage, onBlur],
  );

  const handleChange = useCallback(
    (event: React.ChangeEvent<T>) => {
      setServerErrorDismissed(true);
      if (touched || revealErrors) setClientError(readMessage());
      onChange?.(event);
    },
    [touched, revealErrors, readMessage, onChange],
  );

  const error =
    clientError ?? (serverErrorDismissed ? null : (serverError ?? null));

  return { ref, error, onBlur: handleBlur, onChange: handleChange };
}
