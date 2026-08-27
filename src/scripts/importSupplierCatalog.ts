import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { config } from "dotenv";
import sharp from "sharp";

config({
  path: resolve(process.cwd(), `.env.${process.env.NODE_ENV || "development"}`),
});

/**
 * Importa a `posts` el catálogo que extrajo `post-automation-for-website`.
 *
 * El extractor vive aparte y no toca la base; este script es la única mitad que escribe, porque
 * `posts` es de comida-justa. El backend del bot lo dice explícito en su `post_product.py`:
 * «El catálogo se publica desde comida-justa, que es dueño de posts. El bot solo lee».
 *
 *   pnpm run import:catalog -- --dry-run                     valida y no escribe
 *   pnpm run import:catalog -- --supplier=birdman --limit=5  una prueba pequeña
 *   pnpm run import:catalog                                  la carga completa
 *   pnpm run import:catalog -- --sync                        pone al día lo ya publicado
 *   pnpm run import:catalog -- --owner=correo@ejemplo.com    con qué cuenta se publica
 *   pnpm run import:catalog -- --reprocess-images            rehace a WebP lo subido crudo
 *   pnpm run import:catalog -- --prune                       borra lo que el catálogo ya no trae
 *   pnpm run import:catalog -- --remove                      deshace lo importado
 *
 * Es **idempotente**: cada producto se busca por su `slug` en `post_translations` antes de
 * insertarlo, así que correrlo dos veces no duplica. Entran con el `moderation_status` por omisión
 * (`published`), que es lo acordado.
 */

/** Espejo del contrato que escribe el extractor. Se declara aquí porque son dos proyectos. */
interface CatalogImage {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
}

interface CatalogProduct {
  supplier: string;
  supplierName: string;
  externalId: string;
  sourceUrl: string;
  title: string;
  slug: string;
  description: string;
  presentation: string;
  presentationLabel: string;
  price: number;
  images: CatalogImage[];
  sourceCategory: string;
  tags: string[];
  category: string | null;
  subCategory: string | null;
}

interface Catalog {
  generatedAt: string;
  products: CatalogProduct[];
}

const DEFAULT_CATALOG = resolve(
  process.cwd(),
  "../post-automation-for-website/out/catalogo.json",
);

/** El contacto es el de Hazlo Sano: lo revende él, así que la venta pasa por su teléfono. */
const CONTACT = {
  phone: "2781126948",
  whatsapp: "522781126948",
};

/** Tope de imágenes por producto: lo que acepta el formulario de publicación del sitio. */
const DEFAULT_MAX_IMAGES = 10;

/**
 * Cuántas de la **cabeza** se conservan cuando hay que recortar. El resto del cupo se llena con la
 * cola. Ver `pickImages`.
 */
const HEAD_IMAGES = 6;

/** Cuántas imágenes se rehacen a la vez en `--reprocess-images`. Ver el bucle de tandas. */
const REPROCESS_CONCURRENCY = 6;

/** Los mismos mínimos que `PostValidator`, para no meter por script lo que el formulario rechaza. */
const MIN_TITLE = 5;
const MIN_CONTENT = 15;

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

/** La marca de lo que publica este script. Es lo que permite borrar lo suyo sin tocar lo demás. */
const ORIGIN = "hazlo_sano_reventa";

interface Options {
  dryRun: boolean;
  remove: boolean;
  prune: boolean;
  sync: boolean;
  reprocessImages: boolean;
  supplier: string | null;
  limit: number | null;
  maxImages: number;
  owner: string | null;
  file: string;
}

function parseOptions(argv: string[]): Options {
  const value = (name: string): string | undefined => {
    const found = argv.find((arg) => arg.startsWith(`--${name}=`));
    return found ? found.slice(name.length + 3) : undefined;
  };

  const limitRaw = Number.parseInt(value("limit") ?? "", 10);
  const maxImagesRaw = Number.parseInt(value("max-images") ?? "", 10);
  const file = value("file");

  return {
    dryRun: argv.includes("--dry-run"),
    remove: argv.includes("--remove"),
    prune: argv.includes("--prune"),
    // `--reclassify` se conserva como alias: era el nombre cuando solo corregía categorías.
    sync: argv.includes("--sync") || argv.includes("--reclassify"),
    reprocessImages: argv.includes("--reprocess-images"),
    supplier: value("supplier") ?? null,
    limit: Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : null,
    maxImages:
      Number.isFinite(maxImagesRaw) && maxImagesRaw > 0
        ? maxImagesRaw
        : DEFAULT_MAX_IMAGES,
    owner: value("owner") ?? null,
    file: file ? resolve(process.cwd(), file) : DEFAULT_CATALOG,
  };
}

function adminEmail(): string | undefined {
  return (process.env.HAZLO_SANO_ADMIN_EMAILS ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)[0];
}

/**
 * El correo de la cuenta que publica el catálogo, y **se dice a propósito**.
 *
 * Antes salía del primero de `HAZLO_SANO_ADMIN_EMAILS`, que es una lista de quién manda, no de quién
 * publica. Basta reordenarla para que el dueño cambie sin que nadie lo pida: así acabaron las cargas
 * del 24 y del 26 de agosto repartidas entre dos usuarios, 422 y 130. Y esa lista no se puede
 * reordenar a la ligera, porque las pruebas e2e entran con el primero de ella.
 *
 * Por eso ahora hay dónde decirlo: `--owner=` para una corrida, `CATALOG_OWNER_EMAIL` para siempre.
 * El respaldo antiguo se conserva para no romper a quien no configure nada, pero avisa.
 */
