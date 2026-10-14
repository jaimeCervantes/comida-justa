import {
  type OutreachFooterDraft,
  type OutreachFooterErrors,
  validateOutreachFooterDraft,
} from "~/domain/outreach/footerDraft";
import type IOutreachFooterRepository from "./ports/IOutreachFooterRepository";

export interface SaveOutreachFooterInput {
  /** Sin identidad se da de alta; con ella se corrige el que ya existe. */
  id?: string | null;
  draft: OutreachFooterDraft;
}

export type SaveOutreachFooterResult =
  | { status: "saved"; id: string }
  | { status: "invalid"; errors: OutreachFooterErrors }
  | { status: "not-found" };

/**
 * Da de alta o corrige un pie compartido. Corregirlo cambia el final de todos los textos que lo
 * llevan, que es justo para lo que existe: el WhatsApp se cambia una vez.
 */
export default class SaveOutreachFooterUseCase {
  constructor(private readonly footers: IOutreachFooterRepository) {}

  async execute({
    id,
    draft,
  }: SaveOutreachFooterInput): Promise<SaveOutreachFooterResult> {
    const { footer, errors } = validateOutreachFooterDraft(draft);

    if (!footer) return { status: "invalid", errors };

    if (!id) {
      return { status: "saved", id: await this.footers.create(footer) };
    }

    return (await this.footers.update(id, footer))
      ? { status: "saved", id }
      : { status: "not-found" };
  }
}
