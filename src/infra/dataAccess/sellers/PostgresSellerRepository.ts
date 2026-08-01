import { eq, type SQL } from "drizzle-orm";
import type { Seller } from "~/domain/entities/seller/types";
import { db } from "~/infra/dataAccess/db/connection";
import { sellers } from "~/infra/dataAccess/db/schema/sellers";
import type ISellerRepository from "~/use_cases/becomeSeller/ports/ISellerRepository";
import type { NewSeller } from "~/use_cases/becomeSeller/ports/ISellerRepository";
import type ISellerProfileRepository from "~/use_cases/updateSellerProfile/ports/ISellerProfileRepository";
import type { SellerProfileUpdate } from "~/use_cases/updateSellerProfile/ports/ISellerProfileRepository";

/**
 * `sellers.category` es `NOT NULL` y pertenece a la taxonomía del chatbot (el único valor en uso
 * es `'Food'`), no a la tabla `categories` del sitio. No se le pregunta al vendedor: se escribe
 * aquí porque es una exigencia del esquema heredado, no una decisión de negocio.
 */
const DEFAULT_SELLER_CATEGORY = "Food";

const SELLER_COLUMNS = {
  id: sellers.id,
  name: sellers.name,
  handle: sellers.slug,
  phone: sellers.phone,
  description: sellers.description,
  logoUrl: sellers.logoUrl,
  url: sellers.url,
  userId: sellers.userId,
};

export class PostgresSellerRepository
  implements ISellerRepository, ISellerProfileRepository
{
  async findByUserId(userId: string): Promise<Seller | null> {
    return this.findOneBy(eq(sellers.userId, userId));
  }

  async findByHandle(handle: string): Promise<Seller | null> {
    return this.findOneBy(eq(sellers.slug, handle));
  }

  async findByPhone(phone: string): Promise<Seller | null> {
    return this.findOneBy(eq(sellers.phone, phone));
  }

  async save(seller: NewSeller): Promise<Seller> {
    const [row] = await db
      .insert(sellers)
      .values({
        name: seller.name,
        slug: seller.handle,
        category: DEFAULT_SELLER_CATEGORY,
        phone: seller.phone,
        description: seller.description,
        logoUrl: seller.logoUrl,
        url: seller.url,
        userId: seller.userId,
      })
      .returning(SELLER_COLUMNS);

    return row;
  }

  /** `slug` queda fuera del `UPDATE`: la dirección es inmutable por decisión, no por olvido. */
  async updateProfile(
    sellerId: string,
    update: SellerProfileUpdate,
  ): Promise<Seller> {
    const [row] = await db
      .update(sellers)
      .set({
        name: update.name,
        phone: update.phone,
        description: update.description,
        url: update.url,
        logoUrl: update.logoUrl,
      })
      .where(eq(sellers.id, sellerId))
      .returning(SELLER_COLUMNS);

    return row;
  }

  private async findOneBy(where: SQL): Promise<Seller | null> {
    const rows = await db
      .select(SELLER_COLUMNS)
      .from(sellers)
      .where(where)
      .limit(1);

    return rows[0] ?? null;
  }
}
