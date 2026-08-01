import {
  AlreadyASellerError,
  SellerHandleTakenError,
  SellerNameRequiredError,
  SellerPhoneTakenError,
  SellerValidationError,
} from "~/domain/entities/seller/errors";
import { resolveSellerHandle } from "~/domain/entities/seller/handle";
import { normalizeSellerPhone } from "~/domain/entities/seller/phone";
import type { Seller, SellerDraft } from "~/domain/entities/seller/types";
import type ISellerRepository from "./ports/ISellerRepository";

export interface BecomeSellerInput {
  draft: SellerDraft;
  userId: string;
}

export type BecomeSellerResult =
  | { seller: Seller; errorMessage?: undefined }
  | { seller?: undefined; errorMessage: string };

/**
 * Convierte una cuenta en vendedor: valida el borrador, comprueba lo que la base exige único y
 * guarda la tienda.
 *
 * **Lo esperado se devuelve; lo inesperado se propaga.** Los seis motivos por los que un alta
 * legítima no procede (`SellerValidationError` y sus hijos) salen como `errorMessage` para que el
 * formulario los pinte; una base caída sigue siendo una excepción, porque no hay nada que el
 * vendedor pueda hacer al respecto y ocultarla dejaría el fallo mudo.
 */
export default class BecomeSellerUseCase {
  constructor(private readonly sellerRepository: ISellerRepository) {}

  async execute({
    draft,
    userId,
  }: BecomeSellerInput): Promise<BecomeSellerResult> {
    try {
      const seller = await this.register(draft, userId);

      return { seller };
    } catch (error) {
      if (error instanceof SellerValidationError) {
        return { errorMessage: error.message };
      }

      throw error;
    }
  }

  private async register(draft: SellerDraft, userId: string): Promise<Seller> {
    const existing = await this.sellerRepository.findByUserId(userId);

    if (existing) {
      throw new AlreadyASellerError(existing.handle);
    }

    const name = draft.name?.trim() ?? "";

    if (!name) {
      throw new SellerNameRequiredError();
    }

    // La forma se valida antes que la unicidad: un teléfono de tres dígitos no merece una
    // consulta, y el mensaje útil es "faltan dígitos", no "no está registrado".
    const handle = resolveSellerHandle(name);
    const phone = normalizeSellerPhone(draft.phone);

    if (await this.sellerRepository.findByHandle(handle)) {
      throw new SellerHandleTakenError(handle);
    }

    if (await this.sellerRepository.findByPhone(phone)) {
      throw new SellerPhoneTakenError();
    }

    return this.sellerRepository.save({
      name,
      handle,
      phone,
      description: draft.description?.trim() || null,
      logoUrl: draft.logoUrl || null,
      url: draft.url?.trim() || null,
      userId,
    });
  }
}
