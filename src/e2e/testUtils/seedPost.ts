import type {
  PostCategory,
  PostSubCategory,
} from "~/domain/entities/post/category";
import PostgresPostRepository from "~/infra/dataAccess/createOnePost/PostgresPostRepository";
import { db } from "~/infra/dataAccess/db/connection";
import { users } from "~/infra/dataAccess/db/schema/auth";

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
  category?: PostCategory | null;
  subCategory?: PostSubCategory | null;
};

/**
 * Inserta un post directamente por el repositorio de escritura (sin pasar por la UI ni por el
 * admin gate), para poder preparar el estado que necesita un listado de lectura.
 */
export async function seedPost(input: SeedPostInput): Promise<string> {
  const userId = await findAnyUserId();
  const repository = new PostgresPostRepository();

  return repository.save({
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

async function findAnyUserId(): Promise<string> {
  const rows = await db.select({ id: users.id }).from(users).limit(1);

  if (rows.length === 0) {
    throw new Error("seedPost: the users table is empty.");
  }

  return rows[0].id;
}