function ownerEmail(options: Options): string | undefined {
  if (options.owner) return options.owner;

  const configured = process.env.CATALOG_OWNER_EMAIL?.trim();
  if (configured) return configured;

  const fallback = adminEmail();
  if (fallback) {
    console.warn(
      `AVISO: nadie dijo con qué cuenta publicar; se usa el primer admin (${fallback}).`,
    );
    console.warn(
      "       Fíjalo con CATALOG_OWNER_EMAIL o --owner= para que no dependa del orden de esa lista.\n",
    );
  }

  return fallback;
}

/**
 * El texto que manda el catálogo, sin nada nuestro encima.
 *
 * El respaldo al título sigue aquí como guardarraíl, aunque hoy no lo use nadie: el extractor le
 * compone una descripción a lo que llega sin ella —ver `describe.ts` en `post-automation-for-website`—
 * y desde entonces los 401 traen texto. El día que un proveedor nuevo llegue vacío, esto lo sostiene.
 */
function catalogText(product: CatalogProduct): string {
  const description = product.description.trim();
  const body =
    description.length >= MIN_CONTENT ? description : product.title.trim();

  /* La presentación va **arriba**: es lo que distingue la pieza del paquete, y quien abre la ficha
     tiene que verlo antes de leer el copy del proveedor. */
  return product.presentation
    ? [product.presentation, body].join("\n\n")
    : body;
}

/**
 * El contenido que va a `post_translations.content`: lo del proveedor, y al final quién lo surte.
 *
 * La línea del proveedor existe **porque nada más la lleva**. `posts` no tiene columna de proveedor,
 * `seller_id` apunta a una sola tienda para todo el catálogo, y la búsqueda arma su `tsvector` solo
 * con `title` (peso A) y `content` (peso B): sin esto, buscar «amorasana» o «kian» no encuentra sus
 * productos salvo donde el proveedor se nombra a sí mismo en el título, que hoy son 85 de 401. Va
 * también al embedding, que se compone del mismo `content`.
 *
 * Va **al final** y no arriba: quien abre la ficha quiere leer qué es el producto, no de quién es.
 *
 * Se separa de `catalogText` a propósito. `rejectionReason` mide si el proveedor mandó texto
 * suficiente, y esta línea la escribimos nosotros: contarla ahí dejaría pasar una ficha vacía por el
 * solo hecho de tener proveedor, que es justo lo que ese guardarraíl existe para atrapar.
 */
function contentFor(product: CatalogProduct): string {
  const supplier = product.supplierName?.trim();
  const text = catalogText(product);

  return supplier ? [text, `Lo surte ${supplier}.`].join("\n\n") : text;
}

function rejectionReason(product: CatalogProduct): string | null {
  if (product.title.trim().length < MIN_TITLE) return "título demasiado corto";
  if (catalogText(product).length < MIN_CONTENT) return "sin texto suficiente";
  if (!(product.price > 0)) return "sin precio";
  return null;
}

/** El lado mayor que se guarda. `next/image` reescala hacia abajo desde aquí sin que se note. */
const MAX_EDGE = 1024;
const WEBP_QUALITY = 82;

/**
 * La imagen ya lista para el bucket: reescalada y en WebP.
 *
 * Los proveedores publican lo que les conviene a ellos, no a nosotros: Birdman sirve PNG de 1024 a
 * ~700 KB y Huipi JPEG de 1796x1706 a ~500 KB. Guardarlos tal cual costaba **730 MB** de Storage
 * para 1593 imágenes. Convertidos rondan el 8-12% de eso.
 *
 * No es solo tamaño en disco: `next/image` reoptimiza en cada arranque frío desde el original, así
 * que un original más liviano también es una primera visita más rápida.
 *
 * `rotate()` sin argumentos aplica la orientación EXIF **antes** de reescalar. Sin él, una foto
 * tomada de lado se guarda girada, porque WebP no arrastra ese metadato.
 */
async function toWebp(input: Buffer): Promise<{
  data: Buffer;
  width: number | null;
  height: number | null;
}> {
  const pipeline = sharp(input)
    .rotate()
    .resize({
      width: MAX_EDGE,
      height: MAX_EDGE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: WEBP_QUALITY });

  const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });

  return { data, width: info.width ?? null, height: info.height ?? null };
}

/**
 * El nombre con el que se guarda, que **lleva escrito su propio tratamiento** (`-w1024.webp`).
 *
 * Sirve para dos cosas. Es determinista, así que reimportar pisa el mismo archivo en vez de dejar
 * copias huérfanas. Y hace reconocible lo ya convertido: `--reprocess-images` salta lo que termina
 * así y solo rehace lo que se subió crudo, sin tener que descargar nada para averiguarlo.
 */
function storedName(product: CatalogProduct, position: number): string {
  return `${product.supplier}-${product.slug}-${position}-w${MAX_EDGE}.webp`;
}

/** ¿Esta URL apunta a un archivo que ya pasó por `toWebp`? */
function isProcessed(url: string): boolean {
  return decodeURIComponent(url).includes(`-w${MAX_EDGE}.webp`);
}

