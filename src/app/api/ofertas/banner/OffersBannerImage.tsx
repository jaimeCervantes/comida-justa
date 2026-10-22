import type { BannerPromotion } from "~/domain/entities/post/promotionBanner";

/**
 * Las formas en que se dibuja el banner, que ocupa el lugar del hero cuando hay ofertas.
 *
 * - `ancho`: escritorio (desde 1024 px). El texto a la izquierda y los productos flotando a la
 *   derecha, como el carrusel de inicio de un marketplace.
 * - `compacto`: el teléfono. El texto arriba y hasta tres productos abajo: cuatro en una fila de
 *   teléfono dejaban los precios ilegibles.
 *
 * `background` es el arte de fondo de `src/assets/banners/`, generado una vez con IA por
 * `scripts/generateOffersBannerBackgrounds.ts`. Solo el fondo: los productos y las cifras salen de
 * la base.
 */
export const BANNER_FORMATS = {
  ancho: {
    width: 1600,
    height: 520,
    layout: "row",
    maxProducts: 4,
    background: "fondo-ancho.jpg",
  },
  compacto: {
    width: 1080,
    height: 810,
    layout: "stack",
    maxProducts: 3,
    background: "fondo-compacto.jpg",
  },
} as const;

export type BannerFormat = keyof typeof BANNER_FORMATS;

/**
 * La versión del dibujo. **Súbela cada vez que cambie cómo se ve el banner** (colores, tamaños,
 * textos, formatos).
 *
 * La imagen se guarda para siempre en el navegador y en la CDN, porque su dirección lleva la huella
 * de lo que pinta. Pero la huella solo mira los datos: sin esta versión, un banner rediseñado
 * seguiría sirviéndose con el dibujo viejo a quien ya lo tuviera guardado.
 */
const BANNER_DESIGN_VERSION = "3";

/** Lo que va en `v=` de la dirección: la versión del dibujo y la huella de lo que se pinta. */
export function bannerVersion(fingerprint: string): string {
  return `${BANNER_DESIGN_VERSION}.${fingerprint}`;
}

export function isBannerFormat(value: unknown): value is BannerFormat {
  return typeof value === "string" && Object.hasOwn(BANNER_FORMATS, value);
}

/* Satori no lee las variables CSS del sitio: los valores son los de
   `design_system/tokens/colors.css` (verde de marca 700 y 900, barro 600, crema). */
const GREEN = "#3f6f2a";
const DEEP_GREEN = "#2f5320";
const CLAY = "#dd340d";
const CREAM = "#fdf3e4";
const INK = "#1b1e18";
const MUTED = "#76746c";
const WHITE = "#ffffff";

export type BannerTile = BannerPromotion & {
  /** La foto ya lista para Satori (`data:image/png;base64,…`), recortada si era de estudio. */
  photo: string;
  /** `true` si la foto flota sin fondo; `false` si se pinta como tarjeta redondeada. */
  isCutout: boolean;
  /** Los precios ya formateados en el idioma de quien mira. */
  priceLabel: string;
  regularPriceLabel: string;
};

export type BannerTexts = {
  eyebrow: string;
  headline: string;
  subtitle: string;
  cta: string;
  discount: (percent: number) => string;
};

/**
 * Un producto: la foto flotando con su sombra, el sello del descuento y la etiqueta del precio.
 */
