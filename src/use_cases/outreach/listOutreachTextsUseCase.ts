import {
  type ListPage,
  matchesListTerm,
  pageOf,
} from "~/domain/search/listPage";
import {
  OUTREACH_LIST_PAGE_SIZE,
  type OutreachListQuery,
} from "./listOutreachChannelsUseCase";
import type IOutreachTextRepository from "./ports/IOutreachTextRepository";
import type { OutreachTextSummary } from "./ports/IOutreachTextRepository";

/**
 * La lista de `/admin/difusion`: del texto que se tocó al último al más viejo, buscada por nombre y
 * en páginas. En memoria por lo mismo que la de grupos: son decenas.
 */
export default class ListOutreachTextsUseCase {
  constructor(private readonly repository: IOutreachTextRepository) {}

  async execute({
    term,
    page,
  }: OutreachListQuery): Promise<ListPage<OutreachTextSummary>> {
    const all = await this.repository.list();

    return pageOf(
      all.filter((text) => matchesListTerm(term, [text.name])),
      page,
      OUTREACH_LIST_PAGE_SIZE,
    );
  }
}
