import { normalizeNewlines } from "./outreachText";

/** Lo que manda el formulario de un pie, tal cual. */
export interface OutreachFooterDraft {
  name: string;
  body: string;
}

/** Códigos y no frases: el mensaje lo pone el catálogo del idioma de quien llena el formulario. */
export interface OutreachFooterErrors {
  name?: "required";
  body?: "required";
}

export type FooterValidation =
  | { footer: OutreachFooterDraft; errors?: undefined }
  | { footer?: undefined; errors: OutreachFooterErrors };

/**
 * Un pie listo para guardarse, o lo que le falta, todo a la vez.
 *
 * Un pie sin texto no se guarda: no tendría nada que añadir al final de una publicación, y elegirlo
 * parecería funcionar sin hacer nada.
 */
export function validateOutreachFooterDraft(
  draft: OutreachFooterDraft,
): FooterValidation {
  const name = draft.name.trim();
  const body = normalizeNewlines(draft.body).trim();
  const errors: OutreachFooterErrors = {};

  if (!name) errors.name = "required";
  if (!body) errors.body = "required";

  if (!name || !body) return { errors };

  return { footer: { name, body } };
}
