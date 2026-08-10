import { and, eq, sql } from "drizzle-orm";
import {
  OPEN_STATUSES,
  type Order,
  type OrderLine,
  type OrderStatus,
  statusesInScope,
} from "~/domain/order/order";
import type {
  NewOrder,
  OrderPage,
  OrderQuery,
  OrderRepository,
  OrderWithSeller,
} from "~/domain/order/ports";
import { db } from "~/infra/dataAccess/db/connection";
import {
  customerOrderItems,
  customerOrders,
} from "~/infra/dataAccess/db/schema/orders";

interface OrderRow {
  id: string;
  checkout_id: string;
  seller_id: string;
  user_id: string;
  status: OrderStatus;
  /**
   * **Texto, no `Date`.** `db.execute` con SQL crudo entrega los `timestamptz` tal como los manda
   * el driver (`2026-08-10 01:58:42.873743+00`), mientras que el constructor de consultas de
   * drizzle sí los convierte. Declararlo `Date` era mentir: `Intl` recibía una cadena, la
   * convertía a `NaN` y `format.dateTime` reventaba con `Invalid time value` en `/pedidos` y en la
   * ficha del pedido. Se convierte al mapear, una sola vez.
   */
  created_at: string;
  total_count: number;
  seller_name: string;
  seller_slug: string | null;
  seller_phone: string;
  [key: string]: unknown;
}

interface LineRow {
  order_id: string;
  post_id: string | null;
  title: string;
  /** `numeric` sale de Postgres como texto para no perder precisión por el camino. */
  unit_price: string;
  quantity: number;
  slug: string | null;
  image_url: string | null;
  [key: string]: unknown;
}

/** `status IN (…)`: drizzle no serializa un array de JS, así que se emite un marcador por valor. */
function statusList(statuses: readonly OrderStatus[]) {
  return sql.join(
    statuses.map((status) => sql`${status}`),
    sql`, `,
  );
}

/**
 * El filtro de texto, sobre el título **congelado** del renglón.
 *
 * `ILIKE` y no full-text a propósito: la pregunta real es «¿cuándo pedí aquel pan?» sobre una lista
 * que casi siempre cabe en dos páginas, y montar `tsvector` con su índice para eso sería traer toda
 * la maquinaria del catálogo a un sitio que no la necesita. Si algún día una tienda acumula decenas
 * de miles de pedidos, esto se cambia y el resto no se entera.
 */
function matchesTerm(term: string) {
  return sql`EXISTS (
    SELECT 1 FROM customer_order_items i
    WHERE i.order_id = o.id AND i.title ILIKE ${`%${term}%`}
  )`;
}

export class PostgresOrderRepository implements OrderRepository {
  /**
   * Crea las cabeceras y sus renglones **en una transacción**.
   *
   * Un carrito de dos tiendas que grabe una y falle la otra deja al comprador creyendo que pidió
   * las dos cosas. Hoy siempre es un pedido y la transacción no se nota; el día que no lo sea, ya
   * está puesta.
   */
  async createAll(orders: readonly NewOrder[]): Promise<Order[]> {
    if (orders.length === 0) return [];

    const headers = await db.transaction(async (tx) => {
      const headers = await tx
        .insert(customerOrders)
        .values(
          orders.map((order) => ({
            checkoutId: order.checkoutId,
            sellerId: order.sellerId,
            userId: order.buyerId,
          })),
        )
        .returning();

      const items = headers.flatMap((header, index) =>
        orders[index].lines.map((line) => ({
          orderId: header.id,
          postId: line.postId,
          title: line.title,
          /* `numeric` se escribe como texto: pasar un number obliga a un redondeo de coma flotante
             justo en la columna que existe para no tenerlo. */
          unitPrice: String(line.unitPrice),
          quantity: line.quantity,
        })),
      );

      if (items.length > 0) {
        await tx.insert(customerOrderItems).values(items);
      }

      return headers;
    });

    /* Los renglones se releen **después** del commit y no se devuelven los de entrada: así el
       pedido recién creado tiene ya su slug y su miniatura, exactamente iguales a los que dará
       cualquier lectura posterior. Dentro de la transacción no se podía: `linesOf` usa `db`. */
    const linesByOrder = await this.linesOf(
      headers.map((header) => header.id),
      "es",
      "es",
    );

    return headers.map((header) => ({
      id: header.id,
      checkoutId: header.checkoutId,
      sellerId: header.sellerId,
      buyerId: header.userId,
      status: header.status,
      lines: linesByOrder.get(header.id) ?? [],
      createdAt: header.createdAt,
    }));
  }

