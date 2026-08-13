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

      /* El filtro es por elemento y no por el primero. Antes bastaba con que el primero trajera URL
         —la media era una sola—, así que una lista con un hueco en medio habría insertado una fila
         con `url` vacía, que es `NOT NULL` pero no rechaza la cadena en blanco: una publicación con
         un archivo fantasma en la posición 2. */
      const mediaItems = postData.media.filter((item) => item?.url);

      if (mediaItems.length > 0) {
        await tx.insert(postMedia).values(
          /* El índice **después** de filtrar: `sort_order` es la posición en la publicación, no en
             lo que llegó, así que quitar un hueco no debe dejar un salto en la numeración. */
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
