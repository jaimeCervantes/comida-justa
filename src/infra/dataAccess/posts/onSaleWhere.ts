import { type SQL, sql } from "drizzle-orm";

/**
 * La vigencia de `isPromotionActive` (`domain/entities/post/promotion.ts`), escrita en SQL para
 * poder filtrar y paginar en la base. Las dos tienen que decir lo mismo: si una cambia, cambia la
 * otra. `now()` es la hora de la consulta, igual que el `new Date()` con el que pinta la tarjeta.
 *
 * Además, **solo lo que tiene piezas registradas**, la misma regla que `canBeAdvertised` en el
 * carrusel: ni lo que el vendedor marcó como agotado ni lo que no lleva inventario (`stock_quantity`
 * nulo) o lo tiene en cero. Así «Ver ofertas» lleva a la misma lista que anuncia el banner. Lo decidió
 * el usuario el 2026-10-22; un servicio no sale, porque no se cuenta en piezas.
 *
 * `sale_price IS NOT NULL` va primero porque es la condición del índice parcial
 * `posts_on_sale_idx`.
 */
export function onSaleWhere(onSale: boolean | undefined): SQL {
  if (!onSale) return sql`TRUE`;

  return sql`(p.sale_price IS NOT NULL
    AND p.sale_price > 0
    AND p.sale_price < p.price
    AND (p.sale_ends_at IS NULL OR p.sale_ends_at > now())
    AND p.is_available
    AND p.stock_quantity IS NOT NULL
    AND p.stock_quantity > 0)`;
}
