import { and, desc, eq, inArray } from "drizzle-orm";
import type { Order, OrderLine, OrderStatus } from "~/domain/order/order";
import type {
  NewOrder,
  OrderRepository,
  OrderWithSeller,
} from "~/domain/order/ports";
import { db } from "~/infra/dataAccess/db/connection";
import {
  customerOrderItems,
  customerOrders,
} from "~/infra/dataAccess/db/schema/orders";
import { sellers } from "~/infra/dataAccess/db/schema/sellers";

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

    return db.transaction(async (tx) => {
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

      return headers.map((header, index) => ({
        id: header.id,
        checkoutId: header.checkoutId,
        sellerId: header.sellerId,
        buyerId: header.userId,
        status: header.status,
        lines: orders[index].lines,
        createdAt: header.createdAt,
      }));
    });
  }

  async listBySeller(sellerId: string): Promise<Order[]> {
    const headers = await db
      .select()
      .from(customerOrders)
      .where(eq(customerOrders.sellerId, sellerId))
      .orderBy(desc(customerOrders.createdAt));

    const linesByOrder = await this.linesOf(headers.map((row) => row.id));

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

  async listByBuyer(buyerId: string): Promise<OrderWithSeller[]> {
    const headers = await db
      .select({
        order: customerOrders,
        sellerName: sellers.name,
        sellerHandle: sellers.slug,
        sellerPhone: sellers.phone,
      })
      .from(customerOrders)
      .innerJoin(sellers, eq(sellers.id, customerOrders.sellerId))
      .where(eq(customerOrders.userId, buyerId))
      .orderBy(desc(customerOrders.createdAt));

    const linesByOrder = await this.linesOf(headers.map((row) => row.order.id));

    return headers.map((row) => ({
      id: row.order.id,
      checkoutId: row.order.checkoutId,
      sellerId: row.order.sellerId,
      buyerId: row.order.userId,
      status: row.order.status,
      lines: linesByOrder.get(row.order.id) ?? [],
      createdAt: row.order.createdAt,
      sellerName: row.sellerName,
      sellerHandle: row.sellerHandle,
      sellerPhone: row.sellerPhone,
    }));
  }

  async findById(orderId: string): Promise<OrderWithSeller | null> {
    const [row] = await db
      .select({
        order: customerOrders,
        sellerName: sellers.name,
        sellerHandle: sellers.slug,
        sellerPhone: sellers.phone,
      })
      .from(customerOrders)
      .innerJoin(sellers, eq(sellers.id, customerOrders.sellerId))
      .where(eq(customerOrders.id, orderId))
      .limit(1);

    if (!row) return null;

    const linesByOrder = await this.linesOf([row.order.id]);

    return {
      id: row.order.id,
      checkoutId: row.order.checkoutId,
      sellerId: row.order.sellerId,
      buyerId: row.order.userId,
      status: row.order.status,
      lines: linesByOrder.get(row.order.id) ?? [],
      createdAt: row.order.createdAt,
      sellerName: row.sellerName,
      sellerHandle: row.sellerHandle,
      sellerPhone: row.sellerPhone,
    };
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
  }): Promise<Order | null> {
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

    if (!header) return null;

    const linesByOrder = await this.linesOf([header.id]);

    return {
      id: header.id,
      checkoutId: header.checkoutId,
      sellerId: header.sellerId,
      buyerId: header.userId,
      status: header.status,
      lines: linesByOrder.get(header.id) ?? [],
      createdAt: header.createdAt,
    };
  }

  /** Los renglones de varios pedidos de una vez: una consulta para la lista entera, no una por fila. */
  private async linesOf(
    orderIds: readonly string[],
  ): Promise<Map<string, OrderLine[]>> {
    const byOrder = new Map<string, OrderLine[]>();

    if (orderIds.length === 0) return byOrder;

    const rows = await db
      .select()
      .from(customerOrderItems)
      .where(inArray(customerOrderItems.orderId, [...orderIds]))
      .orderBy(customerOrderItems.title);

    for (const row of rows) {
      const lines = byOrder.get(row.orderId) ?? [];

      lines.push({
        /* `post_id` es nulo cuando la publicación se borró. El renglón sobrevive con su copia del
           título y del precio, que es justo para lo que se guardaron. */
        postId: row.postId ?? "",
        title: row.title,
        unitPrice: Number(row.unitPrice),
        quantity: row.quantity,
      });

      byOrder.set(row.orderId, lines);
    }

    return byOrder;
  }
}
