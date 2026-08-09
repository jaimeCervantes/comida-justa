import { eq, sql } from "drizzle-orm";
import { db } from "~/infra/dataAccess/db/connection";
import {
  postMedia,
  posts,
  postTranslations,
} from "~/infra/dataAccess/db/schema/posts";
import type IPostCreationDTO from "~/use_cases/createOnePost/dtos/IPostCreationDTO";
import type IPostRepository from "~/use_cases/createOnePost/ports/IPostRepository";

export default class PostgresPostRepository implements IPostRepository {
  async save(postData: IPostCreationDTO, lang: string = "es"): Promise<string> {
    const postId = crypto.randomUUID();

    await db.transaction(async (tx) => {
      await tx.insert(posts).values({
        id: postId,
        userId: postData.user.id,
        price: postData.price?.toString() ?? null,
        kind: postData.kind ?? "anuncio",
        origin: postData.origin ?? null,
        category: postData.category ?? null,
        subCategory: postData.subCategory ?? null,
        sellerId: postData.sellerId ?? null,
        contactPhone: postData.contactInfo.phone,
        contactEmail: postData.contactInfo.email ?? null,
        contactWhatsapp: postData.contactInfo.whatsapp ?? null,
        createdAt: postData.createdAt,
      });

      await tx.insert(postTranslations).values({
        postId,
        locale: lang,
        title: postData.title ?? "",
        slug: postData.slug ?? "",
        content: postData.content ?? "",
      });

      const mediaItems = Array.isArray(postData.media)
        ? postData.media
        : [postData.media];

      if (mediaItems.length > 0 && mediaItems[0]?.url) {
        await tx.insert(postMedia).values(
          mediaItems.map((item, index) => ({
            postId,
            url: item.url,
            type: item.type ?? "image",
            alt: item.alt ?? null,
            sortOrder: index,
            /* `null` y no `undefined`: Drizzle omite del INSERT las claves indefinidas, y la
               columna acabaría en su valor por omisión en vez de en el nulo explícito que
               significa «no lo sabemos». Aquí da lo mismo —no tienen `DEFAULT`— pero el día que
               alguien les ponga uno, esa diferencia deja de ser cosmética. */
            width: item.width ?? null,
            height: item.height ?? null,
          })),
        );
      }
    });

    return postId;
  }

  async createUniqueSlug(slug: string, _lang: string = "es"): Promise<string> {
    const rows = await db
      .select({ count: sql<number>`count(*)` })
      .from(postTranslations)
      .where(eq(postTranslations.slug, slug));

    const count = Number(rows[0].count);

    if (count > 0) {
      return `${slug}-${count}`;
    }

    return slug;
  }
}
