import { describe, it, expect, vi, beforeEach } from "vitest";
import CreatePostUseCase from "./createOnePostUseCase";
import type { Post } from "~/domain/entities/post/types";
import { mockPostValidator, mockPostEntity, mockPostRepository } from "./mocks";
import { samplePostInfo } from "./dummies";

describe("CreatePostUseCase", () => {
  let createPostUseCase: CreatePostUseCase;

  beforeEach(() => {
    vi.clearAllMocks();

    createPostUseCase = new CreatePostUseCase(
      mockPostValidator,
      mockPostEntity,
      mockPostRepository,
    );
  });

  it("should successfully create a post when all dependencies work correctly", async () => {
    const expectedPostId = "post123";
    const expectedSlug = "test-post-title-unique";
    const expectedFileUrl = "http://hazlosano.com/files/test.jpg";
    const expectedFileType = "image";

    mockPostValidator.validate.mockReturnValue(undefined);
    mockPostRepository.createUniqueSlug.mockResolvedValue(expectedSlug);
    mockPostRepository.save.mockResolvedValue(expectedPostId);

    const result = await createPostUseCase.execute(samplePostInfo, "es");

    expect(mockPostValidator.validate).toHaveBeenCalledWith(samplePostInfo);
    expect(mockPostRepository.createUniqueSlug).toHaveBeenCalledWith(
      samplePostInfo.slug,
      "es",
    );
    expect(mockPostRepository.save).toHaveBeenCalledWith(
      {
        title: samplePostInfo.title,
        content: samplePostInfo.content,
        contactInfo: samplePostInfo.contactInfo,
        slug: expectedSlug,
        price: null,
        kind: "anuncio",
        origin: null,
        category: null,
        subCategory: null,
        media: {
          url: expectedFileUrl,
          type: expectedFileType,
          alt: samplePostInfo.title,
        },
        user: samplePostInfo.user,
        createdAt: expect.any(Date),
      },
      "es",
    ); // Assuming 'es' is the default language
    expect(result).toEqual({ id: expectedPostId, slug: expectedSlug });
    expect(result.error).toBeUndefined();
    expect(result.errorMessage).toBeUndefined();
  });

  // El caso de uso arma el DTO campo por campo: lo que no copie aquí no llega nunca al
  // repositorio, y `Post` los declara opcionales, así que TypeScript no avisa del olvido.
  it("should forward kind, origin, price and category when saving a product", async () => {
    const expectedSlug = "test-post-title-unique";
    const productInfo: Post = {
      ...samplePostInfo,
      kind: "producto",
      price: 120,
      origin: "hazlo_sano_propio",
      category: "alimentacion",
      subCategory: "jugos",
    };

    mockPostValidator.validate.mockReturnValue(undefined);
    mockPostRepository.createUniqueSlug.mockResolvedValue(expectedSlug);
    mockPostRepository.save.mockResolvedValue("post123");

    await createPostUseCase.execute(productInfo, "es");

    expect(mockPostRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "producto",
        origin: "hazlo_sano_propio",
        price: 120,
        category: "alimentacion",
        subCategory: "jugos",
      }),
      "es",
    );
  });

  it("should return a validation error if post validation fails", async () => {
    const validationError = new Error("Invalid post data");
    mockPostValidator.validate.mockImplementation(() => {
      throw validationError;
    });

    const result = await createPostUseCase.execute(samplePostInfo, "es");

    expect(mockPostValidator.validate).toHaveBeenCalledWith(samplePostInfo);
    expect(result).toEqual({
      error: validationError,
      errorMessage: "Invalid post data",
    });

    expect(mockPostEntity.generateSlug).not.toHaveBeenCalled();
    expect(mockPostRepository.createUniqueSlug).not.toHaveBeenCalled();
    expect(mockPostRepository.save).not.toHaveBeenCalled();
  });

  it("should return an error if slug definition fails", async () => {
    const slugError = new Error("Slug generation failed");
    mockPostValidator.validate.mockReturnValue(undefined); // Validation passes
    // Mocking the private method 'defineSlug' indirectly by making createUniqueSlug throw
    mockPostRepository.createUniqueSlug.mockRejectedValue(slugError);

    const result = await createPostUseCase.execute(samplePostInfo, "es");

    expect(mockPostValidator.validate).toHaveBeenCalledWith(samplePostInfo);
    expect(mockPostRepository.createUniqueSlug).toHaveBeenCalledWith(
      samplePostInfo.slug,
      "es",
    );
    expect(result).toEqual({
      error: slugError,
      errorMessage: "Slug generation failed", // Assuming defineSlug propagates the error message
    });
    expect(mockPostRepository.save).not.toHaveBeenCalled();
  });

  it("should return an error if saving the post to the repository fails", async () => {
    const repositoryError = new Error("");
    const expectedSlug = "test-post-title-unique";
    const expectedFileUrl = "http://hazlosano.com/files/test.jpg";
    const expectedFileType = "image";

    mockPostValidator.validate.mockReturnValue(undefined); // Validation passes
    mockPostRepository.createUniqueSlug.mockResolvedValue(expectedSlug); // Returns a unique slug
    mockPostRepository.save.mockRejectedValue(repositoryError); // Saving fails

    const result = await createPostUseCase.execute(samplePostInfo, "es");

    expect(mockPostValidator.validate).toHaveBeenCalledWith(samplePostInfo);
    expect(mockPostRepository.createUniqueSlug).toHaveBeenCalledWith(
      samplePostInfo.slug,
      "es",
    );
    expect(mockPostRepository.save).toHaveBeenCalledWith(
      {
        title: samplePostInfo.title,
        content: samplePostInfo.content,
        contactInfo: samplePostInfo.contactInfo,
        slug: expectedSlug,
        price: null,
        kind: "anuncio",
        origin: null,
        category: null,
        subCategory: null,
        media: {
          url: expectedFileUrl,
          type: expectedFileType,
          alt: samplePostInfo.title,
        },
        user: samplePostInfo.user,
        createdAt: expect.any(Date),
      },
      "es",
    ); // Assuming 'es' is the default language
    expect(result).toEqual({
      error: repositoryError,
      errorMessage: "Algo salió mal al guardar el post en la base de datos.", // Use case returns a default message
    });
  });

  describe("defineSlug", () => {
    it("should generate a slug if no slug is provided in postInfo", async () => {
      const postInfoWithoutSlug: Post = { ...samplePostInfo, slug: "" };
      const generatedSlug = "generated-slug-from-title";

      mockPostValidator.validate.mockReturnValue(undefined);
      mockPostEntity.generateSlug.mockReturnValue(generatedSlug);
      mockPostRepository.save.mockResolvedValue("postId");

      const result = await createPostUseCase.execute(postInfoWithoutSlug, "es");

      expect(mockPostValidator.validate).toHaveBeenCalledWith(
        postInfoWithoutSlug,
      );
      expect(mockPostEntity.generateSlug).toHaveBeenCalledWith(
        postInfoWithoutSlug.title,
      );
      expect(mockPostRepository.createUniqueSlug).not.toHaveBeenCalled(); // Important: not called when slug is empty
      expect(mockPostRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ slug: generatedSlug }),
        "es", // Check if the generated slug is used
      );
      expect(result.slug).toBe(generatedSlug);
    });

    it("should use createUniqueSlug if a slug is provided in postInfo", async () => {
      const postInfoWithSlug: Post = {
        ...samplePostInfo,
        slug: "user-provided-slug",
      };
      const uniqueSlug = "user-provided-slug-1";

      mockPostValidator.validate.mockReturnValue(undefined);
      // We only mock createUniqueSlug because generateSlug shouldn't be called
      mockPostRepository.createUniqueSlug.mockResolvedValue(uniqueSlug);
      mockPostRepository.save.mockResolvedValue("postId");

      const result = await createPostUseCase.execute(postInfoWithSlug, "es");

      expect(mockPostValidator.validate).toHaveBeenCalledWith(postInfoWithSlug);
      expect(mockPostEntity.generateSlug).not.toHaveBeenCalled(); // Important: not called when slug is provided
      expect(mockPostRepository.createUniqueSlug).toHaveBeenCalledWith(
        postInfoWithSlug.slug,
        "es",
      );
      expect(mockPostRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ slug: uniqueSlug }), // Check if the unique slug is used
        "es", // Assuming 'es' is the default language
      );
      expect(result.slug).toBe(uniqueSlug);
    });
  });
});
