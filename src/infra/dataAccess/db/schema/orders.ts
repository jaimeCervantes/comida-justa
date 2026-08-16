import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./auth";
import { posts } from "./posts";
import { sellers } from "./sellers";

/**
 * El enum que ya existe en la base desde que el bot creó su tabla `orders`.
 *
 * Se declara para tipar, **no para crearlo**: como todo este directorio, es un espejo de lo que
 * administra Alembic. El sitio solo transita `PENDING → CONFIRMED → PREPARING → DELIVERED`, con
 * `CANCELLED` desde cualquier punto menos el último; `DRAFT` es del carrito del bot y `PAID` espera
 * al pago en línea. Qué transición vale lo decide `src/domain/order/order.ts`.
 */
export const orderStatus = pgEnum("orderstatus", [
  "DRAFT",
  "PENDING",
  "CONFIRMED",
  "PAID",
  "PREPARING",
  "DELIVERED",
  "CANCELLED",
]);

/**
 * Los pedidos del sitio. Espejo de la tabla que crea Alembic (`0032`).
 *
 * **No es la tabla `orders`**, que es el carrito del bot y sigue siendo suya: allí una fila nace en
 * `DRAFT` sin vendedor y va acumulando artículos en un JSON conforme avanza la conversación de
 * WhatsApp. Aquí una fila es un pedido ya hecho, de **una** tienda.
 *
 * `checkoutId` es lo que vuelve a juntar los N pedidos nacidos de un mismo carrito. Hoy N es siempre
 * 1 porque hay una sola tienda; existe para el día que no.
 *
 * **No hay columna `total`**: se suma de los renglones, que son la única verdad. Una copia
 * denormalizada solo puede desincronizarse.
 */
export const customerOrders = pgTable(
  "customer_orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    checkoutId: uuid("checkout_id").notNull(),
    sellerId: uuid("seller_id")
      .notNull()
      .references(() => sellers.id),
    /** Quien compra. `text` porque `users.id` lo es desde la unificación para NextAuth. */
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    status: orderStatus("status").notNull().default("PENDING"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    /** Desde cuándo está como está: es lo que el vendedor necesita ver en su panel. */
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("ix_customer_orders_seller").on(
      table.sellerId,
      table.createdAt.desc(),
    ),
    index("ix_customer_orders_user").on(table.userId, table.createdAt.desc()),
    index("ix_customer_orders_checkout").on(table.checkoutId),
  ],
);

/**
 * Los renglones, con el precio **congelado**.
 *
 * `title` y `unitPrice` son copias del momento en que se pidió, no referencias a la publicación: si
 * el vendedor sube el precio mañana, el pedido de ayer no cambia.
 *
 * Por eso `postId` es **nulo con `ON DELETE SET NULL`**. Si la publicación desaparece, el renglón no
 * se va con ella —ya dice qué se vendió y a cuánto—, y el histórico no bloquea para siempre el
 * borrado de un producto que alguien pidió una vez.
 */
export const customerOrderItems = pgTable(
  "customer_order_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => customerOrders.id, { onDelete: "cascade" }),
    postId: text("post_id").references(() => posts.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    /** `numeric` como `posts.price`: el dinero no se guarda en flotante. */
    unitPrice: numeric("unit_price").notNull(),
    quantity: integer("quantity").notNull(),
  },
  (table) => [
    index("ix_customer_order_items_order").on(table.orderId),
    check("customer_order_items_quantity_positive", sql`${table.quantity} > 0`),
    check(
      "customer_order_items_price_not_negative",
      sql`${table.unitPrice} >= 0`,
    ),
  ],
);

/**
 * Por dónde pasó un pedido. Espejo de la tabla que crea Alembic (`0039`).
 *
 * **Sólo transiciones, no nacimientos.** `customerOrders.createdAt` ya es «cuándo pasó a
 * `PENDING`», así que una fila que lo repitiera sería una copia denormalizada — el mismo motivo por
 * el que no hay columna `total`. De ahí que `fromStatus` sea `NOT NULL`: una fila de aquí siempre
 * significa lo mismo, un cambio de A a B.
 *
 * La tabla **no se rellenó hacia atrás**. De los pedidos anteriores a la migración se sabe cuándo se
 * hicieron y cuándo entraron a su estado actual (`updatedAt`), que para un entregado es exactamente
 * la fecha de entrega; lo que no tendrán nunca es el tramo intermedio, porque nadie lo registró.
 */
export const customerOrderStatusChanges = pgTable(
  "customer_order_status_changes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => customerOrders.id, { onDelete: "cascade" }),
    fromStatus: orderStatus("from_status").notNull(),
    toStatus: orderStatus("to_status").notNull(),
    changedAt: timestamp("changed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    /**
     * Quién lo movió. Nulo cuando no hay una persona detrás —el pago, el bot—, y por eso la FK va
     * con `ON DELETE SET NULL`: el histórico no puede bloquear el borrado de una cuenta.
     */
    changedBy: text("changed_by").references(() => users.id, {
      onDelete: "set null",
    }),
  },
  (table) => [
    index("ix_customer_order_status_changes_order").on(
      table.orderId,
      table.changedAt,
    ),
    check(
      "customer_order_status_changes_actually_changes",
      sql`${table.fromStatus} <> ${table.toStatus}`,
    ),
  ],
);
