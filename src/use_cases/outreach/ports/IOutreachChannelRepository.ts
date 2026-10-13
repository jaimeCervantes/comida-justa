import type { OutreachChannelInput } from "~/domain/outreach/outreachChannelDraft";

/** Un grupo donde se difunde, ya guardado. */
export interface OutreachChannel extends OutreachChannelInput {
  id: string;
}

export default interface IOutreachChannelRepository {
  /** Por nombre: la lista se recorre buscando un grupo, no por fecha. */
  list(): Promise<OutreachChannel[]>;
  /** Nulo también si `id` no tiene forma de identidad. */
  findById(id: string): Promise<OutreachChannel | null>;
  create(channel: OutreachChannelInput): Promise<string>;
  /** `false` si ya no existe. */
  update(id: string, channel: OutreachChannelInput): Promise<boolean>;
}
