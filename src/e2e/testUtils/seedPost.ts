import { sql } from "drizzle-orm";
import PostgresPostRepository from "~/infra/dataAccess/createOnePost/PostgresPostRepository";
import { db } from "~/infra/dataAccess/db/connection";
import { findSuiteUserId } from "./suiteAccount";

/**
 * Media host allowed by `next.config` `images.remotePatterns`; a URL outside that list
 * makes `next/image` throw "hostname not configured" and the card never renders.
 */
const SEED_MEDIA_URL =
  "https://firebasestorage.googleapis.com/v0/b/test/o/seed.jpg?alt=media";

export type SeedPostInput = {
  title: string;
  slug: string;
  kind: "anuncio" | "producto";
  origin: string | null;
  price?: number | null;
  category?: string | null;
  subCategory?: string | null;
  /** Para sembrar dentro del catálogo de una tienda, como haría `/publicar` con su dueño. */
  sellerHandle?: string;
};

/**
 * Inserta un post directamente por el repositorio de escritura (sin pasar por la UI ni por el
 * admin gate), para poder preparar el estado que necesita un listado de lectura.
 */
export async function seedPost(input: SeedPostInput): Promise<string> {
  const userId = await findSuiteUserId();
  const sellerId = input.sellerHandle
    ? await findSellerId(input.sellerHandle)
    : null;
  const repository = new PostgresPostRepository();

  return repository.save({
    sellerId,
    title: input.title,
    slug: input.slug,
    content: `${input.title}. Publicación de prueba para el listado de productos.`,
    price: input.price ?? 100,
    kind: input.kind,
    origin: input.origin,
    category: input.category ?? null,
    subCategory: input.subCategory ?? null,
    contactInfo: { phone: "2781092116" },
    media: { url: SEED_MEDIA_URL, type: "image", alt: input.title },
    user: { id: userId },
    createdAt: new Date(),
  });
}

async function findSellerId(handle: string): Promise<string> {
  const result = await db.execute(
    sql`SELECT id::text AS id FROM sellers WHERE slug = ${handle} LIMIT 1`,
  );
  const rows = result.rows as unknown as Array<{ id: string }>;

  if (rows.length === 0) {
    throw new Error(`seedPost: no existe la tienda "${handle}".`);
  }

  return rows[0].id;
}
