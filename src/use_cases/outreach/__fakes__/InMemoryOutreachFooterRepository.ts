import type { OutreachFooterDraft } from "~/domain/outreach/footerDraft";
import type IOutreachFooterRepository from "../ports/IOutreachFooterRepository";
import type { StoredOutreachFooter } from "../ports/IOutreachTextRepository";

/** Los pies sin base, en el orden por nombre que da la consulta real. */
export default class InMemoryOutreachFooterRepository
  implements IOutreachFooterRepository
{
  readonly saved = new Map<string, OutreachFooterDraft>();
  private sequence = 0;

  async list(): Promise<StoredOutreachFooter[]> {
    return [...this.saved.entries()]
      .map(([id, footer]) => ({ id, ...footer }))
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
  }

  async findById(id: string): Promise<StoredOutreachFooter | null> {
    return this.lookup(id);
  }

  /** Síncrono, para que el repositorio de textos en memoria resuelva el pie como un `JOIN`. */
  lookup(id: string): StoredOutreachFooter | null {
    const footer = this.saved.get(id);

    return footer ? { id, ...footer } : null;
  }

  async create(footer: OutreachFooterDraft): Promise<string> {
    this.sequence += 1;
    const id = `pie-${this.sequence}`;
    this.saved.set(id, footer);

    return id;
  }

  async update(id: string, footer: OutreachFooterDraft): Promise<boolean> {
    if (!this.saved.has(id)) return false;
    this.saved.set(id, footer);

    return true;
  }

  async delete(id: string): Promise<boolean> {
    return this.saved.delete(id);
  }
}
