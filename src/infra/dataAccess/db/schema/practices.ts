import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  vector,
} from "drizzle-orm/pg-core";
import { users } from "./auth";
import { categories } from "./categories";

/**
 * Espejo del esquema que administra Alembic en el backend Python
 * (`0049_2026-09-04_add_practice_catalog.py`, ver `docs/data/001-2026-06-19-database.md`).
 * Nunca correr `drizzle-kit generate/migrate` contra esta BD: se edita a mano después de que la
 * migración de Alembic quedó aplicada.
 *
 * El catálogo de prácticas de los cuatro pilares y la bibliografía que las sostiene. Vivían como
 * prosa traducida en `pillarPages.*` y como un array de DOIs pelados en `references.ts`, así que la
 * misma acción estaba escrita tres veces por idioma y el bot de Telegram —que comparte esta base—
 * no podía leer ninguna de las dos.
 */

/**
 * Los cuatro pilares, como filas.
 *
 * Existe teniendo `categories` porque esa tabla tiene **seis** raíces: además de los pilares están
 * `cuidado_personal` y `hogar_y_limpieza`. Una FK directa a `categories.key` dejaría que una
 * práctica se declarara pilar «hogar y limpieza».
 */
export const pillars = pgTable("pillars", {
  key: text("key").primaryKey(),
  /** La raíz de la taxonomía de la que cuelga lo que se compra para practicarlo. */
  categoryKey: text("category_key")
    .notNull()
    .unique()
    .references(() => categories.key, {
      onUpdate: "cascade",
      onDelete: "restrict",
    }),
  slug: text("slug").notNull().unique(),
  /**
   * Cómo nombra el bot a este pilar (`Sleep and rest`, …).
   *
   * La equivalencia vivía en tres sitios que no se conocían: una lista de literales en
   * `orchestrator.py`, una enumeración dentro del prompt de la tabla `prompts`, y
   * `habitChallengeExperiences.ts` de este repositorio. Aquí se afirma una vez.
   */
  botIntent: text("bot_intent").unique(),
  sortOrder: integer("sort_order").notNull().default(0),
});

/**
 * Un estudio, identificado por su DOI **sin** el prefijo `https://doi.org/`.
 *
 * El DOI es el identificador y la URL es una forma de resolverlo; guardar la URL obligaría a
 * recortarla en cada consulta. Título, revista y año son nulos cuando Crossref no conoce el DOI: se
 * pierde el título, nunca el enlace.
 */
