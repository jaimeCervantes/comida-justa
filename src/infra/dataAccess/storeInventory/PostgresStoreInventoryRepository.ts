import { sql } from "drizzle-orm";
import { PRODUCT_KIND } from "~/domain/entities/post/hazloSanoProduct";
import type { InventoryScope } from "~/domain/entities/post/inventoryScope";
import { db } from "~/infra/dataAccess/db/connection";
import { PUBLISHED_POSTS } from "~/infra/dataAccess/db/publishedPosts";
import type {
  InventoryItem,
  InventoryPage,
  InventoryQuery,
  IStoreInventoryRepository,
} from "./IStoreInventoryRepository";

interface InventoryRow {
  id: string;
  title: string;
  slug: string;
  price: string | null;
  stock_quantity: number | null;
  is_available: boolean;
}

/**
 * El filtro por título, en **cualquiera** de sus idiomas.
 *
 * `EXISTS` sobre `post_translations` y no una comparación con el título ya elegido: quien teclea
 * «masa madre» lo espera aunque esté mirando el panel en inglés, y una publicación tiene un título
 * por idioma. Con `EXISTS` basta que uno case, y no multiplica la fila como haría un `JOIN`.
 *
 * **`strpos` y no `ILIKE`**: lo que se busca es «contiene», y en un `LIKE` el `%` y el `_` que
 * alguien teclee son comodines. Habría que escaparlos —un guion bajo en un título es de lo más
 * normal— y ese escapado es justo la clase de detalle que se escribe mal una vez y nadie vuelve a
 * mirar. Sin comodines no hay nada que escapar, y el término entra parametrizado igual.
 */
function termCondition(term: string) {
  if (term === "") return sql``;

  return sql`AND EXISTS (
    SELECT 1 FROM post_translations pt
    WHERE pt.post_id = p.id
      AND strpos(lower(pt.title), lower(${term})) > 0
  )`;
}

/**
 * Lo que cada ámbito añade al `WHERE`.
 *
 * `untracked` pregunta por `IS NULL` y `out` por `= 0`, y esa diferencia **es** el modelo: nulo
 * significa que nadie lleva la cuenta y cero que se acabó. Un `= 0` que también atrapara los nulos
 * pondría las 418 publicaciones sin contar en la lista de «hay que reponer».
 */
function scopeCondition(scope: InventoryScope) {
  if (scope === "out") return sql`AND p.stock_quantity = 0`;
  if (scope === "untracked") return sql`AND p.stock_quantity IS NULL`;

  return sql``;
}

/**
 * El inventario de una tienda, para el panel de su dueño.
 *
 * **Solo `producto`.** Un servicio se vende pero no se entrega en piezas y un anuncio no se vende:
 * meterlos en la tabla sería ofrecer un campo que el caso de uso rechazaría. Es la misma regla que
 * ya aplica la ficha (`canTrackStock`), escrita aquí como condición para no traer filas que la
 * pantalla tendría que descartar después — y que descuadrarían la paginación.
 *
 * **No filtra por quién publicó.** El inventario es de la tienda: `Hazlo Sano` tiene productos
 * escritos por más de una cuenta y su dueño los administra todos, que es exactamente la segunda vía
 * de `canManagePost`.
 *
 * **Sí filtra por estado de moderación**, y no por costumbre: lo que la moderación bajó no está en
 * el escaparate, así que contarle unidades no cambia nada. La tarea que le toca a una publicación
 * bajada es arreglarla, no inventariarla, y esa conversación pasa por su ficha —que sí se la
 * enseña a su autor, con el aviso—. Enseñarla aquí sería un renglón que promete una venta
 * imposible, en una pantalla que no tiene dónde explicar por qué.
 */
export class PostgresStoreInventoryRepository
  implements IStoreInventoryRepository
{
  async listBySeller(
    sellerId: string,
    query: InventoryQuery,
  ): Promise<InventoryPage> {
    const where = sql`
      p.seller_id = ${sellerId}::uuid
      AND p.kind = ${PRODUCT_KIND}
      AND ${PUBLISHED_POSTS}
      ${scopeCondition(query.scope)}
      ${termCondition(query.term)}
    `;

    const [total, items] = await Promise.all([
      this.countWhere(where),
      this.pageWhere(where, query),
    ]);

    return { total, items };
  }

  private async countWhere(where: ReturnType<typeof sql>): Promise<number> {
    const raw = await db.execute(sql`
      SELECT count(*)::int AS total FROM posts p WHERE ${where}
    `);

    return (raw.rows as Array<{ total: number }>)[0]?.total ?? 0;
  }

  /**
   * Ordenado **por título**, no por fecha como el catálogo.
   *
   * Una lista de novedades se lee de arriba abajo; un inventario se recorre buscando algo concreto
   * entre 418 renglones, y por orden alfabético la página en la que está algo es adivinable. El
   * `p.id` de desempate mantiene la paginación estable entre dos productos que se llamen igual —los
   * hay: seis "Barra de Proteína … — Pieza individual" comparten casi todo el nombre.
   */
  private async pageWhere(
    where: ReturnType<typeof sql>,
    { page, pageSize, locale, fallbackLocale }: InventoryQuery,
  ): Promise<InventoryItem[]> {
    const raw = await db.execute(sql`
      SELECT
        p.id,
        t.title,
        t.slug,
        p.price::text,
        p.stock_quantity,
        p.is_available
      FROM posts p
      JOIN LATERAL (
        SELECT title, slug
        FROM post_translations
        WHERE post_id = p.id
        ORDER BY (locale = ${locale}) DESC, (locale = ${fallbackLocale}) DESC
        LIMIT 1
      ) t ON TRUE
      WHERE ${where}
      ORDER BY t.title ASC, p.id ASC
      LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}
    `);

    return (raw.rows as unknown as InventoryRow[]).map((row) => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      price: row.price === null ? null : Number(row.price),
      stockQuantity: row.stock_quantity,
      isAvailable: row.is_available,
    }));
  }
}
