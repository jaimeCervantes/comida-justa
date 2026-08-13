import {
  PostAdminError,
  PostNotFoundError,
  PostOwnershipError,
} from "~/domain/entities/post/errors";
import type { IPostValidator, User } from "~/domain/entities/post/types";
import getErrorMessage from "~/domain/shared/getErrorMessage";
import type IPostAdminRepository from "./ports/IPostAdminRepository";

export interface UpdateOnePostInput {
  slug: string;
  userId: string;
  title: string;
  content: string;
  price: number | null;
  /**
   * Ya resuelta contra el rol de quien edita (`resolveOriginForUser`), igual que al publicar: si
   * un no-admin fuerza un `hazlo_sano_*` llega aquí en `null` y el validador rechaza el producto,
   * en vez de guardarlo con la marca puesta o sin procedencia.
   */
  origin: string | null;
  category: string | null;
  subCategory: string | null;
}

export type UpdateOnePostResult =
  | {
      postId: string;
      slug: string;
      locale: string;
      /** Si cambió el texto, el vector guardado ya no lo describe y hay que reindexar. */
      textChanged: boolean;
      errorMessage?: undefined;
    }
  | { errorMessage: string };

/**
 * Edita una publicación propia.
 *
 * **El slug no cambia.** Aunque el título sí: la dirección ya se compartió por WhatsApp, y
 * moverla dejaría muertos los enlaces que el vendedor repartió. Sostener el anterior con una
 * redirección es trabajo aparte.
 *
 * Devuelve `textChanged` en vez de reindexar aquí: generar el embedding es una llamada de red que
 * no debe estar en el camino crítico de guardar (mismo criterio que al publicar), así que la
 * decisión se toma aquí y el efecto lo dispara la capa de aplicación con `after()`.
 */
export default class UpdateOnePostUseCase {
  constructor(
    private readonly postRepository: IPostAdminRepository,
    private readonly postValidator: IPostValidator,
  ) {}

  async execute(input: UpdateOnePostInput): Promise<UpdateOnePostResult> {
    try {
      return await this.update(input);
    } catch (error) {
      if (error instanceof PostAdminError) {
        return { errorMessage: error.message };
      }

      return {
        errorMessage: getErrorMessage(
          error,
          "No se pudo guardar la publicación.",
        ),
      };
    }
  }

  private async update(
    input: UpdateOnePostInput,
  ): Promise<UpdateOnePostResult> {
    const post = await this.postRepository.findBySlug(input.slug);

    if (!post) throw new PostNotFoundError();
    if (post.ownerId !== input.userId) throw new PostOwnershipError();

    const title = input.title?.trim() ?? "";
    const content = input.content?.trim() ?? "";

    // Se valida con las mismas reglas que al publicar: un producto sigue necesitando precio y
    // procedencia. `kind` no viaja en el formulario —editar no cambia lo que la publicación es—,
    // así que se toma el guardado; el `origin` sí viaja, porque corregirlo es el punto.
    this.postValidator.validate({
      title,
      content,
      price: input.price,
      kind: post.kind as never,
      origin: input.origin as never,
      contactInfo: { phone: "" },
      /* Vacía, y ya no falsa. Editar no toca `post_media` (ver `EditPostForm`), así que aquí no hay
         nada que validar; antes se pasaba un archivo inventado con la URL en blanco solo para
         satisfacer el tipo singular. Por eso `validateMedia` no exige un mínimo: si lo exigiera,
         corregir un título sería imposible. */
      media: [],
      user: { id: post.ownerId } as User,
      createdAt: new Date(),
    });

    await this.postRepository.updateContent({
      postId: post.id,
      locale: post.locale,
      title,
      content,
      price: input.price,
      origin: input.origin,
      category: input.category,
      subCategory: input.subCategory,
    });

    return {
      postId: post.id,
      slug: post.slug,
      locale: post.locale,
      textChanged: title !== post.title || content !== post.content,
    };
  }
}
