import { useTranslations } from "next-intl";
import { canTrackStock, carriesInventory } from "~/domain/entities/post/stock";
import { Badge } from "~/presentation/design_system/badges/Badge";

/**
 * Cuántas unidades quedan, cuando alguien las está contando.
 *
 * Se calla en tres casos, y los tres significan cosas distintas: en lo que no se cuenta por piezas
 * (un servicio, un evento, un anuncio), en lo que **no lleva inventario** —las 432 publicaciones
 * que había al migrar, donde `null` significa que nadie lleva la cuenta y no que queden cero— y en
 * el cero, que ya lo dice `SoldOutBadge` con la palabra correcta. Decir "quedan 0 unidades" al lado
 * de "Agotado" es la misma frase dos veces.
 *
 * La regla de cuándo aplica vive en el dominio; aquí sólo queda el rótulo.
 */
export default function StockRemaining({
  kind,
  stockQuantity,
}: {
  kind?: string | null;
  stockQuantity?: number | null;
}) {
  const t = useTranslations("post");

  if (!canTrackStock({ kind }) || !carriesInventory({ stockQuantity })) {
    return null;
  }

  const count = stockQuantity as number;

  if (count === 0) return null;

  return (
    <Badge tone="brand" data-testid="stock-remaining">
      {t("stockRemaining", { count })}
    </Badge>
  );
}
