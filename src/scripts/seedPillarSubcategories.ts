/**
 * Abre sub-categorías para los tres pilares que hoy están vacíos.
 *
 * Sin ellas, `movimiento_y_ejercicio`, `mente_y_espiritu` y `sueno_y_descanso` existen como
 * categorías de nivel 1 pero no tienen dónde colgar nada: el selector de `/publicar` ofrece la
 * categoría y luego una sub-categoría vacía, y quien publica se queda a medias.
 *
 * **Es configuración, no esquema**: `categories` se llena sin migración desde `/admin/catalogo`
 * (ver `taxonomia-centralizada.md`). Este script hace de una vez lo que ahí se haría a mano una por
 * una, y es **idempotente** — se puede correr dos veces sin duplicar nada.
 *
 * Las claves salen del vocabulario que ya usan los pilares y sus retos; las etiquetas se traducen en
 * `category_translations`, no aquí.
 *
 * Uso: `pnpm run seed:pillar-subcategories`
 */
import { resolve } from "node:path";
import { config } from "dotenv";
import { sql } from "drizzle-orm";

config({ path: resolve(process.cwd(), ".env.development") });

type SubCategory = {
  key: string;
  parentKey: string;
  es: string;
  en: string;
};

/** Cuatro por pilar: suficiente para clasificar sin convertir el selector en un catálogo. */
const SUBCATEGORIES: readonly SubCategory[] = [
  // movimiento_y_ejercicio
  {
    key: "carreras_y_rodadas",
    parentKey: "movimiento_y_ejercicio",
    es: "Carreras y rodadas",
    en: "Runs and rides",
  },
  {
    key: "entrenamiento",
    parentKey: "movimiento_y_ejercicio",
    es: "Entrenamiento",
    en: "Training",
  },
  {
    key: "caminatas",
    parentKey: "movimiento_y_ejercicio",
    es: "Caminatas",
    en: "Walks and hikes",
  },
  {
    key: "yoga_y_estiramiento",
    parentKey: "movimiento_y_ejercicio",
    es: "Yoga y estiramiento",
    en: "Yoga and stretching",
  },

  // sueno_y_descanso
  {
    key: "higiene_del_sueno",
    parentKey: "sueno_y_descanso",
    es: "Higiene del sueño",
    en: "Sleep hygiene",
  },
  {
    key: "siesta_y_pausas",
    parentKey: "sueno_y_descanso",
    es: "Siesta y pausas",
    en: "Naps and breaks",
  },
  {
    key: "ritmo_circadiano",
    parentKey: "sueno_y_descanso",
    es: "Ritmo circadiano",
    en: "Circadian rhythm",
  },

  // mente_y_espiritu
  {
    key: "meditacion",
    parentKey: "mente_y_espiritu",
    es: "Meditación",
    en: "Meditation",
  },
  {
    key: "respiracion",
    parentKey: "mente_y_espiritu",
    es: "Respiración",
    en: "Breathing",
  },
  {
    key: "acompanamiento",
    parentKey: "mente_y_espiritu",
    es: "Acompañamiento",
    en: "Support and therapy",
  },
];

async function main(): Promise<void> {
  const { db } = await import("~/infra/dataAccess/db/connection");

  let created = 0;

  for (const [index, sub] of SUBCATEGORIES.entries()) {
    /* `ON CONFLICT DO NOTHING`: idempotente por diseño. Correrlo dos veces no duplica ni pisa una
       etiqueta que alguien haya ajustado desde el panel. */
    const inserted = await db.execute(sql`
      INSERT INTO categories (key, level, parent_key, is_active, sort_order)
      VALUES (${sub.key}, 2, ${sub.parentKey}, true, ${(index + 1) * 10})
      ON CONFLICT (key) DO NOTHING
    `);

    if ((inserted.rowCount ?? 0) > 0) created++;

    for (const [locale, label] of [
      ["es", sub.es],
      ["en", sub.en],
    ] as const) {
      await db.execute(sql`
        INSERT INTO category_translations (category_key, locale, label)
        VALUES (${sub.key}, ${locale}, ${label})
        ON CONFLICT DO NOTHING
      `);
    }
  }

  const total = await db.execute(sql`
    SELECT c.parent_key, COUNT(*)::int AS n
    FROM categories c WHERE c.level = 2 GROUP BY 1 ORDER BY 1
  `);

  console.log(`Sub-categorías creadas en esta corrida: ${created}`);
  console.log("Sub-categorías por pilar:", JSON.stringify(total.rows));

  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
