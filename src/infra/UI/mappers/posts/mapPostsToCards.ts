import type { Post } from "~/infra/types/Posts";
import { createAbsoluteUrl } from "../createAbsoluteUrl";

export function mapPostsToCards(posts: Post[]) {
  return posts.map((item: Post) => {
    return mapOnePostToCard(item);
  });
}

function normalizeCreatedAt(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value; // ya es ISO desde JSON
  if (typeof value === "number") return new Date(value * 1000).toISOString(); // epoch seconds
  if (value && typeof value === "object" && "toDate" in value) {
    return (value as { toDate(): Date }).toDate().toISOString(); // Firestore Timestamp
  }
  if (value && typeof value === "object" && "_seconds" in value) {
    return new Date((value as { _seconds: number })._seconds * 1000).toISOString();
  }
  return "";
}

export function mapOnePostToCard(item: Post) {
  const slug =
    item.translations?.es?.slug ??
    `${item.translations?.es?.title?.toLowerCase()?.replace(/\s/g, "-")}-${
      item.id
    }`;
  const to = `/${slug}`;

  return {
    id: item.id,
    title: item.translations?.es?.title ?? item.title,
    price: item.price,
    kind: item.kind,
    origin: item.origin ?? null,
    category: item.category ?? null,
    subCategory: item.subCategory ?? null,
    content: item.translations?.es?.content ?? item.content,
    media: item.media,
    createdAt: normalizeCreatedAt(item.createdAt),
    user: item.user,
    summary: item.summary,
    contactInfo: item.contactInfo,
    to: createAbsoluteUrl(to),
  };
}
