import { getTranslations } from "next-intl/server";
import { carriesInventory } from "~/domain/entities/post/stock";
import { Link } from "~/i18n/navigation";
import { SITE_CURRENCY } from "~/infra/constants";
import type { InventoryItem } from "~/infra/dataAccess/storeInventory/IStoreInventoryRepository";
import CurrencyAmount from "~/presentation/money/CurrencyAmount";
import SoldOutBadge from "~/presentation/post/SoldOutBadge/SoldOutBadge";
import StockControl from "~/presentation/post/StockControl/StockControl";
import { setStock } from "~/presentation/post/stockAction";

const CELL = "px-3 py-3 align-top";

/**
 * El inventario de la tienda, un renglón por producto.
 *
 * **El campo es el mismo `StockControl` de la ficha**, en su variante compacta. Escribir aquí un
 * segundo campo de existencias habría sido tener dos sitios donde arreglar la misma regla, y dos
 * formas de que el número se guarde distinto según por dónde entres.
 *
 * **Envuelta en su propio `overflow-x`**: son cuatro columnas y la del producto lleva títulos
 * largos de verdad ("Barra de Proteína Vegana sabor Chocolate Amargo — Pieza individual"). Sin el
 * contenedor, la tabla empuja el ancho de la página y se desplaza el sitio entero, que es lo que ya
 * le pasó a las pestañas de `/pedidos` a 390 px.
 */
export default async function InventoryTable({
  items,
}: {
  items: InventoryItem[];
}) {
  const t = await getTranslations("account");

  return (
    <div className="overflow-x-auto" data-testid="inventory-table">
      <table className="w-full min-w-[32rem] border-collapse text-sm">
        <thead>
          <tr className="border-b border-separator text-left text-label text-text-support">
            <th className={CELL}>{t("inventoryProduct")}</th>
            <th className={CELL}>{t("inventoryStock")}</th>
          </tr>
        </thead>

        <tbody>
          {items.map((item) => (
            <tr
              key={item.id}
              className="border-b border-separator"
              data-testid="inventory-row"
            >
              <td className={CELL}>
                <Link
                  href={{ pathname: "/[slug]", params: { slug: item.slug } }}
                  className="focus-ring font-medium text-text-base hover:text-highlight"
                >
                  {item.title}
                </Link>

                <span className="mt-1 flex flex-wrap items-center gap-2">
                  <CurrencyAmount value={item.price} currency={SITE_CURRENCY} />
                  <SoldOutBadge
                    kind="producto"
                    isAvailable={item.isAvailable}
                  />
                  {/* Que nadie lleve la cuenta es un estado, y hay que poder verlo de un vistazo:
                      es la diferencia entre "no queda ninguna" y "no lo sé". */}
                  {carriesInventory(item) ? null : (
                    <span
                      className="text-label text-text-support"
                      data-testid="inventory-untracked"
                    >
                      {t("inventoryUntracked")}
                    </span>
                  )}
                </span>
              </td>

              <td className={CELL}>
                <StockControl
                  action={setStock}
                  postId={item.id}
                  slug={item.slug}
                  kind="producto"
                  stockQuantity={item.stockQuantity}
                  compact
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
