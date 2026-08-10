import { sql } from "drizzle-orm";
import type { CartProduct } from "~/domain/cart/cart";
import type { CartProductRepository } from "~/domain/cart/ports";
import { PRODUCT_KIND } from "~/domain/entities/post/hazloSanoProduct";
import { db } from "~/infra/dataAccess/db/connection";

interface CartProductRow {
  id: string;
  /** `numeric` sale de Postgres como texto para no perder precisión por el camino. */
  price: string | null;
  is_available: boolean;
  title: string;
  slug: string;
  seller_id: string;
  seller_name: string;
  seller_slug: string | null;
  seller_phone: string;
  [key: string]: unknown;
}

export class PostgresCartProductRepository implements CartProductRepository {
  /**
   * Lee los productos del carrito con el precio y la disponibilidad de **hoy**.
   *
   * **`JOIN sellers` y no `LEFT JOIN`**, al revés que el listado: una tarjeta sin tienda se puede
   * pintar igual, pero un renglón de carrito sin tienda no tiene a quién pedírsele. Hoy los 13
   * productos tienen `seller_id`; el que no lo tenga desaparece del carrito en vez de quedarse como
   * un renglón que no se puede confirmar.
   *
   * El `LATERAL` prefiere la traducción del idioma pedido y cae a la de respaldo, igual que las
   * publicaciones relacionadas: el slug es el que viaja en el mensaje de WhatsApp, así que tiene que
   * ser el del idioma que se está leyendo.
   */
  async findByIds(
    postIds: readonly string[],
    locale: string,
    fallbackLocale: string,
  ): Promise<CartProduct[]> {
    // Un `IN ()` vacío es error de sintaxis en Postgres, y además no hay nada que preguntar.
    if (postIds.length === 0) return [];

    const ids = sql.join(
      postIds.map((id) => sql`${id}`),
      sql`, `,
    );

    const raw = await db.execute(sql`
      SELECT
        p.id,
        p.price::text,
        p.is_available,
        t.title,
        t.slug,
        s.id    AS seller_id,
        s.name  AS seller_name,
        s.slug  AS seller_slug,
        s.phone AS seller_phone
      FROM posts p
      JOIN sellers s
        ON s.id = p.seller_id
      JOIN LATERAL (
        SELECT title, slug
        FROM post_translations
        WHERE post_id = p.id
        ORDER BY (locale = ${locale}) DESC, (locale = ${fallbackLocale}) DESC
        LIMIT 1
      ) t ON TRUE
      WHERE p.id IN (${ids})
        AND p.kind = ${PRODUCT_KIND}
        /* Sin precio no se puede sumar. Es lo que deja fuera a los 10 anuncios, que no tienen
           ninguno, incluso si alguien mete su id en la cookie a mano. */
        AND p.price IS NOT NULL
    `);

    return (raw.rows as CartProductRow[]).flatMap(toCartProduct);
  }
}

/* Un precio ilegible se descarta en vez de propagar un `NaN` hasta el total: la columna es
   `numeric` y nullable, y el `WHERE` ya filtra el nulo, pero el tipo no garantiza el resto. */
function toCartProduct(row: CartProductRow): CartProduct[] {
  const price = Number(row.price);

  if (!Number.isFinite(price)) return [];

  return [
    {
      postId: row.id,
      title: row.title,
      slug: row.slug,
      price,
      isAvailable: row.is_available,
      seller: {
        id: row.seller_id,
        name: row.seller_name,
        handle: row.seller_slug,
        phone: row.seller_phone,
      },
    },
  ];
}
