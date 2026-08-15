import { resolve } from "node:path";
import { config } from "dotenv";

config({ path: resolve(process.cwd(), ".env.development") });

/**
 * Una **segunda tienda** en la base compartida, para poder ver de verdad el carrito de varias
 * tiendas.
 *
 * Hasta el slice 5 de `docs/features/pedidos.md` la base tenía un solo vendedor —Hazlo Sano—, así
 * que `groupBySeller` siempre devolvía un grupo y las dos piezas que solo importan con dos tiendas
 * (el total de la compra y el `checkout_id` compartido) nunca se ejercitaron fuera de Vitest. Una de
 * las dos estaba mal.
 *
 * **Es una tienda de prueba y se llama como tal**: cualquiera que la vea en el catálogo tiene que
 * saber que no le va a vender nada. Y se deshace entera con `--remove`, pedidos incluidos.
 *
 *   pnpm run seed:demo-seller             crea la tienda y sus productos
 *   pnpm run seed:demo-seller -- --remove la borra con todo lo que colgaba de ella
 *   pnpm run seed:demo-seller -- --dry-run enseña qué haría, sin tocar la base
 */
const STORE = {
  name: "Panadería de prueba",
  slug: "panaderia-de-prueba",
  category: "Food",
  /** `sellers.phone` es UNIQUE: no puede chocar con el 2781126948 de Hazlo Sano. */
  phone: "2789990088",
  description:
    "Tienda de PRUEBA para verificar el carrito de varias tiendas. No vende nada real.",
};

/** A 3 km del ancla: cerca, para que aparezca donde aparecen las tiendas de la comunidad. */
const BRANCH_DISTANCE_KM = 3;

const PRODUCTS = [
  {
    slug: "prueba-pan-de-campo",
    title: "[PRUEBA] Pan de campo",
    price: 60,
    content:
      "Producto de PRUEBA de la Panadería de prueba. Existe para verificar que un carrito con dos " +
      "tiendas se agrupa, se suma y se confirma por separado. No está a la venta.",
  },
  {
    slug: "prueba-bolillo-integral",
    title: "[PRUEBA] Bolillo integral",
    price: 12,
    content:
      "Producto de PRUEBA de la Panadería de prueba. No está a la venta: acompaña al pan de campo " +
      "para que la tienda tenga más de un renglón en el carrito.",
  },
] as const;

const MEDIA_URL =
  "https://storage.googleapis.com/products_and_services/images/pan-de-masa-madre.jpg";

type Mode = "insert" | "dry-run" | "remove";

function resolveMode(argv: string[]): Mode {
  if (argv.includes("--dry-run")) return "dry-run";
  if (argv.includes("--remove")) return "remove";

  return "insert";
}

/**
 * El punto a `km` del ancla sobre el mismo meridiano.
 *
 * Solo se mueve la latitud: un grado son ~111.32 km en cualquier meridiano, así que la distancia
 * sale sin meter el coseno de la longitud. Mismo truco que `seedStore` en las pruebas e2e.
 */
function latitudeAtKm(anchorLatitude: number, km: number): number {
  return anchorLatitude + km / 111.32;
}