/**
 * ¿Esta imagen la subió este script? Se reconoce por el proveedor con el que empieza su nombre.
 *
 * Es la firma que deja `storedName`, y la usa `--prune` para no borrar publicaciones ajenas: la
 * columna `origin` no alcanza, porque la siembra a mano escribe la misma marca. Se compara contra
 * los proveedores del catálogo en curso, que son los únicos prefijos que este script pudo escribir.
 */
function storedByImporter(url: string, suppliers: string[]): boolean {
  const file = decodeURIComponent(url).split("/").pop()?.split("?")[0] ?? "";
  return suppliers.some((supplier) => file.startsWith(`${supplier}-`));
}

/**
 * La ruta dentro del bucket, sacada de la URL de descarga de Firebase.
 *
 * Las URL tienen la forma `.../o/{ruta%2Fcodificada}?alt=media&token=…`, así que la ruta es el
 * tramo entre `/o/` y la query, decodificado.
 */
function storagePathFromUrl(url: string): string | null {
  const encoded = url.split("/o/")[1]?.split("?")[0];
  if (!encoded) return null;

  try {
    return decodeURIComponent(encoded);
  } catch {
    return null;
  }
}

/**
 * La misma imagen pedida a 1024 px, cuando el CDN sabe servirla.
 *
 * Los originales de Shopify son PNG de 2000x2000 y ~3 MB: replicar las ~900 del catálogo tal cual
 * son unos 2 GB de bucket para algo que `next/image` va a reescalar de todas formas al pintarlo.
 * Shopify entiende el sufijo `_1024x1024` en el nombre del archivo, así que se le pide así.
 *
 * Devuelve `null` cuando no aplica; quien llama se queda entonces con la URL original. Y si la
 * variante no existiera, la descarga falla y se reintenta con el original: nunca se pierde la
 * imagen por intentar ahorrar.
 */
function resizedVariant(url: string): string | null {
  if (!/cdn\.shopify\.com/i.test(url)) return null;

  const [base, query] = url.split("?");
  if (!base) return null;

  const match = base.match(/^(.*)\.([a-z0-9]+)$/i);
  if (!match) return null;

  return `${match[1]}_1024x1024.${match[2]}${query ? `?${query}` : ""}`;
}

/**
 * Las imágenes que se replican cuando el producto trae más de las que caben.
 *
 * **No es «las primeras N».** Se comprobó mirando las galerías: los proveedores ponen las fotos de
 * producto al principio y los gráficos explicativos —ingredientes, Declaración Nutrimental— **al
 * final**. En «Merry Cookie» de Huipi, con 14 imágenes, la de ingredientes es la 11 y la tabla
 * nutrimental la 12: recortar por la cabeza tiraba justo las dos que más importan.
 *
 * Tampoco sirve el nombre del archivo, que fue lo primero que se intentó: la tabla nutrimental se
 * llama `10.png` y una foto de ambiente `MERRY-COOKIE-2-08.png`. No hay señal en los metadatos.
 *
 * Así que se conservan las primeras `HEAD_IMAGES` y se completa el cupo con las **últimas**, en su
 * orden original. Solo 9 de 447 productos pasan del tope, y ninguno por más de cuatro.
 */
function pickImages(images: CatalogImage[], max: number): CatalogImage[] {
  if (images.length <= max) return images;

  const head = Math.min(HEAD_IMAGES, max);
  return [
    ...images.slice(0, head),
    ...images.slice(images.length - (max - head)),
  ];
}

/**
 * La cabecera `Referer` de la ficha que muestra la imagen, que es la que manda un navegador al
 * pintarla.
 *
 * La necesita Huipi: su Cloudflare responde **403 «Attention Required!»** a cualquier petición de
 * `/wp-content/uploads/` que no la traiga —da igual el `User-Agent`—, y por eso sus 23 productos
 * entraron sin una sola imagen mientras su API de catálogo respondía con normalidad. Con la
 * cabecera devuelve `200 image/webp`.
 *
 * Es protección anti-hotlink, pensada para que otro sitio no incruste sus fotos y les gaste el
 * ancho de banda. Aquí se descarga **una vez** y se rehospeda, que es justo lo contrario. Aun así
 * conviene que el proveedor sepa que usas su material.
 */
function refererFor(product: CatalogProduct): Record<string, string> {
  try {
    return { Referer: `${new URL(product.sourceUrl).origin}/` };
  } catch {
    return {};
  }
}

/**
 * Baja la imagen del CDN del proveedor y la sube al bucket propio.
 *
 * **No es opcional.** `next.config.ts` solo autoriza `lh3.googleusercontent.com`,
 * `firebasestorage.googleapis.com` y `storage.googleapis.com`; si se guardara la URL del proveedor,
 * `next/image` lanzaría «hostname not configured» y la tarjeta no renderizaría.
 *
 * El nombre del archivo es determinista (proveedor + slug + posición), así que reimportar pisa la
 * misma ruta en vez de dejar copias huérfanas.
 */
