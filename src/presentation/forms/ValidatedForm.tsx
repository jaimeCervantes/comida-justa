"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { Form, type FormProps } from "~/presentation/design_system/forms/Form";
import { useValidationMessages } from "./useValidationMessages";

export type ValidatedFormProps = FormProps & {
  /**
   * Si se explica el `*` de los campos obligatorios. Por omisión sí.
   *
   * Se apaga en un formulario donde todo es obligatorio o nada lo es: ahí el asterisco no distingue
   * nada, y la leyenda sería una línea que no informa.
   */
  showRequiredLegend?: boolean;
};

/**
 * El `Form` del design system con las frases del catálogo ya puestas.
 *
 * Existe para que ninguna pantalla tenga que acordarse de `messages={useValidationMessages()}`. Lo
 * que pase por `messages` se suma encima de las genéricas, no las sustituye: un formulario declara
 * sólo lo que dice distinto.
 *
 * También pone la leyenda del `*`. Va aquí y no en `FieldLabel` porque es una frase por formulario,
 * no por campo, y porque leerla del catálogo es justo lo que el design system no puede hacer.
 */
export function ValidatedForm({
  messages,
  children,
  showRequiredLegend = true,
  ...props
}: ValidatedFormProps) {
  const t = useTranslations("validation");
  const defaults = useValidationMessages();
  const resolved = useMemo(
    () => ({ ...defaults, ...messages }),
    [defaults, messages],
  );

  return (
    <Form messages={resolved} {...props}>
      {showRequiredLegend ? (
        <p className="mb-4 text-xs text-text-support">{t("requiredLegend")}</p>
      ) : null}
      {children}
    </Form>
  );
}
