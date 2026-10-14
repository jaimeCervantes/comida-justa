import type { OutreachTextDraft } from "~/domain/outreach/outreachTextDraft";
import type IOutreachTextRepository from "../ports/IOutreachTextRepository";
import type {
  OutreachTextSummary,
  StoredOutreachFooter,
  StoredOutreachProduct,
  StoredOutreachText,
} from "../ports/IOutreachTextRepository";

/** Lo que la base dice hoy de un producto; el texto solo guarda etiqueta, emoji y orden. */
export type CatalogProduct = Omit<
  StoredOutreachProduct,
  "label" | "emoji" | "position"
>;

/**
 * El repositorio sin base: guarda los borradores como los guardaría la tabla y, al leer, los cruza
 * con un catálogo que la prueba controla —que es lo que hace la consulta real con `posts`—.
 */
export default class InMemoryOutreachTextRepository
  implements IOutreachTextRepository
{
  readonly saved = new Map<string, OutreachTextDraft>();
  private sequence = 0;

  constructor(
    private readonly catalog: Map<string, CatalogProduct> = new Map(),
    /** Los pies que existen, para resolver `footerId` como lo haría el `JOIN` real. */
    private readonly footers: (
      id: string,
    ) => StoredOutreachFooter | null = () => null,
  ) {}

  async list(): Promise<OutreachTextSummary[]> {
    return [...this.saved.entries()].map(([id, draft]) => ({
      id,
      name: draft.name,
      productCount: draft.items.length,
      updatedAt: new Date(0),
    }));
  }

  async findById(id: string): Promise<StoredOutreachText | null> {
    const draft = this.saved.get(id);

    if (!draft) return null;

    return {
      id,
      name: draft.name,
      opening: draft.opening,
      versions: draft.versions ?? [],
      closing: draft.closing,
      footer: draft.footerId ? this.footers(draft.footerId) : null,
      products: draft.items.flatMap((item, position) => {
        const product = this.catalog.get(item.postId);

        return product
          ? [{ ...product, label: item.label, emoji: item.emoji, position }]
          : [];
      }),
    };
  }

  async create(draft: OutreachTextDraft): Promise<string> {
    this.sequence += 1;
    const id = `texto-${this.sequence}`;
    this.saved.set(id, draft);

    return id;
  }

  async update(id: string, draft: OutreachTextDraft): Promise<boolean> {
    if (!this.saved.has(id)) return false;
    this.saved.set(id, draft);

    return true;
  }
}
