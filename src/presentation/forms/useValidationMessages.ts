"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import type { ValidationMessages } from "~/presentation/design_system/forms/validity";

/**
 * Las frases genéricas de validación, en el idioma de la ruta.
 *
 * Aquí y no en el design system porque leer el catálogo es exactamente lo que aquella capa no puede
 * hacer: parte del árbol se pinta fuera del `NextIntlClientProvider` —`src/app/not-found.tsx` vive
 * fuera de `[locale]`—, y un componente que llamara a `useTranslations` convertiría esas páginas en
 * un 500. La primitiva recibe las frases por prop, como `loadingLabel` en `Button`.
 *
 * Son el suelo, no el techo: cada campo que tenga algo mejor que decir pisa su clave. El teléfono
 * lo hace, porque «el formato no es válido» no le sirve a nadie sin decir cuál es el formato.
 */
export function useValidationMessages(): ValidationMessages {
  const t = useTranslations("validation");

  return useMemo(
    () => ({
      valueMissing: t("valueMissing"),
      badInput: t("badInput"),
      typeMismatch: t("typeMismatch"),
      patternMismatch: t("patternMismatch"),
      rangeUnderflow: t("rangeUnderflow"),
      rangeOverflow: t("rangeOverflow"),
      stepMismatch: t("stepMismatch"),
      tooShort: t("tooShort"),
      tooLong: t("tooLong"),
    }),
    [t],
  );
}
