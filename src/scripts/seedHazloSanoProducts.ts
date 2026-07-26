import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.development") });

/**
 * Productos dummy de Hazlo Sano para poblar `/productos`, tomados de la página `/nosotros`:
 * el pan de masa madre de MMNaturalmente (Hazlo Sano es punto de venta oficial → reventa)
 * y la crema de cacahuate que hace Hazlo Sano (→ propio).
 *
 * La imagen apunta al logo local porque `next.config` solo permite dos hosts remotos; para
 * fotos reales, publica desde `/publicar` (la subida deja la URL en un host permitido).
 */
const DUMMY_PRODUCTS = [
  {
    slug: "pan-de-masa-madre-natural",
    title: "Pan de Masa Madre Natural (hogaza 1 kg)",
    price: 96,
    origin: "hazlo_sano_reventa",
    content:
      "Pan vivo de masa madre elaborado por MMNaturalmente, sin químicos ni levaduras industriales. " +
      "La fermentación pre-digiere parte del gluten, reduce el ácido fítico (mejor absorción de hierro, " +
      "zinc y magnesio) y libera energía de forma sostenida. Hazlo Sano es punto de venta oficial.",
  },
  {
    slug: "pan-de-masa-madre-semillas",
    title: "Pan de Masa Madre con Semillas (hogaza 1 kg)",
    price: 125,
    origin: "hazlo_sano_reventa",
    content:
      "Hogaza de masa madre de MMNaturalmente en sus variedades con semillas, hierbas finas, " +
      "arándanos o canela. Misma fermentación lenta: digestión ligera y energía estable, sin " +
      "aditivos industriales. Disponible en nuestra sede.",
  },
  {
    slug: "pan-de-masa-madre-chocolate",
    title: "Pan de Masa Madre de Chocolate (hogaza 1 kg)",
    price: 136,
    origin: "hazlo_sano_reventa",
    content:
      "Hogaza de masa madre de chocolate elaborada por MMNaturalmente. Pan vivo, fermentado con " +
      "masa madre natural, ideal para el desayuno o la merienda sin los picos de azúcar del pan comercial.",
  },
  {
    slug: "crema-de-cacahuate-natural",
    title: "Crema de Cacahuate Natural",
    price: 120,
    origin: "hazlo_sano_propio",
    content:
      "Solo contiene cacahuate: sin azúcar añadida, sin aceites refinados y sin conservadores. " +
      "Rica en proteína vegetal y grasas saludables. Ideal con pan de masa madre, plátano, avena o " +
      "fruta, o una cucharada directa cuando necesitas energía. Al no llevar emulsionantes, el aceite " +
      "natural sube a la superficie: mézclala bien antes de usarla.",
  },
] as const;

const MEDIA_URL = "https://storage.googleapis.com/products_and_services/images/pan-de-masa-madre.jpg";
const CONTACT = {
  phone: "2781126948",
  whatsapp: "522781126948",
};

type Mode = "insert" | "dry-run" | "remove";

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

async function seedHazloSanoProducts() {
  const mode = resolveMode(process.argv.slice(2));

  if (mode === "dry-run") {
    console.log("DRY RUN — no se escribe nada en la base de datos.\n");
    for (const product of DUMMY_PRODUCTS) {
      console.log(
        `  ${product.title}\n    slug: ${product.slug} | $${product.price} | kind: producto | origin: ${product.origin}`,
      );
    }
    console.log(`\nDueño: ${adminEmail() ?? "(primer usuario de la tabla users)"}`);
    return;
  }

  if (!process.env.DATABASE_URL) {
    console.error("ERROR: DATABASE_URL is missing.");
    process.exit(1);
  }

  console.log("Connecting to PostgreSQL...");
  const { db } = await import("~/infra/dataAccess/db/connection");
  const { eq } = await import("drizzle-orm");
  const { posts, postTranslations } = await import(
    "~/infra/dataAccess/db/schema/posts"
  );
  const { users } = await import("~/infra/dataAccess/db/schema/auth");

  if (mode === "remove") {
    let removed = 0;
    for (const product of DUMMY_PRODUCTS) {
      const found = await db
        .select({ postId: postTranslations.postId })
        .from(postTranslations)
        .where(eq(postTranslations.slug, product.slug))
        .limit(1);

      if (found.length === 0) continue;

      // Translations y media caen por ON DELETE CASCADE.
      await db.delete(posts).where(eq(posts.id, found[0].postId));
      console.log(`  borrado: ${product.slug}`);
      removed++;
    }
    console.log(`\nEliminados ${removed} de ${DUMMY_PRODUCTS.length} productos dummy.`);
    return;
  }

  const { default: PostgresPostRepository } = await import(
    "~/infra/dataAccess/createOnePost/PostgresPostRepository"
  );

  const email = adminEmail();
  const ownerRows = email
    ? await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1)
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
  const repository = new PostgresPostRepository();
  let inserted = 0;
  let skipped = 0;

  for (const product of DUMMY_PRODUCTS) {
    const existing = await db
      .select({ postId: postTranslations.postId })
      .from(postTranslations)
      .where(eq(postTranslations.slug, product.slug))
      .limit(1);

    if (existing.length > 0) {
      console.log(`  ya existe, se omite: ${product.slug}`);
      skipped++;
      continue;
    }

    await repository.save({
      title: product.title,
      slug: product.slug,
      content: product.content,
      price: product.price,
      kind: "producto",
      origin: product.origin,
      contactInfo: CONTACT,
      media: { url: MEDIA_URL, type: "image", alt: product.title },
      user: { id: ownerId },
      createdAt: new Date(),
    });

    console.log(`  creado: ${product.slug} ($${product.price}, ${product.origin})`);
    inserted++;
  }

  console.log(`\nCreados ${inserted}, omitidos ${skipped}. Revisa /productos.`);
  console.log("Para deshacer: pnpm run seed:products -- --remove");
}

seedHazloSanoProducts()
  .then(() => {
    console.log("Done.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
