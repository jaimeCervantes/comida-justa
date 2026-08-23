import { useLocale } from "next-intl";
import { FORMATTING_LOCALE } from "~/i18n/formattingLocale";
import { resolveLocale } from "~/i18n/routing";
import { cn } from "~/presentation/design_system/styling/merge-class-names";

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
  showZero = false,
  className,
}: {
  value: number;
  currency?: string;
  /**
   * Pintar el cero en vez de callarse.
   *
   * Por omisión un importe vacío **no se pinta**: un anuncio no tiene precio, y «$0.00» debajo de
   * su título diría que es gratis. Pero hay un sitio donde el cero es el dato: el renglón agotado
   * del carrito, que el 5.14 pide dejar «en cero» y no en blanco — un hueco vacío se lee como
   * «falta un dato», y un `$0` dice que se contó y no sumó.
   *
   * Va como opción y no como cambio de la regla porque los dos casos son ciertos, y quien llama es
   * quien sabe cuál es el suyo.
   */
  showZero?: boolean;
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
  /* Con `cn` y no concatenando: encadenar dejaba dos tamaños de fuente en el `class` y el que
     ganaba lo decidía el orden del CSS, no el de quien llama. Así un override es deliberado. */
  const clsName = cn("font-display text-heading-sm text-text-base", className);

  if (Boolean(value) === false && !showZero) {
    return null;
  }

  const formatted = new Intl.NumberFormat(FORMATTING_LOCALE[locale], {
    style: "currency",
    currency,
  }).format(Number(value));

  return <span className={clsName}>{formatted}</span>;
}
