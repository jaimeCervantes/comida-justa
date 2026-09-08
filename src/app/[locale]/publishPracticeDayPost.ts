import { PRACTICE_POST_KIND } from "~/domain/entities/post/kind";
import PostEntity from "~/domain/entities/post/Post";
import type { PillarCategoryKey } from "~/domain/entities/post/publicationPillars";
import type { PostMediaFile } from "~/domain/entities/post/types";
import PostValidator from "~/domain/schemas/PostValidator";
import type { AppLocale } from "~/i18n/routing";
import { createPostRepository } from "~/infra/dataAccess/createOnePost/factory";
import CreateOnePostUseCase from "~/use_cases/createOnePost/createOnePostUseCase";

const postRepository = createPostRepository();
const createPracticePost = new CreateOnePostUseCase(
  new PostValidator(),
  new PostEntity(),
  postRepository,
);

/**
 * La publicación que deja practicar un día, venga del ritual de un pilar o del catálogo.
 *
 * **El slug es la deduplicación.** `practiceDaySlug` es determinista por persona, práctica y día, y
 * `createUniqueSlug` devuelve otro distinto cuando el que se le pasa ya está tomado. Que devuelva
 * algo distinto significa exactamente «esto ya se publicó hoy», así que aquí se corta en vez de
 * dejar nacer un duplicado con sufijo. Es lo que permite prescindir de una columna nueva en la base
 * compartida, que pertenece a `bot-whatsapp`.
 *
 * **No lanza.** Si la publicación falla, la repetición ya quedó guardada: el avance de la persona no
 * puede depender de que el feed haya aceptado su post.
 */
export async function publishPracticeDayPost({
  slug,
  title,
  content,
  category,
  userId,
  locale,
  media = [],
}: {
  slug: string;
  title: string;
  content: string;
  category: PillarCategoryKey;
  userId: string;
  locale: AppLocale;
  media?: PostMediaFile[];
}): Promise<void> {
  try {
    const available = await postRepository.createUniqueSlug(slug, locale);
    if (available !== slug) return;

    const result = await createPracticePost.execute(
      {
        title,
        slug,
        content,
        contactInfo: { phone: "" },
        price: null,
        kind: PRACTICE_POST_KIND,
        origin: null,
        category,
        subCategory: null,
        sellerId: null,
        startsAt: null,
        endsAt: null,
        durationMinutes: null,
        createdAt: new Date(),
        media,
        user: { id: userId },
      },
      locale,
    );

    if (result.error) {
      console.error("No se pudo publicar la práctica del día:", result.error);
    }
  } catch (error) {
    console.error("No se pudo publicar la práctica del día:", error);
  }
}
