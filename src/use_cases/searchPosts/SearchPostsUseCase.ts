import type IEmbeddingService from "~/use_cases/common/ports/IEmbeddingService";
import type { ISearchPostDTO } from "./dtos/ISearchPostDTO";
import type { ISearchPostResultDTO } from "./dtos/ISearchPostResultDTO";
import type { ISearchPostRepository } from "./ports/ISearchPostRepository";

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
  ) {}

  async execute(
    dto: ISearchPostDTO,
  ): Promise<{ results: ISearchPostResultDTO[]; total: number }> {
    if (!dto.query) {
      return { results: [], total: 0 };
    }

    const textual = await this.postRepository.search(
      dto.query,
      dto.page,
      dto.pageSize,
      dto.locale,
      dto.near ?? null,
      dto.fallbackLocale,
    );

    if (textual.total > 0) return textual;

    return this.rescueSemantically(dto);
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
        dto.locale ?? "es",
        dto.fallbackLocale ?? "es",
        SEMANTIC_MAX_DISTANCE,
        dto.near ?? null,
      );
    } catch {
      return empty;
    }
  }
}
