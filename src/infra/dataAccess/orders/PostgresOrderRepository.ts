import { and, eq, sql } from "drizzle-orm";
import {
  OPEN_STATUSES,
  type Order,
  type OrderLine,
  type OrderStatus,
  type OrderStatusChange,
  statusesInScope,
} from "~/domain/order/order";
import type {
  NewOrder,
  OrderPage,
  OrderQuery,
  OrderRepository,
  OrderWithBuyer,
  OrderWithParties,
  OrderWithSeller,
} from "~/domain/order/ports";
import { db } from "~/infra/dataAccess/db/connection";
import {
  customerOrderItems,
  customerOrderStatusChanges,
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
  /** Texto por lo mismo que `created_at`, y se convierte al mapear. */
  updated_at: string;
  total_count: number;
  seller_name: string;
  seller_slug: string | null;
  seller_phone: string;
  /** Las tres columnas del comprador son nulas en la base; no se rellenan al leer. */
  buyer_name: string | null;
  buyer_username: string | null;
  buyer_image: string | null;
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

/**
 * Cuántos pedidos como mucho se leen de una compra.
 *
 * No es paginación: es un techo, para que la consulta de una ficha no pueda crecer sin límite si
 * algún día un carrito se reparte entre muchas tiendas. Con las dos de hoy sobra de largo.
 */
const CHECKOUT_MAX_ORDERS = 20;

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
      updatedAt: header.updatedAt,
    }));
  }

  /* Cada lista se queda con la mitad que le sirve. No es ahorro de bytes —las dos filas ya vinieron
     en la misma consulta— sino de tipos: así la pantalla del vendedor no puede pintar por descuido
     el teléfono de su propia tienda donde va quien le pidió. */
  async listBySeller(
    sellerId: string,
    query: OrderQuery,
  ): Promise<OrderPage<OrderWithBuyer>> {
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

  async listByBuyer(
    buyerId: string,
    query: OrderQuery,
  ): Promise<OrderPage<OrderWithSeller>> {
    const page = await this.listWhere(sql`o.user_id = ${buyerId}`, query);

    return {
      total: page.total,
      orders: page.orders.map(
        ({ buyerName, buyerHandle, buyerImage, ...order }) => order,
      ),
    };
  }

  /**
   * Los pedidos de una misma compra, del más viejo al más nuevo.
   *
   * **En orden de confirmación** y no descendente como las listas: aquí no se busca lo último sino
   * que se lee una compra entera, y se lee en el orden en que se hizo.
   *
   * El `user_id` viaja en el `WHERE` junto al checkout: un `checkout_id` es un uuid que aparece en
   * la ficha del pedido, y sin esa condición el vendedor que la abre vería a qué otras tiendas le
   * compró su cliente en ese mismo carrito.
   */
  async listByCheckout({
    checkoutId,
    buyerId,
    locale,
    fallbackLocale,
  }: {
    checkoutId: string;
    buyerId: string;
    locale: string;
    fallbackLocale: string;
  }): Promise<OrderWithSeller[]> {
    const page = await this.listWhere(
      sql`o.checkout_id = ${checkoutId}::uuid AND o.user_id = ${buyerId}`,
      {
        page: 1,
        pageSize: CHECKOUT_MAX_ORDERS,
        scope: "all",
        locale,
        fallbackLocale,
      },
      sql`o.created_at ASC`,
    );

    return page.orders;
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
  ): Promise<OrderWithParties | null> {
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
   *
   * **El paso se registra en la misma transacción que el `UPDATE`.** Las dos escrituras son una
   * sola cosa: un pedido que cambia de estado sin dejar constancia de cuándo es exactamente el
   * defecto que el slice 8 vino a arreglar, y si la constancia se escribiera fuera de la
   * transacción podría faltar por un fallo a mitad. Y como el `UPDATE` sólo toca fila cuando el
   * cambio es real, el intento de la segunda pestaña no escribe historia de algo que no pasó.
   */
  async updateStatus({
    orderId,
    sellerId,
    fromStatus,
    status,
    changedBy,
  }: {
    orderId: string;
    sellerId: string;
    fromStatus: OrderStatus;
    status: OrderStatus;
    changedBy?: string | null;
  }): Promise<OrderStatus | null> {
    return db.transaction(async (tx) => {
      const [header] = await tx
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

      if (!header) return null;

      await tx.insert(customerOrderStatusChanges).values({
        orderId,
        fromStatus,
        toStatus: status,
        /* `changedAt` lo pone la base con su `now()`, no el proceso de Node: el reloj de la base es
           el mismo para todos los pasos y `created_at`/`updated_at` ya salen de ahí. Mezclar dos
           relojes en una línea de tiempo es cómo se acaba viendo un paso "antes" del anterior. */
        changedBy: changedBy ?? null,
      });

      return header.status;
    });
  }

  /**
   * El recorrido de un pedido, del primer paso al último.
   *
   * Vacío para los pedidos anteriores a la migración, y eso **es** la respuesta correcta: nadie
   * registró sus pasos y rellenarlos ahora sería inventarlos.
   */
  async historyOf(orderId: string): Promise<OrderStatusChange[]> {
    const rows = await db
      .select({
        from: customerOrderStatusChanges.fromStatus,
        to: customerOrderStatusChanges.toStatus,
        at: customerOrderStatusChanges.changedAt,
      })
      .from(customerOrderStatusChanges)
      .where(eq(customerOrderStatusChanges.orderId, orderId))
      .orderBy(customerOrderStatusChanges.changedAt);

    return rows;
  }

  /**
   * La consulta que comparten las dos listas y la ficha.
   *
   * Una sola porque solo cambia el `WHERE` de a quién pertenece: **las dos partes se traen
   * siempre**. Al comprador le hace falta la tienda para decir a quién le pidió, y al vendedor le
   * hace falta el comprador para saber a quién le prepara; cada uno sobra en la lista del otro, y
   * cuesta un `JOIN` sobre una fila que ya está en memoria. Partir la consulta en dos para ahorrarse
   * eso habría sido dos consultas que mantener sincronizadas.
   *
   * **El total viaja en la misma consulta** (`count(*) OVER ()`), no en un segundo `SELECT count`:
   * son dos viajes a la base para pintar una barra de paginación.
   */
  private async listWhere(
    owner: ReturnType<typeof sql>,
    query: OrderQuery,
    order: ReturnType<typeof sql> = sql`o.created_at DESC`,
  ): Promise<OrderPage<OrderWithParties>> {
    const statuses = statusList(statusesInScope(query.scope));
    const term = query.term?.trim();
    const offset = Math.max(0, (query.page - 1) * query.pageSize);

    const raw = await db.execute(sql`
      SELECT
        o.id, o.checkout_id, o.seller_id, o.user_id, o.status, o.created_at, o.updated_at,
        s.name AS seller_name, s.slug AS seller_slug, s.phone AS seller_phone,
        u.name AS buyer_name, u.username AS buyer_username, u.image AS buyer_image,
        count(*) OVER ()::int AS total_count
      FROM customer_orders o
      JOIN sellers s ON s.id = o.seller_id
      /* JOIN y no LEFT JOIN: customer_orders.user_id es NOT NULL y apunta a users, así que un
         pedido sin comprador no existe. Con LEFT, la consulta admitiría una fila que la base ya
         impide, y escondería el día que dejara de impedirla. */
      JOIN users u ON u.id = o.user_id
      WHERE ${owner}
        AND o.status::text IN (${statuses})
        ${term ? sql`AND ${matchesTerm(term)}` : sql``}
      ORDER BY ${order}
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
        updatedAt: new Date(row.updated_at),
        sellerName: row.seller_name,
        sellerHandle: row.seller_slug,
        sellerPhone: row.seller_phone,
        buyerName: row.buyer_name,
        buyerHandle: row.buyer_username,
        buyerImage: row.buyer_image,
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
