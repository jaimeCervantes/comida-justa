import type { PromotionError } from "~/domain/entities/post/promotion";

/**
 * El error de la promoción, puesto junto al campo que lo causó y en el idioma de quien publica.
 * Lo usan publicar y editar; el validador del dominio repite la regla para quien no pase por aquí.
 */
export function promotionFieldErrors(
  error: PromotionError | null,
  t: (key: "errorSaleNotBelowPrice" | "errorSaleEndsWithoutPrice") => string,
): { salePrice: string | null; saleEndsAt: string | null } {
  return {
    salePrice:
      error === "sale-price-not-below-price" || error === "invalid-sale-price"
        ? t("errorSaleNotBelowPrice")
        : null,
    saleEndsAt:
      error === "sale-ends-without-sale-price" || error === "invalid-sale-end"
        ? t("errorSaleEndsWithoutPrice")
        : null,
  };
}
