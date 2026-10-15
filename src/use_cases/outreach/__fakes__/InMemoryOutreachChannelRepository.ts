import type { OutreachChannelInput } from "~/domain/outreach/outreachChannelDraft";
import type IOutreachChannelRepository from "../ports/IOutreachChannelRepository";
import type { OutreachChannel } from "../ports/IOutreachChannelRepository";

/** Los grupos sin base, en el orden por nombre que da la consulta real. */
export default class InMemoryOutreachChannelRepository
  implements IOutreachChannelRepository
{
  readonly saved = new Map<string, OutreachChannelInput>();
  private sequence = 0;

  async list(): Promise<OutreachChannel[]> {
    return [...this.saved.entries()]
      .map(([id, channel]) => ({ id, ...channel }))
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
  }

  async findById(id: string): Promise<OutreachChannel | null> {
    const channel = this.saved.get(id);

    return channel ? { id, ...channel } : null;
  }

  async create(channel: OutreachChannelInput): Promise<string> {
    this.sequence += 1;
    const id = `grupo-${this.sequence}`;
    this.saved.set(id, channel);

    return id;
  }

  async update(id: string, channel: OutreachChannelInput): Promise<boolean> {
    if (!this.saved.has(id)) return false;
    this.saved.set(id, channel);

    return true;
  }

  async delete(id: string): Promise<boolean> {
    return this.saved.delete(id);
  }
}
