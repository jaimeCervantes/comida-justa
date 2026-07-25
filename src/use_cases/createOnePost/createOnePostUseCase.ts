import type { IPostEntity, IPostValidator } from "~/domain/entities/post/types";
import { Post, User } from "~/domain/entities/post/types";
import IPostRepository from "./ports/IPostRepository";
import IPostCreationDTO from "./dtos/IPostCreationDTO";

interface CreatePostResult {
  id?: string;
  slug?: string;
  error?: any;
  errorMessage?: string;
}

export default class CreateOnePostUseCase {
  private postValidator: IPostValidator;
  private postEntity: IPostEntity;
  private postRepository: IPostRepository;

  constructor(
    postValidator: IPostValidator,
    postEntity: IPostEntity,
    postRepository: IPostRepository,
  ) {
    this.postValidator = postValidator;
    this.postEntity = postEntity;
    this.postRepository = postRepository;
  }

  public async execute(
    postInfo: Post,
    lang: string = "es",
  ): Promise<CreatePostResult> {
    try {
      this.postValidator.validate(postInfo);
    } catch (error: any) {
      return {
        error,
        errorMessage:
          error.message || "Error de validación de los datos del post.",
      };
    }

    const postTitle = postInfo.title as string;

    let slug: string;
    try {
      slug = await this.defineSlug(postTitle, postInfo.slug as string, lang);
    } catch (error: any) {
      console.error("Error generating slug:", error);
      return {
        error,
        errorMessage:
          error.message || "Algo salió mal al definir el slug del post.",
      };
    }

    const finalPostData: IPostCreationDTO = {
      title: postTitle,
      content: postInfo.content,
      contactInfo: postInfo.contactInfo,
      slug,
      price: postInfo.price ?? null,
      kind: postInfo.kind ?? "anuncio",
      origin: postInfo.origin ?? null,
      category: postInfo.category ?? null,
      subCategory: postInfo.subCategory ?? null,
      media: postInfo.media as IPostCreationDTO["media"],
      user: postInfo.user,
      createdAt: new Date(),
    };

    try {
      const postId = await this.postRepository.save(finalPostData, lang);

      return { id: postId, slug };
    } catch (error: any) {
      console.error("Error saving post to database:", error);
      return {
        error,
        errorMessage:
          error.message ||
          "Algo salió mal al guardar el post en la base de datos.",
      };
    }
  }

  private async defineSlug(
    title: string,
    slug?: string,
    lang?: string,
  ): Promise<string> {
    if (!slug || slug.trim() === "") {
      return this.postEntity.generateSlug(title);
    }

    // At the moment just add a suffix number if the same slug string is found
    const finalSlug = await this.postRepository.createUniqueSlug(slug, lang);

    return finalSlug;
  }
}
