import type IOutreachFooterRepository from "./ports/IOutreachFooterRepository";
import type { StoredOutreachFooter } from "./ports/IOutreachTextRepository";

/** La lista de `/admin/difusion/pies`, por nombre; también la que se ofrece al elegir el pie. */
export default class ListOutreachFootersUseCase {
  constructor(private readonly footers: IOutreachFooterRepository) {}

  async execute(): Promise<StoredOutreachFooter[]> {
    return this.footers.list();
  }
}