export const studies = pgTable("studies", {
  id: uuid("id").defaultRandom().primaryKey(),
  doi: text("doi").notNull().unique(),
  title: text("title"),
  journal: text("journal"),
  year: smallint("year"),
  /** `rct` | `meta_analysis` | `systematic_review` | `cohort` | `cross_sectional` | `mechanism` | `guideline`. */
  design: text("design"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Una práctica: qué se hace, cuánto cuesta hacerla y quién la propuso.
 *
 * `authorUserId` nulo significa «curada por la casa». Nace desde la primera migración aunque hoy
 * nadie proponga prácticas: es la columna que convierte esto en red social sin una segunda
 * migración, y `users` ya es una sola tabla para el sitio y para el bot.
 */
export const practices = pgTable(
  "practices",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    key: text("key").notNull().unique(),
    /** El puente con los cuatro retos atómicos; nulo en las demás. */
    challengeKey: text("challenge_key").unique(),
    /** Nulo cuando la práctica no se mide en minutos: un cuarto oscuro no dura nada. */
    effortMinutes: smallint("effort_minutes"),
    /** 0 gratis · 1 poco · 2 compra. Tres niveles y no un precio, que depende de dónde se compre. */
    costLevel: smallint("cost_level"),
    authorUserId: text("author_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    /** `draft` | `published` | `retired`. */
    status: text("status").notNull().default("draft"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("ix_practices_author").on(table.authorUserId)],
);

/**
 * El texto de una práctica, por idioma.
 *
 * `embedding` vive aquí y no en `practices` por la misma razón que en `post_translations`: se deriva
 * del TEXTO y el texto cambia con el idioma. 768 dimensiones = `gemini-embedding-001`, el mismo
 * modelo del catálogo; con otro modelo la consulta no falla, devuelve vecinos absurdos.
 *
 * `safetyNote` es del contenido y no de la presentación: en el sitio el artículo entero da contexto,
 * pero en un chat la práctica llega sola y la advertencia tiene que viajar pegada a ella.
 */
export const practiceTranslations = pgTable(
  "practice_translations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    practiceId: uuid("practice_id")
      .notNull()
      .references(() => practices.id, { onDelete: "cascade" }),
    locale: text("locale").notNull(),
    title: text("title").notNull(),
    /** La promesa en una frase. Es también lo que el estudio ligado sostiene. */
    summary: text("summary").notNull(),
    /** Cuándo y dónde. La primera ley: lo que separa un consejo de un hábito. */
    cue: text("cue"),
    howTo: text("how_to"),
    /** Qué basta para que cuente. Nulo cuando la práctica entera ya es el mínimo. */
    minimum: text("minimum"),
    safetyNote: text("safety_note"),
    embedding: vector("embedding", { dimensions: 768 }),
  },
  (table) => [
    unique("uq_practice_translations_locale").on(
      table.practiceId,
      table.locale,
    ),
  ],
);

/**
 * A qué pilares sirve una práctica.
 *
 * Es N:N y no una columna porque respirar despacio es Sueño **y** es Mente. Con una columna habría
 * que escribir la práctica dos veces, que es justo el defecto que este modelo viene a arreglar.
 * `isPrimary` decide de qué pilar es portada, y el índice parcial único deja una sola.
 */
export const practicePillars = pgTable(
  "practice_pillars",
  {
    practiceId: uuid("practice_id")
      .notNull()
      .references(() => practices.id, { onDelete: "cascade" }),
    pillarKey: text("pillar_key")
      .notNull()
      .references(() => pillars.key, {
        onUpdate: "cascade",
        onDelete: "restrict",
      }),
    isPrimary: boolean("is_primary").notNull().default(false),
  },
  (table) => [
    primaryKey({ columns: [table.practiceId, table.pillarKey] }),
    uniqueIndex("uq_practice_pillars_one_primary")
      .on(table.practiceId)
      .where(sql`${table.isPrimary}`),
    index("ix_practice_pillars_pillar").on(table.pillarKey),
  ],
);

/**
 * Qué estudios sostienen una práctica.
 *
 * Sin campo `claim`: la afirmación que el estudio sostiene **es** el `summary` de la práctica, y un
 * `claim` por par sería texto traducible —o sea otra tabla— para decir otra vez lo mismo.
 *
 * `RESTRICT` hacia `studies`: retirar una práctica no puede llevarse por delante un estudio que
 * otras citan.
 */
export const practiceStudies = pgTable(
  "practice_studies",
  {
    practiceId: uuid("practice_id")
      .notNull()
      .references(() => practices.id, { onDelete: "cascade" }),
    studyId: uuid("study_id")
      .notNull()
      .references(() => studies.id, { onDelete: "restrict" }),
  },
  (table) => [
    primaryKey({ columns: [table.practiceId, table.studyId] }),
    index("ix_practice_studies_study").on(table.studyId),
  ],
);

/**
 * La bibliografía de un pilar, aparte de las citas de cada práctica.
 *
 * Son dos relaciones distintas y las dos son reales: `practiceStudies` dice «este estudio sostiene
 * esta acción», y esta dice «este estudio es parte del cuerpo de evidencia del pilar». De los 43
 * estudios del descanso, sólo 13 sostienen una práctica concreta; el resto —la posición de la AASM,
 * por ejemplo— explica por qué el pilar existe, no qué hacer esta noche.
 *
 * Es, literalmente, lo que hoy codifican los cuatro arrays de `references.ts`, hecho dato.
 */
export const pillarStudies = pgTable(
  "pillar_studies",
  {
    pillarKey: text("pillar_key")
      .notNull()
      .references(() => pillars.key, {
        onUpdate: "cascade",
        onDelete: "cascade",
      }),
    studyId: uuid("study_id")
      .notNull()
      .references(() => studies.id, { onDelete: "restrict" }),
    /** Ni alfabético ni por año: el orden en que se construyó la lista, que agrupa por tema. */
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [
    primaryKey({ columns: [table.pillarKey, table.studyId] }),
    index("ix_pillar_studies_study").on(table.studyId),
  ],
);

/**
 * Quién practica qué, desde dónde y desde cuándo.
 *
 * `public.users` ya es una sola tabla para el sitio y para el bot —15 usuarios con `email`, 6 sólo
 * con su id de Telegram—, así que empezar una práctica por chat y verla en la web es un `INSERT`, no
 * un modelo nuevo. `source` guarda **por dónde entró**, no a quién pertenece: nada filtra por él.
 *
 * **Dejar una práctica no borra la fila.** Se marca `stoppedAt`, porque dejarla es información y
 * porque volver —que es lo que este producto premia por encima de todo— tiene que reabrir la misma
 * fila, no crear una segunda. De ahí que la clave sea el par y no un uuid.
 *
 * `sharingEnabled` nace en `false`, igual que `habitChallengeProgress`: aparecer con nombre en una
 * pantalla pública es una decisión, no un efecto secundario de practicar.
 */
export const userPractices = pgTable(
  "user_practices",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    practiceId: uuid("practice_id")
      .notNull()
      .references(() => practices.id, { onDelete: "cascade" }),
    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    /** Nulo mientras siga practicándose. */
    stoppedAt: timestamp("stopped_at", { withTimezone: true }),
    sharingEnabled: boolean("sharing_enabled").notNull().default(false),
    /** `web` | `telegram` | `whatsapp`. */
    source: text("source").notNull().default("web"),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.practiceId] }),
    index("ix_user_practices_practice")
      .on(table.practiceId)
      .where(sql`${table.stoppedAt} IS NULL`),
  ],
);
