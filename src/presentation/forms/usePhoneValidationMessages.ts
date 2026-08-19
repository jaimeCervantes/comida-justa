"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import type { ValidationMessages } from "~/presentation/design_system/forms/validity";

/**
 * Lo que contesta un teléfono mal escrito, en el idioma de la ruta.
 *
 * El mismo `pattern` (`^\+?(\d{1,3})?[0-9]{10}$`) está en publicar, en editar, en el alta de tienda
 * y en su ficha: cuatro campos con una sola regla, así que también con una sola frase. Es la peor
 * que dejaba el navegador —para `pattern` sólo sabe decir «coincide con el formato solicitado», que
 * no nombra el formato—; aquí se nombra, y con ejemplo.
 *
 * Vive en `forms/` y no en `post/` porque el teléfono de una tienda no es el de una publicación,
 * pero la regla sí es la misma. `usePostValidationMessages` la compone en vez de repetirla.
 */
export function usePhoneValidationMessages(): ValidationMessages {
  const t = useTranslations("publish");

  return useMemo(
    () => ({
      patternMismatch: t("errorPhoneFormat"),
    }),
    [t],
  );
}
