import {
  type CategoryTaxonomy,
  labelFor,
} from "~/domain/entities/post/taxonomy";
import { resolvePostTranslation } from "~/domain/entities/post/translations";
import type { Post } from "~/infra/types/Posts";
import { createAbsoluteUrl } from "../createAbsoluteUrl";

/**
 * Lo que hace falta para pintar una tarjeta en el idioma del visitante.
 *
 * La etiqueta se resuelve **aquí, en el servidor**, y viaja como dato: `CardForList` se renderiza
 * también dentro de un árbol cliente (`PostsWithLoadMore`), donde no hay forma de leer la base.
 */
export interface CardMappingContext {
  locale: string;
  /** A qué idioma caer cuando la publicación no existe en el pedido. El del sitio, no el del post. */
  fallbackLocale: string;
  taxonomy: CategoryTaxonomy;
}

export function mapPostsToCards(posts: Post[], context: CardMappingContext) {
  return posts.map((item: Post) => mapOnePostToCard(item, context));
}

function normalizeCreatedAt(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value; // ya es ISO desde JSON
  if (typeof value === "number") return new Date(value * 1000).toISOString(); // epoch seconds
  if (value && typeof value === "object" && "toDate" in value) {
    return (value as { toDate(): Date }).toDate().toISOString(); // Firestore Timestamp
  }
  if (value && typeof value === "object" && "_seconds" in value) {
    return new Date(
      (value as { _seconds: number })._seconds * 1000,
    ).toISOString();
  }
  return "";
}

export function mapOnePostToCard(item: Post, context: CardMappingContext) {
  const translation = resolvePostTranslation(
    item.translations,
    context.locale,
    context.fallbackLocale,
  );
  const title = translation?.title ?? item.title;
  const slug =
    translation?.slug ??
    `${String(title ?? "")
      .toLowerCase()
      .replace(/\s/g, "-")}-${item.id}`;
  const to = `/${slug}`;

  return {
    id: item.id,
    /**
     * El slug **suelto**, además de `to`.
     *
     * `to` sale absoluto de `createAbsoluteUrl` porque lo consume un ancla, y de una URL absoluta
     * no se saca el slug recortando el primer `/`: los controles de dueño de la tarjeta armaban
     * `/editar/http://localhost:3000/suero-natural`. El dato ya se calcula aquí arriba; publicarlo
     * cuesta una línea y evita que cada consumidor lo reconstruya a su manera.
     */
    slug,
    title,
    price: item.price,
    kind: item.kind,
    origin: item.origin ?? null,
    distanceMeters: item.distanceMeters ?? null,
    // Las claves se conservan para filtros y analítica; para pintar se usa `categoryLabel`.
    category: item.category ?? null,
    subCategory: item.subCategory ?? null,
    isAvailable: item.isAvailable,
    /** La sub-categoría gana sobre la categoría por ser la más específica. */
    categoryLabel:
      labelFor(context.taxonomy, item.subCategory, context.locale) ??
      labelFor(context.taxonomy, item.category, context.locale),
    content: translation?.content ?? item.content,
    /**
     * El idioma en el que de verdad se está leyendo la tarjeta, que no siempre es el pedido.
     *
     * Hoy las 24 publicaciones existen solo en español, así que en inglés todas caen al respaldo.
     * Publicarlo permite que quien pinta lo diga en vez de fingir que el catálogo está traducido.
     */
    contentLocale: translation?.locale ?? context.fallbackLocale,
    isTranslationFallback: translation?.isFallback ?? true,
    media: item.media,
    createdAt: normalizeCreatedAt(item.createdAt),
    user: item.user,
    summary: item.summary,
    contactInfo: item.contactInfo,
    to: createAbsoluteUrl(to),
  };
}