async function mirrorImage(
  storage: { uploadFile(file: File): Promise<string> },
  product: CatalogProduct,
  image: CatalogImage,
  position: number,
): Promise<{
  url: string;
  width: number | null;
  height: number | null;
} | null> {
  try {
    // Se intenta la variante ligera y se cae al original si el CDN no la tiene.
    const candidates = [resizedVariant(image.url), image.url].filter(
      (candidate): candidate is string => Boolean(candidate),
    );

    let response: Response | null = null;
    for (const candidate of candidates) {
      const attempt = await fetch(candidate, {
        headers: { "User-Agent": BROWSER_UA, ...refererFor(product) },
      });
      if (attempt.ok) {
        response = attempt;
        break;
      }
    }
    if (!response) return null;

    const contentType = response.headers.get("content-type") ?? "image/jpeg";
    if (!contentType.startsWith("image/")) return null;

    const source = Buffer.from(await response.arrayBuffer());
    if (source.byteLength === 0) return null;

    const { data, width, height } = await toWebp(source);
    const url = await storage.uploadFile(
      new File([data], storedName(product, position), { type: "image/webp" }),
    );

    return { url, width, height };
  } catch {
    // Una imagen caída no debe tumbar la importación del producto; se cuenta al final.
    return null;
  }
}

