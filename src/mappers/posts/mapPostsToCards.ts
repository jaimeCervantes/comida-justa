import type { Post } from "~/types/Posts.d";

export function mapPostsToCards(posts: Post[]) {
  return posts.map((item: Post) => {
    return {
      id: item.id,
      title: item.title,
      price: item.price,
      content: item.content,
      image: {
        src: item.image,
        alt: item.title,
      },
      // for initial versions, we will only be focused in Mexico
      createdAt: item.createdAt?.toDate(),
      createdAtLocale: item.createdAt?.toDate()?.toLocaleString("es-MX", {
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
      to:
        item.slug ??
        `${item.title?.toLowerCase()?.replace(/\s/g, "-")}-${item.id}`,
    };
  });
}
