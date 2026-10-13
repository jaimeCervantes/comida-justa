import {
  hasOutreachTextErrors,
  normalizeOutreachTextDraft,
  type OutreachTextDraft,
  type OutreachTextErrors,
  validateOutreachTextDraft,
} from "~/domain/outreach/outreachTextDraft";
import type IOutreachTextRepository from "./ports/IOutreachTextRepository";

export interface SaveOutreachTextInput {
  /** Sin identidad se crea; con ella se reemplaza el que ya existe. */
  id?: string | null;
  draft: OutreachTextDraft;
}

export type SaveOutreachTextResult =
  | { status: "saved"; id: string }
  | { status: "invalid"; errors: OutreachTextErrors }
  | { status: "not-found" };

/**
 * Guarda un texto de difusión: lo crea o lo reemplaza entero.
 *
 * Se valida **antes** de limpiar el borrador, y no al revés: los avisos van por posición del
 * producto en el formulario, y la limpieza puede descartar un duplicado y correr las posiciones.
 * Quién puede guardar lo decide `src/app/` con `isAdmin`; aquí solo vive qué se guarda.
 */
export default class SaveOutreachTextUseCase {
  constructor(private readonly repository: IOutreachTextRepository) {}

  async execute({
    id,
    draft,
  }: SaveOutreachTextInput): Promise<SaveOutreachTextResult> {
    const errors = validateOutreachTextDraft(draft);

    if (hasOutreachTextErrors(errors)) return { status: "invalid", errors };

    const clean = normalizeOutreachTextDraft(draft);

    if (!id) {
      return { status: "saved", id: await this.repository.create(clean) };
    }

    return (await this.repository.update(id, clean))
      ? { status: "saved", id }
      : { status: "not-found" };
  }
}
