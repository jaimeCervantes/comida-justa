import type { OutreachFooterDraft } from "~/domain/outreach/footerDraft";
import type { StoredOutreachFooter } from "./IOutreachTextRepository";

export default interface IOutreachFooterRepository {
  /** Por nombre: se elige uno de una lista corta, no se recorre por fecha. */
  list(): Promise<StoredOutreachFooter[]>;
  /** Nulo también si `id` no tiene forma de identidad. */
  findById(id: string): Promise<StoredOutreachFooter | null>;
  create(footer: OutreachFooterDraft): Promise<string>;
  /** `false` si ya no existe. */
  update(id: string, footer: OutreachFooterDraft): Promise<boolean>;
}