function Product({
  tile,
  width,
  photoHeight,
  texts,
}: {
  tile: BannerTile;
  width: number;
  photoHeight: number;
  texts: BannerTexts;
}) {
  const sticker = Math.round(width * 0.36);

  return (
    <div
      style={{
        width,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div
        style={{
          width,
          height: photoHeight,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {/* La sombra en el piso: una elipse difusa, que es lo que hace que el producto flote en vez
            de verse pegado. Satori no tiene `filter: blur`, pero sí degradados radiales. */}
        <div
          style={{
            position: "absolute",
            bottom: -10,
            left: width * 0.12,
            width: width * 0.76,
            height: 34,
            borderRadius: 999,
            backgroundImage:
              "radial-gradient(closest-side, rgba(0, 0, 0, 0.35), rgba(0, 0, 0, 0))",
          }}
        />
        {/* biome-ignore lint/performance/noImgElement: Satori dibuja con <img>; en una ImageResponse no hay next/image. */}
        <img
          src={tile.photo}
          alt=""
          width={width * 0.86}
          height={photoHeight * 0.92}
          style={{
            objectFit: "contain",
            borderRadius: tile.isCutout ? 0 : 24,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: sticker,
            height: sticker,
            borderRadius: 999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: CLAY,
            color: WHITE,
            /* «-21%» son cuatro caracteres anchos: a 0.32 del diámetro se salían del círculo. */
            fontSize: Math.round(sticker * 0.25),
            fontWeight: 800,
            letterSpacing: -1,
            border: `4px solid ${WHITE}`,
          }}
        >
          {texts.discount(tile.discountPercent)}
        </div>
      </div>

      <div
        style={{
          marginTop: 22,
          display: "flex",
          alignItems: "baseline",
          gap: 10,
          padding: "10px 20px",
          borderRadius: 999,
          backgroundColor: WHITE,
          boxShadow: "0 6px 18px rgba(0, 0, 0, 0.18)",
        }}
      >
        <span style={{ fontSize: 30, fontWeight: 800, color: INK }}>
          {tile.priceLabel}
        </span>
        <span
          style={{
            fontSize: 20,
            fontWeight: 500,
            color: MUTED,
            textDecoration: "line-through",
          }}
        >
          {tile.regularPriceLabel}
        </span>
      </div>
    </div>
  );
}

function Headline({
  texts,
  size,
}: {
  texts: BannerTexts;
  size: "large" | "medium";
}) {
  const large = size === "large";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <span
        style={{
          alignSelf: "flex-start",
          padding: "8px 20px",
          borderRadius: 999,
          backgroundColor: CREAM,
          color: CLAY,
          fontSize: large ? 24 : 26,
          fontWeight: 800,
          letterSpacing: 3,
          textTransform: "uppercase",
        }}
      >
        {texts.eyebrow}
      </span>
      <span
        style={{
          color: WHITE,
          fontSize: large ? 84 : 92,
          fontWeight: 800,
          lineHeight: 0.98,
          letterSpacing: -2,
          textTransform: "uppercase",
          maxWidth: large ? 560 : 900,
        }}
      >
        {texts.headline}
      </span>
      <span
        style={{
          color: "rgba(255, 255, 255, 0.88)",
          fontSize: large ? 30 : 34,
          fontWeight: 500,
        }}
      >
        {texts.subtitle}
      </span>
    </div>
  );
}

/** «Ver ofertas →» en una píldora blanca: lo único del banner que parece un botón. */
function Cta({ label }: { label: string }) {
  return (
    <span
      style={{
        alignSelf: "flex-start",
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "16px 30px",
        borderRadius: 999,
        backgroundColor: WHITE,
        color: DEEP_GREEN,
        fontSize: 26,
        fontWeight: 800,
        boxShadow: "0 8px 22px rgba(0, 0, 0, 0.22)",
      }}
    >
      {label}
      <span style={{ fontSize: 28 }}>→</span>
    </span>
  );
}

/**
 * El banner de ofertas, como lo dibuja `next/og`.
 *
 * Satori entiende un subconjunto de CSS: todo es flexbox (un `div` con más de un hijo necesita
 * `display: flex`), sin rejilla ni variables. Por eso los tamaños se calculan aquí, a partir del
 * formato y de cuántas ofertas hay.
 */
export default function OffersBannerImage({
  tiles,
  texts,
  format,
  background,
}: {
  tiles: readonly BannerTile[];
  texts: BannerTexts;
  format: BannerFormat;
  /** El arte de fondo como `data:image/png;base64,…`, o `null` para un degradado liso. */
  background: string | null;
}) {
  const spec = BANNER_FORMATS[format];
  const shown = tiles.slice(0, spec.maxProducts);
  const isRow = spec.layout === "row";

  const productsWidth = isRow ? 860 : spec.width - 96;
  const productGap = isRow ? 28 : 36;
  /* El ancho de cada producto se calcula con la fila llena: con dos ofertas no se estiran hasta
     verse borrosos, se quedan del tamaño de siempre y se centran. */
  const productWidth =
    (productsWidth - productGap * (spec.maxProducts - 1)) / spec.maxProducts;
  const photoHeight = isRow ? 300 : 300;

  const products = (
    <div
      style={{
        width: productsWidth,
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-end",
        gap: productGap,
      }}
    >
      {shown.map((tile) => (
        <Product
          key={tile.postId}
          tile={tile}
          width={productWidth}
          photoHeight={photoHeight}
          texts={texts}
        />
      ))}
    </div>
  );

  return (
    <div
      style={{
        width: spec.width,
        height: spec.height,
        display: "flex",
        position: "relative",
        fontFamily: "Plus Jakarta Sans",
        backgroundImage: `linear-gradient(110deg, ${DEEP_GREEN}, ${GREEN})`,
      }}
    >
      {background ? (
        // biome-ignore lint/performance/noImgElement: Satori dibuja con <img>; en una ImageResponse no hay next/image.
        <img
          src={background}
          alt=""
          width={spec.width}
          height={spec.height}
          style={{ position: "absolute", top: 0, left: 0 }}
        />
      ) : null}

      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: spec.width,
          height: spec.height,
          display: "flex",
          flexDirection: isRow ? "row" : "column",
          alignItems: isRow ? "center" : "stretch",
          justifyContent: "space-between",
          padding: isRow ? "0 72px 0 80px" : "56px 48px 52px",
        }}
      >
        {isRow ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 34,
              width: 580,
            }}
          >
            <Headline texts={texts} size="large" />
            <Cta label={texts.cta} />
          </div>
        ) : (
          <Headline texts={texts} size="medium" />
        )}
        {products}
      </div>
    </div>
  );
}