async function seedDemoSeller(): Promise<void> {
  const mode = resolveMode(process.argv.slice(2));

  if (mode === "dry-run") {
    console.log("DRY RUN — no se escribe nada en la base de datos.\n");
    console.log(`  tienda: ${STORE.name} (/tienda/${STORE.slug})`);
    console.log(
      `  teléfono: ${STORE.phone} | sucursal a ${BRANCH_DISTANCE_KM} km del ancla`,
    );
    for (const product of PRODUCTS) {
      console.log(`  producto: ${product.title} — $${product.price}`);
    }

    return;
  }

  if (!process.env.DATABASE_URL) {
    console.error("ERROR: DATABASE_URL is missing.");
    process.exit(1);
  }

  const { sql } = await import("drizzle-orm");
  const { db } = await import("~/infra/dataAccess/db/connection");

  if (mode === "remove") {
    /* Los pedidos van los PRIMEROS: `customer_orders.seller_id` apunta a `sellers` desde la 0032,
       así que borrar la tienda con pedidos falla por el FK. Sus renglones caen por CASCADE, y las
       traducciones y la media de los posts también. */
    await db.execute(sql`
      DELETE FROM customer_orders
      WHERE seller_id IN (SELECT id FROM sellers WHERE slug = ${STORE.slug})
    `);
    await db.execute(sql`
      DELETE FROM posts
      WHERE seller_id IN (SELECT id FROM sellers WHERE slug = ${STORE.slug})
    `);
    await db.execute(sql`
      DELETE FROM branches
      WHERE seller_id IN (SELECT id FROM sellers WHERE slug = ${STORE.slug})
    `);
    await db.execute(sql`DELETE FROM sellers WHERE slug = ${STORE.slug}`);

    console.log(`Borrada la tienda de prueba "${STORE.name}" y todo lo suyo.`);

    return;
  }

  const { COMMUNITY_ANCHOR } = await import(
    "~/domain/entities/seller/proximity"
  );
  const { users } = await import("~/infra/dataAccess/db/schema/auth");
  const { postTranslations } = await import(
    "~/infra/dataAccess/db/schema/posts"
  );
  const { eq } = await import("drizzle-orm");
  const { default: PostgresPostRepository } = await import(
    "~/infra/dataAccess/createOnePost/PostgresPostRepository"
  );

  const existing = await db.execute(
    sql`SELECT id::text AS id FROM sellers WHERE slug = ${STORE.slug} LIMIT 1`,
  );
  let sellerId = (existing.rows as Array<{ id: string }>)[0]?.id;

  if (sellerId) {
    console.log(`  ya existe la tienda, se reutiliza: /tienda/${STORE.slug}`);
  } else {
    /* `user_id` se queda en NULL a propósito, igual que en `seedStore`: colgarla de una cuenta real
       le quitaría a su dueño el formulario de alta de tienda en `/cuenta`. Una tienda sin cuenta es
       algo que la base ya admite —los proveedores que creó el bot son así—. */
    const created = await db.execute(sql`
      INSERT INTO sellers (name, slug, category, phone, description, user_id)
      VALUES (${STORE.name}, ${STORE.slug}, ${STORE.category}, ${STORE.phone},
              ${STORE.description}, NULL)
      RETURNING id::text AS id
    `);

    sellerId = (created.rows as Array<{ id: string }>)[0].id;
    console.log(`  creada la tienda: /tienda/${STORE.slug}`);

    const latitude = latitudeAtKm(
      COMMUNITY_ANCHOR.latitude,
      BRANCH_DISTANCE_KM,
    );

    await db.execute(sql`
      INSERT INTO branches (seller_id, name, address, map_url, location)
      VALUES (
        ${sellerId}::uuid,
        ${`Sucursal ${STORE.name}`},
        ${`A ${BRANCH_DISTANCE_KM} km del centro de la comunidad (PRUEBA)`},
        ${`https://maps.google.com/?q=${latitude},${COMMUNITY_ANCHOR.longitude}`},
        ST_SetSRID(ST_MakePoint(${COMMUNITY_ANCHOR.longitude}, ${latitude}), 4326)::geography
      )
    `);
  }

  const [owner] = await db.select({ id: users.id }).from(users).limit(1);

  if (!owner) {
    console.error("ERROR: la tabla users está vacía; un post necesita autor.");
    process.exit(1);
  }

  const repository = new PostgresPostRepository();
  let inserted = 0;

  for (const product of PRODUCTS) {
    const found = await db
      .select({ postId: postTranslations.postId })
      .from(postTranslations)
      .where(eq(postTranslations.slug, product.slug))
      .limit(1);

    if (found.length > 0) {
      console.log(`  ya existe, se omite: ${product.slug}`);
      continue;
    }

    await repository.save({
      sellerId,
      title: product.title,
      slug: product.slug,
      content: product.content,
      price: product.price,
      kind: "producto",
      origin: "hazlo_sano_propio",
      contactInfo: { phone: STORE.phone, whatsapp: `52${STORE.phone}` },
      media: [{ url: MEDIA_URL, type: "image", alt: product.title }],
      user: { id: owner.id },
      createdAt: new Date(),
    });

    console.log(`  creado: ${product.slug} ($${product.price})`);
    inserted++;
  }

  console.log(
    `\nListo: ${inserted} producto(s) nuevos en "${STORE.name}". Añade uno al carrito junto a ` +
      "algo de Hazlo Sano y abre /carrito.",
  );
  console.log("Para deshacer: pnpm run seed:demo-seller -- --remove");
}

seedDemoSeller()
  .then(() => {
    console.log("Done.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
