"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import type { ValidationMessages } from "~/presentation/design_system/forms/validity";
import { usePhoneValidationMessages } from "~/presentation/forms/usePhoneValidationMessages";

/** Los campos de una publicación que dicen algo más preciso que la frase genérica. */
export type PostFieldValidationMessages = {
  title: ValidationMessages;
  content: ValidationMessages;
  phone: ValidationMessages;
  price: ValidationMessages;
  durationMinutes: ValidationMessages;
  startsAt: ValidationMessages;
  origin: ValidationMessages;
};

/**
 * Lo que cada campo de una publicación contesta cuando el navegador lo rechaza.
 *
 * **La clave del catálogo es la misma que usa la Server Action.** Ésa es la propiedad que sostiene
 * todo el slice: si el navegador dijera «Falta llenar este campo» y el servidor «El título es
 * obligatorio», el campo tendría dos voces para la misma regla, y quien las viera una detrás de
 * otra creería que son dos problemas distintos. Al compartir clave no pueden contradecirse, y
 * traducir una regla se hace una sola vez.
 *
 * Se comparte entre publicar y editar porque las reglas son las mismas: `origin` es obligatorio en
 * un producto en las dos pantallas, y `durationMinutes` lleva `min="5" step="5"` en las dos.
 */
export function usePostValidationMessages(): PostFieldValidationMessages {
  const t = useTranslations("publish");
  const phone = usePhoneValidationMessages();

  return useMemo(
    () => ({
      title: { valueMissing: t("errorTitleRequired") },
      content: { valueMissing: t("errorContentRequired") },
      /* El formato lo dice `usePhoneValidationMessages`, que es de quien también lo toman la tienda
         y el alta de vendedor: una regla, una frase. */
      phone: { valueMissing: t("errorPhoneRequired"), ...phone },
      price: {
        valueMissing: t("errorPriceRequired"),
        /* `min="1"` y «mayor a cero» son la misma regla dicha dos veces: el atributo la declara y
           la acción la comprueba. La frase es una sola. */
        rangeUnderflow: t("errorPriceRequired"),
        badInput: t("errorPriceRequired"),
      },
      durationMinutes: {
        valueMissing: t("errorDurationRequired"),
        badInput: t("errorDurationRequired"),
        rangeUnderflow: t("errorDurationMin"),
        stepMismatch: t("errorDurationStep"),
      },
      startsAt: {
        valueMissing: t("errorStartsAtRequired"),
        badInput: t("errorStartsAtRequired"),
      },
      origin: { valueMissing: t("errorOriginRequired") },
    }),
    [t, phone],
  );
}
