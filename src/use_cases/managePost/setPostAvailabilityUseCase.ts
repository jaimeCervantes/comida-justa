import { isSellable } from "~/domain/entities/post/availability";
import {
  PostAdminError,
  PostNotFoundError,
  PostOwnershipError,
} from "~/domain/entities/post/errors";
import type IPostAdminRepository from "./ports/IPostAdminRepository";

export interface SetPostAvailabilityInput {
  postId: string;
  userId: string;
  isAvailable: boolean;
}

export type SetPostAvailabilityResult =
  | { isAvailable: boolean; errorMessage?: undefined }
  | { isAvailable?: undefined; errorMessage: string };

/**
 * Marca un producto como agotado o vuelve a ofrecerlo.
 *
 * Es lo que le faltaba a `posts.is_available`, que existía desde el catálogo unificado sin ninguna
 * forma de cambiarla: hasta ahora nadie podía dejar de ofrecer lo que se le acabó, y el chatbot lo
 * seguía recomendando.
 */
export default class SetPostAvailabilityUseCase {
  constructor(private readonly postRepository: IPostAdminRepository) {}

  async execute({
    postId,
    userId,
    isAvailable,
  }: SetPostAvailabilityInput): Promise<SetPostAvailabilityResult> {
    try {
      const post = await this.postRepository.findById(postId);

      if (!post) throw new PostNotFoundError();
      if (post.ownerId !== userId) throw new PostOwnershipError();

      // Un anuncio no se agota: se ignora en vez de guardar un estado sin significado.
      if (!isSellable(post)) {
        return { isAvailable: post.isAvailable };
      }

      await this.postRepository.setAvailability(postId, isAvailable);

      return { isAvailable };
    } catch (error) {
      if (error instanceof PostAdminError) {
        return { errorMessage: error.message };
      }

      throw error;
    }
  }
}
