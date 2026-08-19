"use client";

import { useMemo } from "react";
import { Form, type FormProps } from "~/presentation/design_system/forms/Form";
import { useValidationMessages } from "./useValidationMessages";

/**
 * El `Form` del design system con las frases del catálogo ya puestas.
 *
 * Existe para que ninguna pantalla tenga que acordarse de `messages={useValidationMessages()}`. Lo
 * que pase por `messages` se suma encima de las genéricas, no las sustituye: un formulario declara
 * sólo lo que dice distinto.
 */
export function ValidatedForm({ messages, ...props }: FormProps) {
  const defaults = useValidationMessages();
  const resolved = useMemo(
    () => ({ ...defaults, ...messages }),
    [defaults, messages],
  );

  return <Form messages={resolved} {...props} />;
}
