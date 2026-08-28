import { sql } from "drizzle-orm";
import type { PostKind } from "~/domain/entities/post/kind";
import type { PostOrigin } from "~/domain/entities/post/origin";
import PostgresPostRepository from "~/infra/dataAccess/createOnePost/PostgresPostRepository";
import { db } from "~/infra/dataAccess/db/connection";
import { findSuiteUserId } from "./suiteAccount";

/**
 * Media host allowed by `next.config` `images.remotePatterns`; a URL outside that list
 * makes `next/image` throw "hostname not configured" and the card never renders.
 */
const SEED_MEDIA_URL =
  "https://firebasestorage.googleapis.com/v0/b/test/o/seed.jpg?alt=media";

/** Un archivo sembrado, con la dirección variando para que las filas no salgan indistinguibles. */
function seedMediaFile(index: number, alt: string) {
  return {
    url: `https://firebasestorage.googleapis.com/v0/b/test/o/seed-${index}.jpg?alt=media`,
    type: "image",
    alt,
  };
}

export type SeedPostInput = {
  title: string;
  slug: string;
  kind: PostKind;
  /** Cuándo ocurre. Solo un `evento` la usa; sin ella, el validador lo rechaza. */
  startsAt?: Date | null;
  endsAt?: Date | null;
  /** Duracion del servicio en minutos. Solo `servicio` la usa. */
  durationMinutes?: number | null;
  /**
   * `PostOrigin` y no `string`: un escenario que siembre una procedencia inventada la insertaría en
   * la base sin queja y luego fallaría en la aserción, que es el peor sitio para enterarse.
   */
  origin: PostOrigin | null;
  price?: number | null;
  category?: string | null;
  subCategory?: string | null;
  /** Para sembrar dentro del catálogo de una tienda, como haría `/publicar` con su dueño. */
  sellerHandle?: string;
  /** Telefono de contacto. Cadena vacia cuando el escenario necesita una publicacion sin WhatsApp. */
  contactPhone?: string;
  /**
   * El texto de la publicación, cuando el escenario necesita controlarlo aparte del título.
   *
   * Por defecto se deriva del título, y eso basta para casi todo. Lo necesita la búsqueda: para
   * probar que lo que coincide en el título va antes que lo que solo coincide en el texto hace
   * falta poder poner el término **solo** en el texto.
   */
  content?: string;
  /**
   * Cuántos archivos lleva. Uno por omisión, que es lo que tienen las 23 publicaciones reales.
   *
   * Lo necesita la galería: probar que con un archivo no salen ni flechas ni miniaturas, y que con
   * varios sí, exige poder sembrar las dos formas.
   */
  mediaCount?: number;
  /**
   * Los archivos exactos, cuando el escenario necesita que **no** sean fotos.
   *
   * `mediaCount` siembra siempre imágenes, que es lo que quieren casi todos. Esto existe para lo
   * contrario: comprobar qué pasa cuando la publicación es un video, que es un caso real —8 de las
   * 24 publicaciones lo son— y el único que se pinta distinto en una lista.
   */
  media?: Array<{ url: string; type: string; alt: string }>;
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
    content:
      input.content ??
      `${input.title}. Publicación de prueba para el listado de productos.`,
    /* `?? 100` seguiría valiendo para producto, pero un evento gratis es lo normal: si se pidió
       explícitamente `null`, se respeta. */
    price: input.price === null ? null : (input.price ?? 100),
    kind: input.kind,
    origin: input.origin,
    startsAt: input.startsAt ?? null,
    endsAt: input.endsAt ?? null,
    durationMinutes: input.durationMinutes ?? null,
    category: input.category ?? null,
    subCategory: input.subCategory ?? null,
    contactInfo: { phone: input.contactPhone ?? "2781092116" },
    media:
      input.media ??
      ((input.mediaCount ?? 1) <= 1
        ? [{ url: SEED_MEDIA_URL, type: "image", alt: input.title }]
        : Array.from({ length: input.mediaCount ?? 1 }, (_, index) =>
            seedMediaFile(index, input.title),
          )),
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
