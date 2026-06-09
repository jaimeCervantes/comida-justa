import type { Post } from "~/infra/types/Posts";
import { createAbsoluteUrl } from "../createAbsoluteUrl";

export function mapPostsToCards(posts: Post[]) {
  return posts.map((item: Post) => {
    return mapOnePostToCard(item);
  });
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
    content: item.translations?.es?.content ?? item.content,
    media: item.media,
    createdAt:
      item.createdAt instanceof Date
        ? item.createdAt.toISOString()
        : item.createdAt?.toDate?.()?.toISOString() ??
          item.createdAt?._seconds * 1000,
    user: item.user,
    summary: item.summary,
    contactInfo: item.contactInfo,
    to: createAbsoluteUrl(to),
  };
}
