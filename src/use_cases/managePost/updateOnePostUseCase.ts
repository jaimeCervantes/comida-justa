import {
  PostAdminError,
  PostNotFoundError,
  PostOwnershipError,
} from "~/domain/entities/post/errors";
import { EVENT_KIND, SERVICE_KIND } from "~/domain/entities/post/kind";
import type {
  IPostValidator,
  PostMediaFile,
  User,
} from "~/domain/entities/post/types";
import getErrorMessage from "~/domain/shared/getErrorMessage";
import type IPostAdminRepository from "./ports/IPostAdminRepository";

export interface UpdateOnePostInput {
  slug: string;
  userId: string;
  title: string;
  content: string;
  contactPhone: string;
  price: number | null;
  /**
   * Ya resuelta contra el rol de quien edita (`resolveOriginForUser`), igual que al publicar: si
   * un no-admin fuerza un `hazlo_sano_*` llega aquí en `null` y el validador rechaza el producto,
   * en vez de guardarlo con la marca puesta o sin procedencia.
   */
  origin: string | null;
  category: string | null;
  subCategory: string | null;
  startsAt?: Date | null;
  endsAt?: Date | null;
  durationMinutes?: number | null;
  /**
   * Los archivos que la publicación tendrá al guardar, en orden. Lista completa, no un delta.
   *
   * **El mínimo de uno no se comprueba aquí**, igual que al publicar: es una regla del formulario
   * —quien puede contestarle a la persona en su idioma es la Server Action, ver `errors.media`— y no
   * una condición para que la entidad sea coherente. Lo que sí vive en el dominio es la forma y el
   * tope, que los aplica `PostValidator.validateMedia`.
   */
  media: PostMediaFile[];
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
    const contactPhone = input.contactPhone?.trim() ?? "";
    const startsAt = post.kind === EVENT_KIND ? (input.startsAt ?? null) : null;
    const endsAt = post.kind === EVENT_KIND ? (input.endsAt ?? null) : null;
    const durationMinutes =
      post.kind === SERVICE_KIND ? (input.durationMinutes ?? null) : null;
    const price = post.kind === "anuncio" ? null : input.price;
    const origin = post.kind === "producto" ? input.origin : null;

    // Se valida con las mismas reglas que al publicar: un producto sigue necesitando precio y
    // procedencia. `kind` no viaja en el formulario —editar no cambia lo que la publicación es—,
    // así que se toma el guardado; el `origin` sí viaja, porque corregirlo es el punto.
    this.postValidator.validate({
      title,
      content,
      price,
      kind: post.kind as never,
      origin: origin as never,
      startsAt,
      endsAt,
      durationMinutes,
      contactInfo: { phone: contactPhone },
      /* Ya no va vacía: desde que la edición muestra los archivos, lo que llega aquí es la lista que
         la publicación va a tener, y el validador comprueba su forma y su tope igual que al
         publicar. Sigue sin exigir un mínimo, y ahí no ha cambiado nada: quien lo exige es la Server
         Action, que puede decirlo en el idioma de quien está mirando. */
      media: input.media,
      user: { id: post.ownerId } as User,
      createdAt: new Date(),
    });

    await this.postRepository.updateContent({
      postId: post.id,
      locale: post.locale,
      title,
      content,
      contactPhone,
      price,
      origin,
      category: input.category,
      subCategory: input.subCategory,
      startsAt,
      endsAt,
      durationMinutes,
      media: input.media,
    });

    return {
      postId: post.id,
      slug: post.slug,
      locale: post.locale,
      textChanged: title !== post.title || content !== post.content,
    };
  }
}
