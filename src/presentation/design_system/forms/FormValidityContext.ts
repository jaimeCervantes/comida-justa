"use client";

import { createContext } from "react";
import type { ValidationMessages } from "./validity";

export type FormValidityContextValue = {
  /**
   * Si el formulario ya pidió enseñar todo lo que falta.
   *
   * Se enciende al primer envío fallido y, a partir de ahí, ningún campo espera a que lo toquen:
   * enseñar los errores de uno en uno era justo el defecto del globito del navegador.
   */
  revealErrors: boolean;
  /** Las frases por defecto del formulario, ya traducidas. Cada campo puede pisar las suyas. */
  messages: ValidationMessages;
};

/**
 * Lo que el formulario le cuenta a sus campos.
 *
 * Por defecto, ni revela ni trae frases: un `TextField` suelto —en una historia de Storybook o en
 * una prueba— tiene que poder renderizarse sin ningún proveedor encima.
 */
export const FormValidityContext = createContext<FormValidityContextValue>({
  revealErrors: false,
  messages: {},
});
