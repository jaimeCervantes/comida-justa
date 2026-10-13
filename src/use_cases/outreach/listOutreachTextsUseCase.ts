import type IOutreachTextRepository from "./ports/IOutreachTextRepository";
import type { OutreachTextSummary } from "./ports/IOutreachTextRepository";

/** La lista de `/admin/difusion`: del texto que se tocó al último al más viejo. */
export default class ListOutreachTextsUseCase {
  constructor(private readonly repository: IOutreachTextRepository) {}

  async execute(): Promise<OutreachTextSummary[]> {
    return this.repository.list();
  }
}
