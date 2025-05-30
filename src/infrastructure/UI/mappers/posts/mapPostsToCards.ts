import type { Post } from "~/infrastructure/types/Posts";
import { createAbsoluteUrl } from "../createAbsoluteUrl";


export function mapPostsToCards(posts: Post[]) {
  return posts.map((item: Post) => {
    const slug = item.slug ?? `${item.title?.toLowerCase()?.replace(/\s/g, "-")}-${item.id}`;
    const to = `/${slug}`;

    return {
      id: item.id,
      title: item.title,
      price: item.price,
      content: item.content,
      media: item.media,
      createdAt: item.createdAt?.toDate?.(),
      // for initial versions, we will only be focused in Mexico
      createdAtLocale: item.createdAt?.toDate?.()?.toLocaleString("es-MX", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      }),
      user: item.user,
      summary: item.summary,
      to: createAbsoluteUrl(to)
    };
  });
}
