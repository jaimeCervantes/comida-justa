import { resolve } from "node:path";
import { config } from "dotenv";

config({ path: resolve(process.cwd(), ".env.development") });

/**
 * Slice 2 de `docs/features/catalogo-unificado.md`: trae el catálogo del chatbot (`products`)
 * a `posts`, sin tocar `products` — el bot lo sigue leyendo hasta el slice 3.
 *
 * Dos decisiones que explican la forma del script:
 *
 * 1. **Se conserva el id.** `posts.id` es `text` y `products.id` es `uuid`, pero el valor es el
 *    mismo: así los registros históricos de `product_recommendations` (que guardan ids en JSON)
 *    siguen resolviendo. Por eso no se usa el repositorio de escritura, que genera su propio id.
 * 2. **El `embedding` no se regenera.** Se copia con un `INSERT ... SELECT` desde `products`, de
 *    modo que el vector nunca pasa por JavaScript: mismo modelo, mismas 768 dimensiones.
 *
 * Modos: `--dry-run` (no escribe), sin flag (inserta, idempotente) y `--remove` (deshace).
 */

type Mode = "insert" | "dry-run" | "remove";

type LegacyProductRow = {
  id: string;
  name: string;
  price: number | null;
  is_available: boolean;
  description: string | null;
  category: string | null;
  sub_category: string | null;
  tags: unknown;
  image_url: string | null;
  product_url: string | null;
  seller_id: string | null;
  seller_phone: string | null;
  has_embedding: boolean;
};

function resolveMode(argv: string[]): Mode {
  if (argv.includes("--dry-run")) return "dry-run";
  if (argv.includes("--remove")) return "remove";
  return "insert";
}

function adminEmail(): string | undefined {
  return (process.env.HAZLO_SANO_ADMIN_EMAILS ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)[0];
}

async function migrateProductsToPosts() {
  const mode = resolveMode(process.argv.slice(2));

  if (!process.env.DATABASE_URL) {
    console.error("ERROR: DATABASE_URL is missing.");
    process.exit(1);
  }

  const { sql } = await import("drizzle-orm");
  const { db } = await import("~/infra/dataAccess/db/connection");
  const { eq } = await import("drizzle-orm");
  const { users } = await import("~/infra/dataAccess/db/schema/auth");
  const { default: PostEntity } = await import("~/domain/entities/post/Post");
  const {
    LEGACY_PRODUCT_ORIGIN,
    legacyCategory,
    legacySubCategory,
    legacyWhatsapp,
  } = await import("~/domain/entities/post/legacyCatalog");

  if (mode === "remove") {
    const removed = await db.execute(sql`
      DELETE FROM posts
      WHERE id IN (SELECT id::text FROM products)
      RETURNING id
    `);
    const count = (removed.rows as unknown as Array<{ id: string }>).length;
    console.log(
      `Eliminados ${count} posts migrados (translations y media caen por cascada).`,
    );
    return;
  }

  const raw = await db.execute(sql`
    SELECT
      p.id::text          AS id,
      p.name,
      p.price,
      p.is_available,
      p.description,
      p.category,
      p.sub_category,
      p.tags,
      p.image_url,
      p.product_url,
      p.seller_id::text   AS seller_id,
      s.phone             AS seller_phone,
      (p.embedding IS NOT NULL) AS has_embedding
    FROM products p
    LEFT JOIN sellers s ON s.id = p.seller_id
    ORDER BY p.name
  `);

  const products = raw.rows as unknown as LegacyProductRow[];
  const postEntity = new PostEntity();

  if (mode === "dry-run") {
    console.log("DRY RUN — no se escribe nada en la base de datos.\n");
    console.table(
      products.map((product) => ({
        name: product.name,
        price: product.price,
        category: legacyCategory(product.category) ?? "—",
        sub_category: legacySubCategory(product.sub_category) ?? "—",
        origin: LEGACY_PRODUCT_ORIGIN,
        whatsapp: legacyWhatsapp(product.seller_phone) ?? "—",
        embedding: product.has_embedding ? "se reutiliza" : "sin vector",
        slug: postEntity.generateSlug(product.name),
      })),
    );
    console.log(`\n${products.length} productos listos para migrar.`);
    return;
  }

  const email = adminEmail();
  const ownerRows = email
    ? await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1)
    : await db.select({ id: users.id }).from(users).limit(1);

  if (ownerRows.length === 0) {
    console.error(
      email
        ? `ERROR: no existe un usuario con el correo "${email}" (HAZLO_SANO_ADMIN_EMAILS).`
        : "ERROR: la tabla users está vacía.",
    );
    process.exit(1);
  }

  const ownerId = ownerRows[0].id;
  let inserted = 0;
  let skipped = 0;

  for (const product of products) {
    const existing = await db.execute(
      sql`SELECT 1 FROM posts WHERE id = ${product.id} LIMIT 1`,
    );

    if (existing.rows.length > 0) {
      console.log(`  ya existe, se omite: ${product.name}`);
      skipped++;
      continue;
    }

    const slug = await uniqueSlug(postEntity.generateSlug(product.name));
    const tagsJson = JSON.stringify(
      Array.isArray(product.tags) ? product.tags : [],
    );

    await db.transaction(async (tx) => {
      await tx.execute(sql`
        INSERT INTO posts (
          id, user_id, price, kind, origin, category, sub_category,
          is_available, seller_id, external_url,
          contact_phone, contact_whatsapp, created_at
        ) VALUES (
          ${product.id},
          ${ownerId},
          ${product.price},
          'producto',
          ${LEGACY_PRODUCT_ORIGIN},
          ${legacyCategory(product.category)},
          ${legacySubCategory(product.sub_category)},
          ${product.is_available},
          ${product.seller_id}::uuid,
          ${product.product_url},
          ${product.seller_phone},
          ${legacyWhatsapp(product.seller_phone)},
          NOW()
        )
      `);

      // El embedding se copia dentro de PostgreSQL: nunca se serializa a JS ni se regenera.
      await tx.execute(sql`
        INSERT INTO post_translations (post_id, locale, title, slug, content, tags, embedding)
        SELECT
          ${product.id}, 'es', ${product.name}, ${slug},
          ${product.description ?? product.name}, ${tagsJson}::json, pr.embedding
        FROM products pr
        WHERE pr.id = ${product.id}::uuid
      `);

      if (product.image_url) {
        await tx.execute(sql`
          INSERT INTO post_media (post_id, url, type, alt, sort_order)
          VALUES (${product.id}, ${product.image_url}, 'image', ${product.name}, 0)
        `);
      }
    });

    console.log(
      `  migrado: ${product.name} → /${slug} (${product.has_embedding ? "con embedding" : "sin embedding"})`,
    );
    inserted++;
  }

  console.log(
    `\nMigrados ${inserted}, omitidos ${skipped}. Revisa /productos.`,
  );
  console.log("Para deshacer: pnpm run migrate:products -- --remove");

  async function uniqueSlug(base: string): Promise<string> {
    const taken = await db.execute(
      sql`SELECT 1 FROM post_translations WHERE slug = ${base} LIMIT 1`,
    );

    if (taken.rows.length === 0) return base;

    return `${base}-${Date.now().toString(36)}`;
  }
}

migrateProductsToPosts()
  .then(() => {
    console.log("Done.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  });