  async listBySeller(
    sellerId: string,
    query: OrderQuery,
  ): Promise<OrderPage<Order>> {
    const page = await this.listWhere(
      sql`o.seller_id = ${sellerId}::uuid`,
      query,
    );

    return {
      total: page.total,
      orders: page.orders.map(
        ({ sellerName, sellerHandle, sellerPhone, ...order }) => order,
      ),
    };
  }

  listByBuyer(
    buyerId: string,
    query: OrderQuery,
  ): Promise<OrderPage<OrderWithSeller>> {
    return this.listWhere(sql`o.user_id = ${buyerId}`, query);
  }

  /**
   * Cuántos pedidos abiertos hay en cada papel, en **una** consulta.
   *
   * Dos `SELECT count(*)` habrían sido dos viajes para pintar dos números en unas pestañas.
   */
  async countOpen({
    sellerId,
    buyerId,
  }: {
    sellerId?: string | null;
    buyerId: string;
  }): Promise<{ received: number; placed: number }> {
    const statuses = statusList(OPEN_STATUSES);
    const raw = await db.execute(sql`
      SELECT
        count(*) FILTER (
          WHERE ${sellerId ? sql`seller_id = ${sellerId}::uuid` : sql`FALSE`}
        )::int AS received,
        count(*) FILTER (WHERE user_id = ${buyerId})::int AS placed
      FROM customer_orders
      WHERE status::text IN (${statuses})
    `);

    const row = (raw.rows as Array<{ received: number; placed: number }>)[0];

    return { received: row?.received ?? 0, placed: row?.placed ?? 0 };
  }

  async findById(
    orderId: string,
    locale: string,
    fallbackLocale: string,
  ): Promise<OrderWithSeller | null> {
    const page = await this.listWhere(sql`o.id = ${orderId}::uuid`, {
      page: 1,
      pageSize: 1,
      scope: "all",
      locale,
      fallbackLocale,
    });

    return page.orders[0] ?? null;
  }

  async findHeader(
    orderId: string,
  ): Promise<{ sellerId: string; status: OrderStatus } | null> {
    const [row] = await db
      .select({
        sellerId: customerOrders.sellerId,
        status: customerOrders.status,
      })
      .from(customerOrders)
      .where(eq(customerOrders.id, orderId))
      .limit(1);

    return row ?? null;
  }

  /**
   * Mueve el estado con las dos condiciones dentro del `WHERE`.
   *
   * `sellerId` para que el pedido de otro no se pueda tocar mandando su id, y `fromStatus` para que
   * dos pestañas abiertas no apliquen una transición calculada sobre un estado que ya cambió. Sin
   * fila devuelta, no se hizo nada — y quien llama no distingue por qué.
   */
  async updateStatus({
    orderId,
    sellerId,
    fromStatus,
    status,
  }: {
    orderId: string;
    sellerId: string;
    fromStatus: OrderStatus;
    status: OrderStatus;
  }): Promise<OrderStatus | null> {
    const [header] = await db
      .update(customerOrders)
      .set({ status, updatedAt: new Date() })
      .where(
        and(
          eq(customerOrders.id, orderId),
          eq(customerOrders.sellerId, sellerId),
          eq(customerOrders.status, fromStatus),
        ),
      )
      .returning();

    return header?.status ?? null;
  }

