import {
  type OutreachChannelDraft,
  type OutreachChannelErrors,
  validateOutreachChannelDraft,
} from "~/domain/outreach/outreachChannelDraft";
import type IOutreachChannelRepository from "./ports/IOutreachChannelRepository";

export interface SaveOutreachChannelInput {
  /** Sin identidad se da de alta; con ella se reemplaza el que ya existe. */
  id?: string | null;
  draft: OutreachChannelDraft;
}

export type SaveOutreachChannelResult =
  | { status: "saved"; id: string }
  | { status: "invalid"; errors: OutreachChannelErrors }
  | { status: "not-found" };

/** Da de alta o corrige un grupo. Quién puede hacerlo lo decide `src/app/` con `isAdmin`. */
export default class SaveOutreachChannelUseCase {
  constructor(private readonly channels: IOutreachChannelRepository) {}

  async execute({
    id,
    draft,
  }: SaveOutreachChannelInput): Promise<SaveOutreachChannelResult> {
    const { channel, errors } = validateOutreachChannelDraft(draft);

    if (!channel) return { status: "invalid", errors };

    if (!id) {
      return { status: "saved", id: await this.channels.create(channel) };
    }

    return (await this.channels.update(id, channel))
      ? { status: "saved", id }
      : { status: "not-found" };
  }
}
