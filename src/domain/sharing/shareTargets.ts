/**
 * Las redes con URL de compartir web, en el orden en que se ofrecen.
 *
 * **Instagram y TikTok no están, y no es un olvido:** ninguna de las dos expone una dirección de
 * compartir. La vía a ellas es la hoja nativa del sistema (`navigator.share`) en el móvil, y
 * «copiar enlace» para pegarlo en la biografía. Añadirlas aquí obligaría a inventar una URL que no
 * existe.
 *
 * WhatsApp va primera porque es donde de verdad se reparte un enlace en México.
 */
export const SHARE_NETWORKS = [
  "whatsapp",
  "facebook",
  "x",
  "telegram",
  "email",
] as const;

export type ShareNetwork = (typeof SHARE_NETWORKS)[number];

export interface ShareRequest {
  /** La dirección **absoluta** que se comparte. Una relativa no resuelve fuera del sitio. */
  url: string;
  /** El texto que la acompaña. Lo traduce quien llama; aquí solo se codifica. */
  text: string;
}

const encode = encodeURIComponent;

/**
 * Cómo arma su dirección cada red.
 *
 * Está como tabla y no como `switch` para que añadir una red sea una fila, y para que la razón de
 * cada forma quede junto a ella. Las diferencias son reales, no cosméticas:
 *
 * - **WhatsApp** no separa texto y enlace: `wa.me` sin número acepta un único `text`, así que el
 *   enlace viaja dentro del mensaje.
 * - **Facebook** solo lee `u`. Desde 2017 descarta `quote` y `description`, y compone la
 *   publicación con las etiquetas Open Graph de la página destino. Mandarle el texto sería código
 *   muerto que aparenta funcionar.
 * - **X** y **Telegram** aceptan los dos por separado, que es lo que da la mejor vista previa.
 * - **Correo** reparte el texto entre asunto y cuerpo, porque un correo sin asunto se lee como spam.
 */
const BUILDERS: Record<ShareNetwork, (request: ShareRequest) => string> = {
  whatsapp: ({ url, text }) =>
    `https://wa.me/?text=${encode(`${text} ${url}`)}`,
  facebook: ({ url }) =>
    `https://www.facebook.com/sharer/sharer.php?u=${encode(url)}`,
  // `/intent/post` es el nombre actual; `/intent/tweet` sigue redirigiendo, pero apuntar al viejo
  // es acumular una redirección en cada compartida.
  x: ({ url, text }) =>
    `https://x.com/intent/post?url=${encode(url)}&text=${encode(text)}`,
  telegram: ({ url, text }) =>
    `https://t.me/share/url?url=${encode(url)}&text=${encode(text)}`,
  email: ({ url, text }) =>
    `mailto:?subject=${encode(text)}&body=${encode(`${text}\n${url}`)}`,
};

/** La dirección que abre esa red con el enlace y el texto ya puestos. */
export function shareTargetLink(
  network: ShareNetwork,
  request: ShareRequest,
): string {
  return BUILDERS[network](request);
}
