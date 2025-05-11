import type { IPostEntity, IPostValidator } from "~/entities/post/types";
import { Post, User } from "~/entities/post/types";
import IPostRepository from "./ports/IPostRepository";
import IPostCreationDTO from "./dtos/IPostCreationDTO";
import IMediaStorageService from "./ports/IMediaStorageService";

interface CreatePostResult {
  id?: string;
  slug?: string;
  error?: any;
  errorMessage?: string;
}

export default class CreatePostUseCase {
  private postValidator: IPostValidator;
  private postEntity: IPostEntity;
  private postRepository: IPostRepository;
  private mediaStorageService: IMediaStorageService;

  constructor(
    postValidator: IPostValidator,
    postEntity: IPostEntity,
    postRepository: IPostRepository,
    mediaStorageService: IMediaStorageService
  ) {
    this.postValidator = postValidator;
    this.postEntity = postEntity;
    this.postRepository = postRepository;
    this.mediaStorageService = mediaStorageService;
  }

  public async execute(
    postInfo: Post
  ): Promise<CreatePostResult> {
    try {
      this.postValidator.validate(postInfo);
    } catch (error: any) {
      return {
        error,
        errorMessage: error.message || "Error de validación de los datos del post.",
      };
    }

    const postTitle = postInfo.title;

    let slug: string;
    try {
      slug = await this.defineSlug(postTitle, postInfo.slug as string);
    } catch (error: any) {
      console.error("Error generating slug:", error);
      return {
        error,
        errorMessage: error.message || "Algo salió mal al definir el slug del post.",
      };
    }

    const file = postInfo.file

    let fileType: string | null; // e.g., "image", "video", "audio"
    try {
      fileType = await this.mediaStorageService.validateFileAndGetType(file);
    } catch (error: any) {
      console.error("Error validating file type:", error);
      return {
        error,
        errorMessage: error.message,
      };
    }

    let fileUrl = '';
    try {
      fileUrl = await this.mediaStorageService.uploadFile(file);
    } catch (error: any) {
      console.error("Error uploading file to storage:", error);
      return {
        error,
        errorMessage: error.message || "Algo salió mal al subir el archivo al almacenamiento.",
      };
    }

    const finalPostData: IPostCreationDTO = {
      title: postTitle,
      content: postInfo.content,
      contactInfo: postInfo.contactInfo,
      slug,
      media: {
        url: fileUrl,
        type: fileType as string,
        alt: postTitle,
      },
      user: postInfo.user,
      createdAt: new Date()
    };


    try {
      const postId = await this.postRepository.save(finalPostData);

      return { id: postId, slug };

    } catch (error: any) {
      console.error("Error saving post to database:", error);
      return {
        error,
        errorMessage: error.message || "Algo salió mal al guardar el post en la base de datos.",
      };
    }
  }


  private async defineSlug(title: string, slug?: string): Promise<string> {
    if (!slug || slug.trim() === "") {
      return this.postEntity.generateSlug(title);
    }

    // At the moment just add a suffix number if the same slug string is found
    const finalSlug = await this.postRepository.createUniqueSlug(slug);

    return finalSlug;
  }
}