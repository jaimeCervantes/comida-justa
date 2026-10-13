import { normalizeNewlines } from "./outreachText";

/** Un producto tal como lo deja el formulario: cuál, con qué etiqueta y con qué emoji. */
export interface OutreachTextDraftItem {
  postId: string;
  label: string;
  emoji: string | null;
}

/**
 * Lo que se guarda de un texto de difusión. El orden de `items` **es** el orden del texto: la
 * posición no viaja en el formulario, se deriva al guardar.
 */
export interface OutreachTextDraft {
  name: string;
  opening: string;
  closing: string;
  items: OutreachTextDraftItem[];
}

/**
 * Códigos y no frases: el mensaje lo pone el catálogo del idioma de quien llena el formulario.
 * `items` va por posición del producto en el formulario, que es donde hay que pintar el aviso.
 */
export interface OutreachTextErrors {
  name?: "required";
  items?: Record<number, { label: "required" }>;
}

/**
 * El borrador tal como debe guardarse: sin espacios en los extremos, con saltos de renglón `\n`,
 * sin emojis vacíos y sin un mismo producto dos veces.
 *
 * El duplicado se descarta en vez de rechazarse porque el formulario no deja agregarlo: si llega,
 * es una petición armada a mano, y la base lo rechazaría con un `UNIQUE` que nadie sabría leer.
 */
export function normalizeOutreachTextDraft(
  draft: OutreachTextDraft,
): OutreachTextDraft {
  const seen = new Set<string>();
  const items: OutreachTextDraftItem[] = [];

  for (const item of draft.items) {
    if (seen.has(item.postId)) continue;
    seen.add(item.postId);
    items.push({
      postId: item.postId,
      label: item.label.trim(),
      emoji: item.emoji?.trim() || null,
    });
  }

  return {
    name: draft.name.trim(),
    opening: normalizeNewlines(draft.opening).trim(),
    closing: normalizeNewlines(draft.closing).trim(),
    items,
  };
}

/**
 * Lo que falta para poder guardar, **todo a la vez**: arreglar un formulario error por error es una
 * forma lenta de perder a quien lo llena.
 *
 * Un texto sin productos sí se guarda: puede escribirse antes de dar de alta lo que anunciará, y la
 * pantalla ya dice que no hay nada que copiar.
 */
export function validateOutreachTextDraft(
  draft: OutreachTextDraft,
): OutreachTextErrors {
  const errors: OutreachTextErrors = {};

  if (!draft.name.trim()) errors.name = "required";

  draft.items.forEach((item, index) => {
    if (item.label.trim()) return;
    errors.items = { ...errors.items, [index]: { label: "required" } };
  });

  return errors;
}

export function hasOutreachTextErrors(errors: OutreachTextErrors): boolean {
  return Object.keys(errors).length > 0;
}