  /**
   * La consulta que comparten las dos listas y la ficha.
   *
   * Una sola porque solo cambian el `WHERE` de a quién pertenece y los datos de la tienda, que se
   * traen siempre: al comprador le hacen falta para decir a quién le pidió, y al vendedor le sobran
   * pero cuestan un `JOIN` sobre una fila que ya está en memoria.
   *
   * **El total viaja en la misma consulta** (`count(*) OVER ()`), no en un segundo `SELECT count`:
   * son dos viajes a la base para pintar una barra de paginación.
   */
  private async listWhere(
    owner: ReturnType<typeof sql>,
    query: OrderQuery,
  ): Promise<OrderPage<OrderWithSeller>> {
    const statuses = statusList(statusesInScope(query.scope));
    const term = query.term?.trim();
    const offset = Math.max(0, (query.page - 1) * query.pageSize);

    const raw = await db.execute(sql`
      SELECT
        o.id, o.checkout_id, o.seller_id, o.user_id, o.status, o.created_at,
        s.name AS seller_name, s.slug AS seller_slug, s.phone AS seller_phone,
        count(*) OVER ()::int AS total_count
      FROM customer_orders o
      JOIN sellers s ON s.id = o.seller_id
      WHERE ${owner}
        AND o.status::text IN (${statuses})
        ${term ? sql`AND ${matchesTerm(term)}` : sql``}
      ORDER BY o.created_at DESC
      LIMIT ${query.pageSize} OFFSET ${offset}
    `);

    const rows = raw.rows as OrderRow[];
    const linesByOrder = await this.linesOf(
      rows.map((row) => row.id),
      query.locale,
      query.fallbackLocale,
    );

    return {
      total: rows[0]?.total_count ?? 0,
      orders: rows.map((row) => ({
        id: row.id,
        checkoutId: row.checkout_id,
        sellerId: row.seller_id,
        buyerId: row.user_id,
        status: row.status,
        lines: linesByOrder.get(row.id) ?? [],
        createdAt: new Date(row.created_at),
        sellerName: row.seller_name,
        sellerHandle: row.seller_slug,
        sellerPhone: row.seller_phone,
      })),
    };
  }

  /**
   * Los renglones de varios pedidos de una vez, con su enlace y su miniatura **de hoy**.
   *
   * Los dos `LEFT JOIN LATERAL` son los que hacen que un producto borrado no rompa nada: `post_id`
   * queda nulo, los laterales devuelven nulo, y el renglón se pinta con su copia del título y del
   * precio, sin foto y sin enlace. Es lo mismo que ya garantiza el `ON DELETE SET NULL`.
   *
   * Una consulta para la lista entera, no una por pedido.
   */
  private async linesOf(
    orderIds: readonly string[],
    locale: string,
    fallbackLocale: string,
  ): Promise<Map<string, OrderLine[]>> {
    const byOrder = new Map<string, OrderLine[]>();

    if (orderIds.length === 0) return byOrder;

    const ids = sql.join(
      orderIds.map((id) => sql`${id}::uuid`),
      sql`, `,
    );

    const raw = await db.execute(sql`
      SELECT
        i.order_id, i.post_id, i.title, i.unit_price::text, i.quantity,
        t.slug, m.url AS image_url
      FROM customer_order_items i
      LEFT JOIN LATERAL (
        SELECT slug
        FROM post_translations
        WHERE post_id = i.post_id
        ORDER BY (locale = ${locale}) DESC, (locale = ${fallbackLocale}) DESC
        LIMIT 1
      ) t ON TRUE
      LEFT JOIN LATERAL (
        SELECT url
        FROM post_media
        WHERE post_id = i.post_id
        ORDER BY sort_order
        LIMIT 1
      ) m ON TRUE
      WHERE i.order_id IN (${ids})
      ORDER BY i.title
    `);

    for (const row of raw.rows as LineRow[]) {
      const lines = byOrder.get(row.order_id) ?? [];

      lines.push({
        postId: row.post_id,
        title: row.title,
        unitPrice: Number(row.unit_price),
        quantity: row.quantity,
        slug: row.slug,
        imageUrl: row.image_url,
      });

      byOrder.set(row.order_id, lines);
    }

    return byOrder;
  }
}
