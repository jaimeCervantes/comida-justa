import { useLocale } from "next-intl";
import { FORMATTING_LOCALE } from "~/i18n/formattingLocale";
import { resolveLocale } from "~/i18n/routing";

/**
 * Un importe con su moneda.
 *
 * El idioma sale de la ruta y no de un `locale` recibido a mano: los dos sitios que lo pintaban le
 * pasaban `"es-MX"` fijo, así que el precio seguía escrito a la mexicana en la versión en inglés.
 * La **moneda** sí se recibe, y por omisión es MXN: lo que se vende aquí se cobra en pesos, hable
 * el idioma que hable quien mira.
 *
 * Formatea con `Intl` y `FORMATTING_LOCALE`, no con `useFormatter`, porque el formateador de
 * next-intl usa el locale del routing —`"es"` a secas— y `Intl` lo lee como español de España:
 * escribía `35,00 MXN` donde debía decir `$35.00`.
 */
export default function AmountCurrency({
  value,
  currency = "MXN",
  className,
}: {
  value: number;
  currency?: string;
  className?: string;
}) {
  const locale = resolveLocale(useLocale());

  /**
   * El precio va en la serif, y en tinta.
   *
   * Es el uso más repetido de la voz de portada en todo el sistema de diseño —51 apariciones de
   * Newsreader, y la mayoría son cifras— porque un precio es un dato que se lee, no una acción que
   * se pulsa. En serif se distingue del resto de la tarjeta sin necesitar color.
   *
   * Por eso deja de ir en verde de acento: el verde es de lo que lleva a algún sitio (enlaces,
   * botones), y un precio no lleva a ningún sitio. Cuando todo lo importante es verde, el verde
   * deja de señalar nada.
   */
  const clsName =
    `font-display text-heading-sm text-text-base ${className ?? ""}`.trim();

  if (Boolean(value) === false) {
    return null;
  }

  const formatted = new Intl.NumberFormat(FORMATTING_LOCALE[locale], {
    style: "currency",
    currency,
  }).format(Number(value));

  return <span className={clsName}>{formatted}</span>;
}