async function main(): Promise<void> {
  const options = parseOptions(process.argv.slice(2));

  const catalog = JSON.parse(await readFile(options.file, "utf8")) as Catalog;
  let products = catalog.products;

  if (options.supplier) {
    products = products.filter(
      (product) => product.supplier === options.supplier,
    );
  }
  if (options.limit) {
    products = products.slice(0, options.limit);
  }

  console.log(`Catálogo: ${options.file}`);
  console.log(`Generado: ${catalog.generatedAt}`);
  console.log(`Productos en alcance: ${products.length}\n`);

  if (products.length === 0) {
    console.log("Nada que hacer.");
    return;
  }

  if (!process.env.DATABASE_URL) {
    console.error("ERROR: falta DATABASE_URL.");
    process.exit(1);
  }

  const { db } = await import("~/infra/dataAccess/db/connection");
  const { eq, inArray, sql } = await import("drizzle-orm");
  const { postMedia, posts, postTranslations } = await import(
    "~/infra/dataAccess/db/schema/posts"
  );
  const { categories } = await import(
    "~/infra/dataAccess/db/schema/categories"
  );
  const { users } = await import("~/infra/dataAccess/db/schema/auth");
  const { sellers } = await import("~/infra/dataAccess/db/schema/sellers");

  /**
   * La cuenta con la que publica este script: el primer correo de `HAZLO_SANO_ADMIN_EMAILS`.
   *
   * La necesitan dos modos, y por razones distintas: el alta, para colgarle las publicaciones, y
   * `--prune`, para no borrar lo que publicó alguien más.
   */
  /**
   * La **tienda** con la que sale publicado el catálogo: la del dueño.
   *
   * `posts.seller_id` es lo que agrupa una ficha bajo su tienda —la portada, el carrito y
   * `/tienda/<slug>` filtran por ahí—, y el importador no lo mandaba: las 106 altas del 26 de agosto
   * entraron sin tienda mientras las anteriores sí la tenían. Sale del dueño y no de una
   * configuración aparte porque la tienda es de quien publica, no del catálogo.
   */
  const resolveSellerId = async (ownerId: string): Promise<string | null> => {
    const rows = await db
      .select({ id: sellers.id })
      .from(sellers)
      .where(eq(sellers.userId, ownerId))
      .limit(1);

    return rows[0]?.id ?? null;
  };

  const resolveOwnerId = async (): Promise<string | undefined> => {
    const email = ownerEmail(options);
    const rows = email
      ? await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.email, email))
          .limit(1)
      : await db.select({ id: users.id }).from(users).limit(1);

    return rows[0]?.id;
  };

  /*
   * Las categorías se validan siempre, incluso en dry-run: son FK con ON DELETE RESTRICT, así que
   * una clave inválida no se descubre al final sino en el INSERT de ese producto, a mitad de la
   * carga y con la mitad anterior ya escrita.
   */
  const categoryRows = await db
    .select({ key: categories.key, isActive: categories.isActive })
    .from(categories);
  const activeKeys = new Set(
    categoryRows.filter((row) => row.isActive).map((row) => row.key),
  );

  const wanted = new Set<string>();
  for (const product of products) {
    if (product.category) wanted.add(product.category);
    if (product.subCategory) wanted.add(product.subCategory);
  }

  const unknown = [...wanted].filter((key) => !activeKeys.has(key));
  if (unknown.length > 0) {
    console.error(
      `ERROR: claves de categoría inexistentes o inactivas: ${unknown.join(", ")}`,
    );
    console.error(`\nClaves activas: ${[...activeKeys].sort().join(", ")}`);
    console.error(
      "\nCorrige el mapeo en post-automation-for-website/src/config/suppliers.ts",
    );
    process.exit(1);
  }
  console.log(
    `Categorías validadas: ${[...wanted].sort().join(", ") || "(ninguna)"}\n`,
  );

  if (options.remove) {
    const found = await db
      .select({ postId: postTranslations.postId })
      .from(postTranslations)
      .where(
        inArray(
          postTranslations.slug,
          products.map((product) => product.slug),
        ),
      );

    const ids = [...new Set(found.map((row) => row.postId))];
    if (ids.length === 0) {
      console.log("No hay nada que borrar.");
      return;
    }

    // `post_translations` y `post_media` caen por ON DELETE CASCADE.
    await db.delete(posts).where(inArray(posts.id, ids));
    console.log(`Borrados ${ids.length} posts.`);
    return;
  }

  /*
   * Borra lo que este script publicó y **el catálogo ya no genera**.
   *
   * Partir un producto en sus presentaciones deja huérfano al que estaba publicado: «Galleta Doble
   * Chocolate — Paquete de 6 o 12 piezas» a $199 ya no lo produce nadie, pero sigue en la vitrina
   * al lado de las dos fichas que lo sustituyen —que es justo el par confuso que se quería quitar—.
   * Lo mismo pasa cuando un proveedor retira un producto de su tienda.
   *
   * `--remove` no los alcanza: borra por los slugs del catálogo, y el slug del huérfano es
   * precisamente el que dejó de existir. Aquí la pregunta es la contraria —qué hay publicado que ya
   * no esté— y por eso es otro modo.
   *
   * Un post cuenta como huérfano solo si **ninguna** de sus traducciones coincide: la ficha en
   * inglés tiene su propio slug, que nunca está en el catálogo, y mirarla sola las condenaría a
   * todas.
   *
   * **`origin` no basta para saber qué publicó este script**, y averiguarlo costó un susto:
   * `seedHazloSanoProducts.ts` marca con el mismo `hazlo_sano_reventa` los tres panes de masa madre
   * que se sembraron a mano, que no salen de ningún catálogo y por tanto parecerían huérfanos
   * siempre. La cuenta tampoco sirve: `HAZLO_SANO_ADMIN_EMAILS` trae dos correos y se toma el
   * primero, así que las cargas de dos días distintos quedaron repartidas entre dos usuarios —422 y
   * 130— y uno de ellos es además el dueño de los panes.
   *
   * Lo que sí distingue es **el nombre del archivo de sus imágenes**, `<proveedor>-<slug>-<n>…`, que
   * es la misma marca con la que `--reprocess-images` reconoce su propio trabajo. Los panes traen
   * `pan-de-masa-madre.jpg` y quedan fuera. Una publicación que no se pueda atribuir así **no se
   * toca**: ante la duda, no se borra.
   */
  if (options.prune) {
    if (options.supplier || options.limit) {
      console.error(
        "ERROR: --prune necesita el catálogo completo. Con --supplier o --limit, todo lo que",
      );
      console.error(
        "quedó fuera del recorte parecería huérfano y se borraría el resto del catálogo.",
      );
      process.exit(1);
    }

    const live = new Set(products.map((product) => product.slug));
    const suppliers = [...new Set(products.map((product) => product.supplier))];

    const published = await db
      .select({
        postId: posts.id,
        slug: postTranslations.slug,
        title: postTranslations.title,
        mediaUrl: postMedia.url,
      })
      .from(posts)
      .innerJoin(postTranslations, eq(postTranslations.postId, posts.id))
      .leftJoin(postMedia, eq(postMedia.postId, posts.id))
      .where(eq(posts.origin, ORIGIN));

    const byPost = new Map<
      string,
      { slugs: string[]; title: string; ours: boolean }
    >();

    for (const row of published) {
      const entry = byPost.get(row.postId) ?? {
        slugs: [],
        title: row.title,
        ours: false,
      };

      if (!entry.slugs.includes(row.slug)) entry.slugs.push(row.slug);
      if (row.mediaUrl && storedByImporter(row.mediaUrl, suppliers)) {
        entry.ours = true;
      }

      byPost.set(row.postId, entry);
    }

    const mine = [...byPost].filter(([, entry]) => entry.ours);
    const orphans = mine.filter(([, entry]) =>
      entry.slugs.every((slug) => !live.has(slug)),
    );

    console.log(`Con el mismo origin:          ${byPost.size}`);
    console.log(`Publicadas por el importador: ${mine.length}`);
    console.log(`En el catálogo actual:        ${live.size}`);
    console.log(`Huérfanas:                    ${orphans.length}\n`);

    const foreign = byPost.size - mine.length;
    if (foreign > 0) {
      console.log(
        `  (${foreign} llevan el mismo origin pero no las subió este importador; no se tocan)\n`,
      );
    }

    for (const [, entry] of orphans) {
      console.log(`  ${entry.slugs[0]?.padEnd(34)} ${entry.title}`);
    }

    if (orphans.length === 0) return;

    if (options.dryRun) {
      console.log("\nDRY RUN — no se borró nada.");
      return;
    }

    await db.delete(posts).where(
      inArray(
        posts.id,
        orphans.map(([id]) => id),
      ),
    );
    console.log(`\nBorradas ${orphans.length} publicaciones huérfanas.`);
    return;
  }

  /*
   * Rehacer las imágenes que se subieron crudas.
   *
   * Las primeras corridas guardaron lo que servía cada proveedor: PNG de 1024 en Birdman, JPEG de
   * 1796x1706 en Huipi. Eran 730 MB para 1593 archivos. Este modo baja el original otra vez, lo
   * pasa por `toWebp`, sustituye la fila y **borra el archivo viejo del bucket** — si no, el
   * ahorro sería mentira: quedarían las dos versiones.
   *
   * Va imagen por imagen y no en bloque: si se interrumpe, lo hecho queda consistente y lo que
   * falta se reconoce solo por el nombre.
   */
  if (options.reprocessImages) {
    const bySlug = new Map(products.map((product) => [product.slug, product]));

    const rows = await db
      .select({
        id: postMedia.id,
        url: postMedia.url,
        sortOrder: postMedia.sortOrder,
        slug: postTranslations.slug,
      })
      .from(postMedia)
      .innerJoin(
        postTranslations,
        eq(postTranslations.postId, postMedia.postId),
      )
      .where(inArray(postTranslations.slug, [...bySlug.keys()]));

    const pending = rows.filter((row) => !isProcessed(row.url));

    console.log(`Imágenes encontradas: ${rows.length}`);
    console.log(`Ya convertidas:       ${rows.length - pending.length}`);
    console.log(`Por convertir:        ${pending.length}\n`);

    if (options.dryRun || pending.length === 0) {
      if (options.dryRun) console.log("DRY RUN — no se escribe nada.");
      return;
    }

    const { default: FirebaseMediaStorageService } = await import(
      "~/infra/storage/FirebaseMediaStorageService"
    );
    const { getStorage } = await import("firebase-admin/storage");
    await import("~/infra/dataAccess/init");

    const storage = new FirebaseMediaStorageService();
    const bucket = getStorage().bucket();

    let converted = 0;
    let failed = 0;
    let deleted = 0;

    const convertOne = async (row: (typeof pending)[number]): Promise<void> => {
      const product = bySlug.get(row.slug);
      if (!product) return;

      const source = pickImages(product.images, options.maxImages)[
        row.sortOrder
      ];
      if (!source) return;

      const mirrored = await mirrorImage(
        storage,
        product,
        source,
        row.sortOrder,
      );
      if (!mirrored) {
        failed++;
        return;
      }

      const previous = storagePathFromUrl(row.url);

      await db
        .update(postMedia)
        .set({
          url: mirrored.url,
          width: mirrored.width,
          height: mirrored.height,
        })
        .where(eq(postMedia.id, row.id));

      /* El borrado va **después** de que la fila apunte al archivo nuevo: si falla aquí, sobra un
         archivo; al revés, faltaría la imagen que la ficha ya está pidiendo. */
      if (previous) {
        try {
          await bucket.file(previous).delete();
          deleted++;
        } catch {
          // Que no se pueda borrar el viejo no invalida la conversión; solo deja un archivo de más.
        }
      }

      converted++;
      if (converted % 100 === 0)
        console.log(`  ${converted}/${pending.length}...`);
    };

    /*
     * En tandas y no de una en una: casi todo el tiempo de cada imagen es esperar a la red —bajar
     * del proveedor, subir al bucket—, así que de a una el proceso pasa el rato ocioso. Con 1600
     * imágenes eso es la diferencia entre media hora y unos minutos.
     *
     * El paralelismo es modesto a propósito: son CDN ajenos y no hay por qué martillearlos.
     */
    for (let i = 0; i < pending.length; i += REPROCESS_CONCURRENCY) {
      await Promise.all(
        pending.slice(i, i + REPROCESS_CONCURRENCY).map(convertOne),
      );
    }

    console.log(`\nConvertidas ${converted}, fallidas ${failed}.`);
    console.log(`Archivos viejos borrados del bucket: ${deleted}.`);
    return;
  }

  /*
   * Poner al día lo ya publicado, en vez de reimportarlo.
   *
   * Cuando el proveedor mueve un precio, o cambia el mapeo de categorías, el texto o el tope de
   * imágenes, borrar y reimportar volvería a descargar y subir cientos de archivos idénticos para
   * acabar en el mismo sitio —y de paso cambiaría los ids de las publicaciones. Esto corrige en el
   * lugar y **solo sube lo que falta**.
   *
   * El `slug` es la llave, igual que en el dedup del alta: el JSON del extractor manda.
   *
   * También repara **de quién es la publicación**, que no viene del catálogo sino de la
   * configuración. Hasta ahora el dueño se decidía en el alta y ahí se quedaba, así que dos cargas
   * hechas con distinta configuración dejaron el mismo catálogo repartido entre dos cuentas —422 y
   * 130—, y la ficha enseña quién publica. Es lo único que se corrige sin que lo pida el JSON.
   */
  if (options.sync) {
    const owner = await resolveOwnerId();
    if (!owner) {
      console.error(
        `ERROR: no existe un usuario con el correo "${ownerEmail(options)}".`,
      );
      process.exit(1);
    }

    const seller = await resolveSellerId(owner);

    const bySlug = new Map(products.map((product) => [product.slug, product]));

    const current = await db
      .select({
        id: posts.id,
        slug: postTranslations.slug,
        translationId: postTranslations.id,
        title: postTranslations.title,
        content: postTranslations.content,
        price: posts.price,
        sellerId: posts.sellerId,
        userId: posts.userId,
        category: posts.category,
        subCategory: posts.subCategory,
      })
      .from(posts)
      .innerJoin(postTranslations, eq(postTranslations.postId, posts.id))
      .where(inArray(postTranslations.slug, [...bySlug.keys()]));

    const storage = options.dryRun
      ? null
      : await (async () => {
          const { default: FirebaseMediaStorageService } = await import(
            "~/infra/storage/FirebaseMediaStorageService"
          );
          await import("~/infra/dataAccess/init");
          return new FirebaseMediaStorageService();
        })();

    const moves = new Map<string, number>();
    let retitled = 0;
    let retexted = 0;
    let repriced = 0;
    let reassigned = 0;
    let reshelved = 0;
    let addedImages = 0;
    let touched = 0;

    for (const row of current) {
      const product = bySlug.get(row.slug);
      if (!product) continue;

      let changed = false;

      const sameCategory =
        (row.category ?? null) === (product.category ?? null);
      const sameSub =
        (row.subCategory ?? null) === (product.subCategory ?? null);

      if (!sameCategory || !sameSub) {
        const move = `${row.category ?? "sin categoría"}/${row.subCategory ?? "-"}  ->  ${product.category ?? "sin categoría"}/${product.subCategory ?? "-"}`;
        moves.set(move, (moves.get(move) ?? 0) + 1);
        changed = true;

        if (!options.dryRun) {
          await db
            .update(posts)
            .set({
              category: product.category,
              subCategory: product.subCategory,
            })
            .where(eq(posts.id, row.id));
        }
      }

      const title = product.title;
      const content = contentFor(product);

      if (row.title !== title || row.content !== content) {
        if (row.title !== title) retitled++;
        if (row.content !== content) retexted++;
        changed = true;

        if (!options.dryRun) {
          await db
            .update(postTranslations)
            .set({ title, content })
            .where(eq(postTranslations.id, row.translationId));
        }
      }

      /*
       * El precio también se corrige, y hasta hoy no se corregía: solo se escribía al dar de alta,
       * así que una ficha publicada se quedaba con el precio del día que entró. Los proveedores los
       * mueven —entre dos extracciones de dos días cambiaron 36 de Birdman— y una vitrina que
       * promete una cifra que ya no es cierta es peor que no prometer nada.
       *
       * Se compara en centavos y no como texto: la columna es `numeric`, así que devuelve cadena y
       * «26.8» y «26.80» son el mismo precio escrito de dos formas.
       */
      const cents = (amount: number): number => Math.round(amount * 100);
      const published = row.price === null ? null : Number(row.price);

      if (published === null || cents(published) !== cents(product.price)) {
        repriced++;
        changed = true;

        if (!options.dryRun) {
          await db
            .update(posts)
            .set({ price: product.price.toString() })
            .where(eq(posts.id, row.id));
        }
      }

      if (row.userId !== owner) {
        reassigned++;
        changed = true;

        if (!options.dryRun) {
          await db
            .update(posts)
            .set({ userId: owner })
            .where(eq(posts.id, row.id));
        }
      }

      /* La tienda va junto al dueño porque es suya: si la ficha cambió de cuenta —o entró sin
         tienda, como las 106 del 26 de agosto—, quedaría colgando de la anterior. */
      if (seller && row.sellerId !== seller) {
        reshelved++;
        changed = true;

        if (!options.dryRun) {
          await db
            .update(posts)
            .set({ sellerId: seller })
            .where(eq(posts.id, row.id));
        }
      }

      /*
       * Las imágenes solo se **añaden**. Las que ya están conservan su `sort_order`, y lo que falta
       * se cuelga detrás: la selección de `pickImages` empieza por las mismas de siempre, así que
       * la posición 0 —la portada que piden el carrito y el bot— nunca se mueve.
       */
      const wanted = pickImages(product.images, options.maxImages);
      const [{ count } = { count: 0 }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(postMedia)
        .where(eq(postMedia.postId, row.id));

      const missing = wanted.slice(Number(count));

      if (missing.length > 0) {
        changed = true;
        addedImages += missing.length;

        if (!options.dryRun && storage) {
          for (const [offset, image] of missing.entries()) {
            const position = Number(count) + offset;
            const mirrored = await mirrorImage(
              storage,
              product,
              image,
              position,
            );
            if (!mirrored) continue;

            await db.insert(postMedia).values({
              postId: row.id,
              url: mirrored.url,
              type: "image",
              alt: image.alt || product.title,
              sortOrder: position,
              width: mirrored.width,
              height: mirrored.height,
            });
          }
        }
      }

      if (changed) touched++;
    }

    if (options.dryRun) console.log("DRY RUN — no se escribe nada.\n");

    for (const [move, count] of [...moves].sort((a, b) => b[1] - a[1])) {
      console.log(`  ${String(count).padStart(4)}  ${move}`);
    }

    console.log(`\nPublicaciones encontradas: ${current.length}`);
    console.log(
      `  títulos ${options.dryRun ? "a cambiar" : "cambiados"}:      ${retitled}`,
    );
    console.log(`  descripciones:                ${retexted}`);
    console.log(
      `  precios ${options.dryRun ? "a corregir" : "corregidos"}:          ${repriced}`,
    );
    console.log(
      `  dueño ${options.dryRun ? "a reasignar" : "reasignado"}:           ${reassigned}`,
    );
    console.log(
      `  tienda ${options.dryRun ? "a asignar" : "asignada"}:             ${reshelved}`,
    );
    console.log(
      `  imágenes ${options.dryRun ? "a añadir" : "añadidas"}:       ${addedImages}`,
    );
    console.log(`  publicaciones tocadas:        ${touched}`);

    return;
  }

  const rejected: Array<{ product: CatalogProduct; reason: string }> = [];
  const importable: CatalogProduct[] = [];

  for (const product of products) {
    const reason = rejectionReason(product);
    if (reason) rejected.push({ product, reason });
    else importable.push(product);
  }

  if (rejected.length > 0) {
    console.log(`Se omiten ${rejected.length} por datos insuficientes:`);
    for (const { product, reason } of rejected.slice(0, 10)) {
      console.log(
        `  ${product.supplier}: ${product.title.slice(0, 60)} — ${reason}`,
      );
    }
    console.log();
  }

  const alreadyThere = await db
    .select({ slug: postTranslations.slug })
    .from(postTranslations)
    .where(
      inArray(
        postTranslations.slug,
        importable.map((product) => product.slug),
      ),
    );
  const existing = new Set(alreadyThere.map((row) => row.slug));
  const pending = importable.filter((product) => !existing.has(product.slug));

  console.log(`Ya existen: ${existing.size}`);
  console.log(`Por insertar: ${pending.length}\n`);

  if (options.dryRun) {
    const bySupplier = new Map<string, number>();
    for (const product of pending) {
      bySupplier.set(
        product.supplier,
        (bySupplier.get(product.supplier) ?? 0) + 1,
      );
    }

    console.log("DRY RUN — no se escribe nada.\n");
    for (const [supplier, count] of [...bySupplier].sort(
      (a, b) => b[1] - a[1],
    )) {
      console.log(`  ${String(count).padStart(4)}  ${supplier}`);
    }

    const fallback = pending.filter(
      (product) => product.description.trim().length < MIN_CONTENT,
    ).length;
    const images = pending.reduce(
      (total, product) =>
        total + pickImages(product.images, options.maxImages).length,
      0,
    );

    console.log(
      `\n  ${fallback} usarían el título como texto (el proveedor no publica descripción).`,
    );
    console.log(`  Imágenes a replicar: ~${images}`);
    console.log(
      `\n  Dueño: ${adminEmail() ?? "(primer usuario de la tabla users)"}`,
    );
    return;
  }

  const ownerId = await resolveOwnerId();
  if (!ownerId) {
    const email = ownerEmail(options);
    console.error(
      email
        ? `ERROR: no existe un usuario con el correo "${email}".`
        : "ERROR: la tabla users está vacía.",
    );
    process.exit(1);
  }

  const { default: PostgresPostRepository } = await import(
    "~/infra/dataAccess/createOnePost/PostgresPostRepository"
  );
  const { default: FirebaseMediaStorageService } = await import(
    "~/infra/storage/FirebaseMediaStorageService"
  );
  // Inicializa el SDK admin; `getStorage().bucket()` lo necesita ya arrancado.
  await import("~/infra/dataAccess/init");

  const repository = new PostgresPostRepository();
  const storage = new FirebaseMediaStorageService();

  /* Sin tienda la ficha no aparece bajo `/tienda/<slug>` ni se agrupa en el carrito, así que se
     resuelve una vez y se cuelga de cada alta. */
  const sellerId = await resolveSellerId(ownerId);
  if (!sellerId) {
    console.warn(
      "AVISO: la cuenta que publica no tiene tienda; las altas entrarán sin `seller_id`.\n",
    );
  }

  let inserted = 0;
  let withoutImage = 0;

  for (const product of pending) {
    const media: Array<{
      url: string;
      type: string;
      alt: string;
      width?: number;
      height?: number;
    }> = [];

    for (const [position, image] of pickImages(
      product.images,
      options.maxImages,
    ).entries()) {
      const mirrored = await mirrorImage(storage, product, image, position);
      if (!mirrored) continue;

      /* Las dimensiones salen de `sharp`, o sea del archivo que de verdad se guardó, no de las que
         declaraba el proveedor. Es lo que hace honesta a `mediaAspect.ts`, que las usa para la
         proporción de la tarjeta. */
      media.push({
        url: mirrored.url,
        type: "image",
        alt: image.alt || product.title,
        width: mirrored.width ?? undefined,
        height: mirrored.height ?? undefined,
      });
    }

    if (media.length === 0) withoutImage++;

    // El slug puede chocar entre proveedores; `createUniqueSlug` es quien sabe numerarlo.
    const slug = await repository.createUniqueSlug(product.slug);

    await repository.save({
      title: product.title,
      slug,
      content: contentFor(product),
      price: product.price,
      kind: "producto",
      origin: ORIGIN,
      category: product.category,
      subCategory: product.subCategory,
      contactInfo: CONTACT,
      media,
      sellerId,
      user: { id: ownerId },
      createdAt: new Date(),
    });

    inserted++;
    if (inserted % 25 === 0 || inserted === pending.length) {
      console.log(`  ${inserted}/${pending.length}...`);
    }
  }

  console.log(
    `\nInsertados ${inserted}. Omitidos por existir: ${existing.size}.`,
  );
  if (withoutImage > 0) {
    console.log(
      `${withoutImage} quedaron sin imagen (no se pudo replicar ninguna).`,
    );
  }
  console.log("\nSiguiente paso:");
  console.log("  pnpm run backfill-translations   # la traducción en inglés");
  console.log(
    "  pnpm run backfill-embeddings     # los vuelve buscables, también para el chatbot",
  );
  console.log("\nPara deshacer: pnpm run import:catalog -- --remove");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("La importación falló:", error);
    process.exit(1);
  });
