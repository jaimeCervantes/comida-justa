import {
  areValidCoordinates,
  type Coordinates,
  isShortMapUrl,
  parseCoordinatesFromMapUrl,
} from "~/domain/entities/seller/coordinates";
import {
  BranchAddressRequiredError,
  BranchLocationUnresolvedError,
  BranchNameRequiredError,
  SellerValidationError,
} from "~/domain/entities/seller/errors";
import type { Branch, BranchDraft } from "~/domain/entities/seller/types";
import type IBranchRepository from "./ports/IBranchRepository";
import type IMapUrlResolver from "./ports/IMapUrlResolver";

export interface AddBranchInput {
  draft: BranchDraft;
  sellerId: string;
}

export type AddBranchResult =
  | { branch: Branch; errorMessage?: undefined }
  | { branch?: undefined; errorMessage: string };

/**
 * Da de alta una sucursal con sus coordenadas.
 *
 * **Sin coordenadas no hay sucursal.** No es un capricho del esquema (`branches.location` es
 * `NOT NULL`): es que una sucursal sin punto en el mapa no aporta nada al único lugar donde se usa
 * —el radio de `search_posts_semantic`—, y guardarla daría la impresión de que ya te pueden
 * encontrar cerca cuando no es cierto.
 */
export default class AddBranchUseCase {
  constructor(
    private readonly branchRepository: IBranchRepository,
    private readonly mapUrlResolver: IMapUrlResolver,
  ) {}

  async execute({ draft, sellerId }: AddBranchInput): Promise<AddBranchResult> {
    try {
      const branch = await this.register(draft, sellerId);

      return { branch };
    } catch (error) {
      if (error instanceof SellerValidationError) {
        return { errorMessage: error.message };
      }

      throw error;
    }
  }

  private async register(
    draft: BranchDraft,
    sellerId: string,
  ): Promise<Branch> {
    const name = draft.name?.trim() ?? "";
    const address = draft.address?.trim() ?? "";
    const mapUrl = draft.mapUrl?.trim() ?? "";

    if (!name) throw new BranchNameRequiredError();
    if (!address) throw new BranchAddressRequiredError();

    const coordinates = await this.resolveCoordinates(draft, mapUrl);

    if (!coordinates) throw new BranchLocationUnresolvedError();

    return this.branchRepository.save({
      sellerId,
      name,
      address,
      mapUrl,
      coordinates,
    });
  }

  /**
   * El GPS del navegador gana sobre el enlace: quien tocó "usar mi ubicación actual" está parado
   * en su local, y eso es más preciso que el encuadre de un mapa copiado.
   */
  private async resolveCoordinates(
    draft: BranchDraft,
    mapUrl: string,
  ): Promise<Coordinates | null> {
    if (areValidCoordinates(draft.coordinates ?? null)) {
      return draft.coordinates as Coordinates;
    }

    const fromUrl = parseCoordinatesFromMapUrl(mapUrl);

    if (fromUrl) return fromUrl;

    // Un enlace corto no lleva coordenadas: hay que seguirlo. Es el que reparte el botón
    // "Compartir" de Google Maps, o sea el que la gente pega.
    if (!isShortMapUrl(mapUrl)) return null;

    return parseCoordinatesFromMapUrl(await this.mapUrlResolver.expand(mapUrl));
  }
}
