import {
  NotASellerError,
  SellerNameRequiredError,
  SellerPhoneTakenError,
  SellerValidationError,
} from "~/domain/entities/seller/errors";
import { normalizeSellerPhone } from "~/domain/entities/seller/phone";
import type { Seller } from "~/domain/entities/seller/types";
import type ISellerProfileRepository from "./ports/ISellerProfileRepository";

export interface SellerProfileDraft {
  name: string;
  phone: string;
  description?: string | null;
  url?: string | null;
  logoUrl?: string | null;
}

export interface UpdateSellerProfileInput {
  userId: string;
  draft: SellerProfileDraft;
}

export type UpdateSellerProfileResult =
  | { seller: Seller; errorMessage?: undefined }
  | { seller?: undefined; errorMessage: string };

/**
 * Corrige la ficha de la tienda propia: nombre, teléfono, descripción, sitio web y logo.
 *
 * **La dirección (`slug`) no se toca.** El nombre visible cambia cuanto haga falta, pero la URL se
 * quedó fija a propósito: ya se repartió por WhatsApp y moverla dejaría muertos esos enlaces.
 * Renombrarla se evaluó y se descartó (ver `docs/features/commerce/001-2026-07-31-vendedores-y-tiendas.md`).
 *
 * **La tienda sale de la sesión, no del formulario:** así nadie puede editar la ficha de otro
 * mandando un id ajeno.
 */
export default class UpdateSellerProfileUseCase {
  constructor(private readonly sellerRepository: ISellerProfileRepository) {}

  async execute({
    userId,
    draft,
  }: UpdateSellerProfileInput): Promise<UpdateSellerProfileResult> {
    try {
      const seller = await this.update(userId, draft);

      return { seller };
    } catch (error) {
      if (error instanceof SellerValidationError) {
        return { errorMessage: error.message };
      }

      throw error;
    }
  }

  private async update(
    userId: string,
    draft: SellerProfileDraft,
  ): Promise<Seller> {
    const seller = await this.sellerRepository.findByUserId(userId);

    if (!seller) throw new NotASellerError();

    const name = draft.name?.trim() ?? "";

    if (!name) throw new SellerNameRequiredError();

    const phone = normalizeSellerPhone(draft.phone);

    // Solo se consulta si cambió: conservar el propio teléfono no es un duplicado, y sin esta
    // comparación guardar la ficha sin tocar el número se rechazaría a sí mismo.
    if (phone !== seller.phone) {
      const owner = await this.sellerRepository.findByPhone(phone);

      if (owner && owner.id !== seller.id) {
        throw new SellerPhoneTakenError();
      }
    }

    return this.sellerRepository.updateProfile(seller.id, {
      name,
      phone,
      description: draft.description?.trim() || null,
      url: draft.url?.trim() || null,
      // Un logo vacío significa "no se subió uno nuevo": se conserva el que había.
      logoUrl: draft.logoUrl?.trim() || seller.logoUrl,
    });
  }
}
