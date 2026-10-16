import {
  type ListPage,
  matchesListTerm,
  pageOf,
} from "~/domain/search/listPage";
import type IOutreachChannelRepository from "./ports/IOutreachChannelRepository";
import type { OutreachChannel } from "./ports/IOutreachChannelRepository";

/** Veinte: se busca uno para entrar, no se lee la lista entera. */
export const OUTREACH_LIST_PAGE_SIZE = 20;

/** Lo que pide una lista de la difusión: lo escrito en el buscador y la página. */
export interface OutreachListQuery {
  term: string;
  page: number;
}

/**
 * La lista de `/admin/difusion/grupos`, por nombre, buscada y en páginas.
 *
 * Se filtra en memoria y no en la consulta, a propósito: los grupos de una tienda son decenas —la
 * publicación ya los carga todos para calcular turnos—, y así la regla de qué coincide vive en un
 * solo sitio (`matchesListTerm`), sin acentos ni mayúsculas y sin depender de `unaccent`. El día que
 * sean miles, se baja a la consulta.
 */
export default class ListOutreachChannelsUseCase {
  constructor(private readonly channels: IOutreachChannelRepository) {}

  async execute({
    term,
    page,
  }: OutreachListQuery): Promise<ListPage<OutreachChannel>> {
    const all = await this.channels.list();

    return pageOf(
      all.filter((channel) =>
        matchesListTerm(term, [channel.name, channel.url]),
      ),
      page,
      OUTREACH_LIST_PAGE_SIZE,
    );
  }
}
