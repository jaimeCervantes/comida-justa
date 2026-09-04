import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import type { SQL } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import {
  PUBLISHED_POSTS,
  publishedOnly,
  publishedOrOwnedBy,
} from "./publishedPosts";

/** El SQL que de verdad se manda, sin hurgar en las estructuras internas de Drizzle. */
function toSql(fragment: SQL): string {
  return new PgDialect().sqlToQuery(fragment).sql;
}

const DATA_ACCESS_ROOT = join(process.cwd(), "src", "infra", "dataAccess");

/** Toda consulta que lea publicaciones tiene que decir qué deja ver. */
const READS_POSTS = /\b(FROM|JOIN)\s+posts\b/i;

/**
 * Las lecturas que a propósito NO filtran, con el motivo por el que se les perdona.
 *
 * Es una lista corta y con nombre y apellido: añadir una entrada obliga a escribir por qué, que es
 * exactamente la conversación que hay que tener antes de dejar una consulta sin filtrar.
 */
const ALLOWED: ReadonlyArray<{ file: string; reason: string }> = [
  {
    file: "getOnePostWithPaginatedComments/PostgresGetOnePost.ts",
    reason:
      "La ficha es la única pantalla que su autor y el admin deben poder abrir cuando está bajada. Devuelve el estado y quien decide es canBeViewedBy en la página.",
  },
  {
    file: "sellers/PostgresPostStore.ts",
    reason:
      "Resuelve la tienda de UNA publicación por su slug y solo la usa la ficha, que ya decidió si se enseña.",
  },
  {
    file: "managePost/PostgresPostAdminRepository.ts",
    reason:
      "Es la escritura del dueño y del admin sobre su propia publicación: filtrar aquí impediría corregir justo lo que se bajó.",
  },
  {
    file: "indexPostEmbedding/PostgresPostEmbeddingRepository.ts",
    reason:
      "Indexa para el chatbot. El slice 2 decide qué se indexa antes de llamar aquí; este repositorio no elige.",
  },
  {
    file: "moderatePost/PostgresModerationRepository.ts",
    reason:
      "Es el panel: existe justamente para leer lo que NO está publicado. Filtrar aquí lo dejaría siempre vacío.",
  },
  {
    file: "orders/PostgresOrderRepository.ts",
    reason:
      "Mueve el inventario de un pedido ya hecho. Filtrar aquí sería lo contrario de lo correcto: lo que se pidió se descuenta aunque la publicación se bajara después, y saltárselo dejaría el número mintiendo. No lee para enseñar nada.",
  },
  {
    file: "posts/PostgresPostQueryRepository.ts",
    reason:
      "Filtra de verdad, pero en el embudo (getPaginatedPosts) y en los reportes de admin, que cuentan TODO a propósito. Cubierto por sus propias pruebas.",
  },
];

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);

    if (statSync(full).isDirectory()) return sourceFiles(full);
    if (!entry.endsWith(".ts") || entry.endsWith(".test.ts")) return [];

    return [full];
  });
}

describe("PUBLISHED_POSTS", () => {
  it("compara contra el estado publicado", () => {
    expect(toSql(PUBLISHED_POSTS)).toContain("p.moderation_status");
  });

  it("publishedOnly respeta el alias que se le pida", () => {
    expect(toSql(publishedOnly("post"))).toContain("post.moderation_status");
  });

  it("sin viewer, publishedOrOwnedBy es exactamente el filtro normal", () => {
    expect(publishedOrOwnedBy(null)).toBe(PUBLISHED_POSTS);
    expect(publishedOrOwnedBy(undefined)).toBe(PUBLISHED_POSTS);
    expect(publishedOrOwnedBy("")).toBe(PUBLISHED_POSTS);
  });

  it("con viewer, deja pasar además lo suyo", () => {
    const query = toSql(publishedOrOwnedBy("user-1"));

    expect(query).toContain("p.moderation_status");
    expect(query).toContain("p.user_id");
    expect(query).toContain(" OR ");
  });
});

/**
 * La red de verdad: que nadie lea `posts` sin decir qué deja ver.
 *
 * Nueve repositorios leen esa tabla y el fallo probable de esta feature no es escribir mal un
 * filtro, es que dentro de tres meses alguien añada una consulta nueva y no se acuerde. Un
 * `typecheck` no lo ve y una prueba de unidad tampoco: solo se descubre cuando algo que un admin
 * bajó reaparece en una pantalla.
 */
describe("toda lectura de posts filtra por estado", () => {
  const offenders = sourceFiles(DATA_ACCESS_ROOT)
    .map((file) => ({
      path: relative(DATA_ACCESS_ROOT, file).replace(/\\/g, "/"),
      body: readFileSync(file, "utf8"),
    }))
    .filter(({ body }) => READS_POSTS.test(body))
    .filter(({ body }) => !body.includes("PUBLISHED_POSTS"))
    .filter(({ path }) => !ALLOWED.some((entry) => entry.file === path));

  it("no hay ninguna consulta sin filtro ni excusa escrita", () => {
    expect(offenders.map((entry) => entry.path)).toEqual([]);
  });

  it("la lista de excepciones sigue siendo de archivos que existen", () => {
    const existing = sourceFiles(DATA_ACCESS_ROOT).map((file) =>
      relative(DATA_ACCESS_ROOT, file).replace(/\\/g, "/"),
    );

    for (const entry of ALLOWED) {
      expect(existing, `${entry.file} ya no existe`).toContain(entry.file);
    }
  });
});
