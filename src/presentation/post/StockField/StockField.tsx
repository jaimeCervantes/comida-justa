"use client";
import { useTranslations } from "next-intl";
import { MdOutlineInventory2 } from "react-icons/md";
import { TextField } from "~/presentation/design_system/forms/TextField";

/**
 * Las existencias de un producto, iguales al publicar y al editar.
 *
 * Solo se monta en un producto (`canTrackStock`): un servicio no se cuenta en piezas. **Vacío es
 * «no llevo inventario»**, no cero; con un número, el inventario manda sobre «agotado». La regla vive
 * en `domain/entities/post/stock.ts`; aquí solo se pregunta, y se avisa de lo que cuesta no contar:
 * sin piezas registradas, el producto no sale en las ofertas.
 */
export default function StockField({
  stockQuantity,
  error,
}: {
  stockQuantity?: number | null;
  error?: string | null;
}) {
  const t = useTranslations("publish");
  /* El navegador frena un negativo o un decimal antes de enviar (`min`, `step`): la frase es la
     misma que devuelve el servidor, porque la regla es una sola (`parseStockField`). */
  const invalid = t("errorStockInvalid");

  return (
    <div className="mb-6">
      <TextField
        name="stockQuantity"
        type="number"
        inputMode="numeric"
        min="0"
        step="1"
        label={t("stockQuantity")}
        defaultValue={stockQuantity ?? ""}
        icon={<MdOutlineInventory2 />}
        error={error}
        validationMessages={{
          rangeUnderflow: invalid,
          stepMismatch: invalid,
          badInput: invalid,
        }}
      />
      <p className="text-label text-text-support">{t("stockHint")}</p>
    </div>
  );
}
