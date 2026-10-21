/**
 * Una rebaja temporal del precio de cualquier publicación que se cobra —producto o servicio—, de
 * cualquier giro. No sabe de comida: es un precio rebajado y, si se quiere, cuándo se acaba.
 *
 * **Nadie apaga una promoción.** Se decide al leer, contra la hora de ese momento: pasada la fecha
 * de fin, simplemente deja de aplicar. Así no hay un proceso que se pueda caer y dejar una oferta
 * vencida anunciada —ni cobrada.
 */
export type PromotionFields = {
  /** `posts.price`: el precio normal. */
  price?: number | null;
  /** `posts.sale_price`. Nulo = sin promoción. */
  salePrice?: number | null;
  /** `posts.sale_ends_at`. Nulo = dura hasta que se quite. */
  saleEndsAt?: Date | string | null;
};

export type PromotionError =
  /** Rebaja que no es un número mayor a cero. */
  | "invalid-sale-price"
  /** Rebaja igual o mayor al precio normal: no es rebaja, y tachar un precio menor engaña. */
  | "sale-price-not-below-price"
  /** Fecha de fin sin rebaja: no hay nada que termine. */
  | "sale-ends-without-sale-price"
  | "invalid-sale-end";

/** El precio que se enseña y se cobra hoy, y el normal para tacharlo si hay promoción. */
export type CurrentPrice = {
  price: number;
  /** El normal, solo cuando la promoción está vigente. Nulo = no hay nada que tachar. */
  regularPrice: number | null;
  /** Cuánto se ahorra, en entero redondeado (`17` para 180 → 150). Nulo sin promoción. */
  discountPercent: number | null;
  /** Hasta cuándo, si la promoción vigente tiene fecha de fin. */
  endsAt: Date | null;
};

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function isPositiveNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

/**
 * ¿Se aplica la rebaja ahora?
 *
 * Además de la fecha, exige que la rebaja siga siendo menor al precio: la base lo garantiza, pero
 * si algún día no, cobrar el precio normal es el error que no le cuesta al comprador.
 */
export function isPromotionActive(fields: PromotionFields, now: Date): boolean {
  if (!isPositiveNumber(fields.price) || !isPositiveNumber(fields.salePrice)) {
    return false;
  }
  if (fields.salePrice >= fields.price) return false;

  const endsAt = toDate(fields.saleEndsAt);

  return endsAt === null || now < endsAt;
}

/** Requiere un precio normal: una publicación sin precio no tiene nada que rebajar. */
export function currentPrice(
  fields: PromotionFields & { price: number },
  now: Date,
): CurrentPrice {
  if (!isPromotionActive(fields, now)) {
    return {
      price: fields.price,
      regularPrice: null,
      discountPercent: null,
      endsAt: null,
    };
  }

  const salePrice = fields.salePrice as number;

  return {
    price: salePrice,
    regularPrice: fields.price,
    discountPercent: Math.round((1 - salePrice / fields.price) * 100),
    endsAt: toDate(fields.saleEndsAt),
  };
}

/**
 * La forma de los datos, sin la hora: una fecha de fin ya pasada se acepta —es quitarla por las
 * buenas— y simplemente no aplica.
 */
export function validatePromotion(
  fields: PromotionFields,
): PromotionError | null {
  const hasSalePrice =
    fields.salePrice !== null && fields.salePrice !== undefined;
  const hasEnd = fields.saleEndsAt !== null && fields.saleEndsAt !== undefined;

  if (!hasSalePrice) {
    return hasEnd && fields.saleEndsAt !== ""
      ? "sale-ends-without-sale-price"
      : null;
  }

  if (!isPositiveNumber(fields.salePrice)) return "invalid-sale-price";

  if (!isPositiveNumber(fields.price) || fields.salePrice >= fields.price) {
    return "sale-price-not-below-price";
  }

  if (hasEnd && fields.saleEndsAt !== "" && !toDate(fields.saleEndsAt)) {
    return "invalid-sale-end";
  }

  return null;
}

/**
 * ¿Sigue siendo rebaja si el precio normal cambia a `newPrice`?
 *
 * Lo pregunta quien cambia el precio sin pasar por el formulario —el importador del catálogo del
 * proveedor—. La base exige `sale_price < price` aunque la promoción ya haya vencido, así que aquí
 * no se mira la fecha: una rebaja que deja de ser menor al precio nuevo se quita junto con el cambio,
 * o el `UPDATE` falla. Quitarla es lo honesto: el comprador paga el precio nuevo, que ya es menor.
 */
export function promotionSurvivesPrice(
  salePrice: number | null | undefined,
  newPrice: number,
): boolean {
  if (salePrice === null || salePrice === undefined) return true;

  return salePrice < newPrice;
}

/**
 * Lo que escribió una persona en el campo del precio de promoción.
 *
 * Vacío es «sin promoción», no un error: borrar el campo es la forma de quitarla. Cualquier otra
 * cosa se devuelve como número —aunque sea cero, negativo o `NaN`— para que `validatePromotion` la
 * rechace en vez de que se pierda en silencio.
 */
export function readSalePrice(raw: unknown): number | null {
  if (typeof raw !== "string" || raw.trim() === "") return null;

  return Number(raw);
}

/**
 * El parámetro de la dirección que deja un listado solo con lo que está en promoción
 * (`/productos?promocion=1`). Vive en la dirección y no en un estado de la pantalla para que el
 * filtro se comparta, se guarde y vuelva con el botón de atrás.
 */
export const ON_SALE_QUERY_PARAM = "promocion";

/** Solo `"1"` enciende el filtro: cualquier otra cosa es el listado completo, no un error. */
export function parseOnSaleFilter(value: unknown): boolean {
  return value === "1";
}
