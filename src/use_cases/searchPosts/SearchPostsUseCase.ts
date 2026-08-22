import {
  buildSearchEvent,
  type SearchStrategy,
} from "~/domain/search/searchEvent";
import type IEmbeddingService from "~/use_cases/common/ports/IEmbeddingService";
import type { ISearchPostDTO } from "./dtos/ISearchPostDTO";
import type { ISearchPostResultDTO } from "./dtos/ISearchPostResultDTO";
import type { ISearchPostRepository } from "./ports/ISearchPostRepository";

/**
 * Lo que la búsqueda devuelve, con lo que hace falta para pintar sus facetas.
 *
 * `strategy` sale a la superficie porque cambia lo que se puede afirmar: con `"semantic"` los
 * resultados se parecen al **sentido** de lo escrito, no a sus palabras, y los contadores del texto
 * no los describen.
 */
export interface SearchPostsResult {
  results: ISearchPostResultDTO[];
  total: number;
  strategy: SearchStrategy;
  /** Resultados por categoría raíz, o `null` cuando no se pueden afirmar. */
  counts: Readonly<Record<string, number>> | null;
}

import type ISearchReporter from "./ports/ISearchReporter";

/**
 * Hasta dónde puede alejarse un resultado semántico para seguir siendo un resultado.
 *
 * Medido contra la base, no elegido a ojo. Con la consulta directa sobre `post_translations`:
 *
 *   "algo para dormir mejor"              → 0.285  (La clave para dormir profundo)
 *   "bebida para hidratarme"              → 0.305  (Agua de piña con pepino)
 *   "desayuno con proteína"               → 0.321  (Omelet con ensalada)
 *   "reparar la transmisión de un camión" → 0.449  (nada que ver)
 *   "comprar acciones en la bolsa"        → 0.457  (nada que ver)
 *
 * `0.40` deja pasar lo bueno con margen —el cuarto resultado del sueño está en 0.371— y corta lo
 * absurdo antes de que llegue. Sin umbral, el vecino más cercano existe **siempre**: buscar
 * cualquier disparate devolvería jugos.
 */
export const SEMANTIC_MAX_DISTANCE = 0.4;

export class SearchPostsUseCase {
  constructor(
    private readonly postRepository: ISearchPostRepository,
    /**
     * Opcional: sin él la búsqueda funciona igual, solo que sin rescate semántico. Es lo que
     * permite que la suite y los entornos sin `GEMINI_API_KEY` no dependan del proveedor.
     */
    private readonly embeddingService?: IEmbeddingService,
    /** Opcional: sin él la búsqueda funciona igual, solo que a ciegas. */
    private readonly reporter?: ISearchReporter,
  ) {}

  /**
   * Los resultados, y **cuántos habría en cada pilar si soltaras ese filtro**.
   *
   * `countByCategory` es lo que convierte el filtro de pilar en una faceta: un chip que dice
   * «Alimentación 14» promete algo comprobable, y uno que dice «0» ahorra el clic que no lleva a
   * ninguna parte. Se cuenta **sin** el filtro de pilar a propósito — con él puesto, los otros tres
   * saldrían en cero y la faceta no serviría para volver.
   *
   * **Solo se cuenta cuando respondió la búsqueda textual.** El rescate semántico solo entra si el
   * texto no encontró nada, así que ahí estos números serían todos cero al lado de resultados que
   * sí existen: mentirían. `counts` vuelve `null` y quien pinta no enseña ninguno.
   *
   * La cuenta va en paralelo con la búsqueda, no después: son dos consultas independientes sobre el
   * mismo texto, y encadenarlas sumaría su latencia por nada.
   */
  async execute(dto: ISearchPostDTO): Promise<SearchPostsResult> {
    if (!dto.query) {
      return { results: [], total: 0, strategy: "none", counts: null };
    }

    const [textual, counts] = await Promise.all([
      this.postRepository.search(
        dto.query,
        dto.page,
        dto.pageSize,
        dto.locale,
        dto.near ?? null,
        dto.categoryKeys,
        dto.onlyAvailable,
      ),
      this.countByCategory(dto),
    ]);

    if (textual.total > 0) {
      this.report(dto, "text", textual.total);
      return { ...textual, strategy: "text", counts };
    }

    const rescued = await this.rescueSemantically(dto);
    const strategy: SearchStrategy = rescued.total > 0 ? "semantic" : "none";
    this.report(dto, strategy, rescued.total);

    /* Con el rescate semántico las cuentas del texto no describen estos resultados. Se callan. */
    return { ...rescued, strategy, counts: null };
  }

  /** Nunca interrumpe: una faceta sin números sigue siendo un filtro que funciona. */
  private async countByCategory(
    dto: ISearchPostDTO,
  ): Promise<Readonly<Record<string, number>> | null> {
    try {
      return await this.postRepository.countByCategory(
        dto.query,
        dto.onlyAvailable,
      );
    } catch {
      return null;
    }
  }

  /**
   * Deja constancia de la búsqueda. **Nunca interrumpe.**
   *
   * Medir es lo primero que se sacrifica: si el destino falla, quien buscaba recibe sus resultados
   * igual. Va después de tener la respuesta y no antes, para poder registrar con qué estrategia se
   * resolvió y cuántos resultados salieron — que es el dato que hoy no existe.
   */
  private report(
    dto: ISearchPostDTO,
    strategy: SearchStrategy,
    resultCount: number,
  ): void {
    if (!this.reporter) return;

    try {
      this.reporter.record(
        buildSearchEvent({
          term: dto.query,
          locale: dto.locale ?? "es",
          strategy,
          resultCount,
        }),
      );
    } catch {
      /* una búsqueda no puede fallar por no poder medirla */
    }
  }

  /**
   * El rescate: cuando el texto no encontró nada, se pregunta por el **sentido**.
   *
   * Se dispara solo con cero resultados, y esa es la decisión de coste del slice: una llamada al
   * proveedor de embeddings por búsqueda sería inasumible —la caja tiene 500 ms de rebote—, pero
   * pagarla justo cuando alguien se iba a ir con las manos vacías es exactamente cuando vale.
   *
   * Si el proveedor no está configurado o falla, se devuelven los cero resultados de siempre: una
   * búsqueda sin resultados es una respuesta válida, y un error del proveedor no debe volverse un
   * error de la página.
   */
  private async rescueSemantically(
    dto: ISearchPostDTO,
  ): Promise<{ results: ISearchPostResultDTO[]; total: number }> {
    const empty = { results: [], total: 0 };

    if (!this.embeddingService) return empty;

    try {
      const embedding = await this.embeddingService.generateEmbedding(
        dto.query,
      );

      return await this.postRepository.searchByVector(
        embedding,
        dto.page,
        dto.pageSize,
        SEMANTIC_MAX_DISTANCE,
        dto.near ?? null,
        dto.categoryKeys,
      );
    } catch {
      return empty;
    }
  }
}
