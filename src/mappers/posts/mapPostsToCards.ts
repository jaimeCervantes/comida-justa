import type { Post } from "~/types/Posts.d";


function getFileTypeFromUrl(url: string): string {
  const ext = url.split(".").pop()?.split("?")[0].toLocaleLowerCase();
  switch (ext) {
    case "mp4":
    case "webm":
    case "ogg":
      return `video/${ext}`;
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
    case "webp":
      return `image/${ext === "jpg" ? "jpeg" : ext}`;
    default:
      return "unknown";
  }
}
export function mapPostsToCards(posts: Post[]) {
  return posts.map((item: Post) => {
    const fileType = getFileTypeFromUrl(item.media?.url ?? item.image);
    return {
      id: item.id,
      title: item.title,
      price: item.price,
      content: item.content,
      media: {
        url: item.media?.url ?? item.image,
        alt: item.media?.alt ?? item.title,
        width: item.media?.width,
        height: item.media?.height,
        loading: item.media?.loading,
      },
      fileType: getFileTypeFromUrl(item.media.url),
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
