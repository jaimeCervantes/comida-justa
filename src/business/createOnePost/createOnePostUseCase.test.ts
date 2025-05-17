import { describe, it, expect, vi, beforeEach } from 'vitest';
import CreatePostUseCase from './index';
import type { Post } from "~/business/entities/post/types";
import { mockPostValidator, mockPostEntity, mockPostRepository, mockMediaStorageService } from './mocks';
import { samplePostInfo } from './dummies';

describe('CreatePostUseCase', () => {
  let createPostUseCase: CreatePostUseCase;

  beforeEach(() => {
    vi.clearAllMocks();

    createPostUseCase = new CreatePostUseCase(
      mockPostValidator,
      mockPostEntity,
      mockPostRepository,
      mockMediaStorageService
    );
  });

  it('should successfully create a post when all dependencies work correctly', async () => {
    const expectedPostId = 'post123';
    const expectedSlug = 'test-post-title-unique';
    const expectedFileUrl = 'http://salujusta.com/files/test.jpg';
    const expectedFileType = 'image';

    mockPostValidator.validate.mockReturnValue(undefined);
    mockPostRepository.createUniqueSlug.mockResolvedValue(expectedSlug);
    mockMediaStorageService.validateFileAndGetType.mockResolvedValue(expectedFileType);
    mockMediaStorageService.uploadFile.mockResolvedValue(expectedFileUrl);
    mockPostRepository.save.mockResolvedValue(expectedPostId);

    const result = await createPostUseCase.execute(samplePostInfo);

    expect(mockPostValidator.validate).toHaveBeenCalledWith(samplePostInfo);
    expect(mockPostRepository.createUniqueSlug).toHaveBeenCalledWith(samplePostInfo.slug);
    expect(mockMediaStorageService.validateFileAndGetType).toHaveBeenCalledWith(samplePostInfo.file);
    expect(mockMediaStorageService.uploadFile).toHaveBeenCalledWith(samplePostInfo.file);
    expect(mockPostRepository.save).toHaveBeenCalledWith({
      title: samplePostInfo.title,
      content: samplePostInfo.content,
      contactInfo: samplePostInfo.contactInfo,
      slug: expectedSlug,
      media: {
        url: expectedFileUrl,
        type: expectedFileType,
        alt: samplePostInfo.title,
      },
      user: samplePostInfo.user,
      createdAt: expect.any(Date)
    });
    expect(result).toEqual({ id: expectedPostId, slug: expectedSlug });
    expect(result.error).toBeUndefined();
    expect(result.errorMessage).toBeUndefined();
  });

  it('should return a validation error if post validation fails', async () => {
    const validationError = new Error("Invalid post data");
    mockPostValidator.validate.mockImplementation(() => {
      throw validationError;
    });

    const result = await createPostUseCase.execute(samplePostInfo);

    expect(mockPostValidator.validate).toHaveBeenCalledWith(samplePostInfo);
    expect(result).toEqual({
      error: validationError,
      errorMessage: "Invalid post data",
    });

    expect(mockPostEntity.generateSlug).not.toHaveBeenCalled();
    expect(mockPostRepository.createUniqueSlug).not.toHaveBeenCalled();
    expect(mockMediaStorageService.validateFileAndGetType).not.toHaveBeenCalled();
    expect(mockMediaStorageService.uploadFile).not.toHaveBeenCalled();
    expect(mockPostRepository.save).not.toHaveBeenCalled();
  });

  it('should return an error if slug definition fails', async () => {
    const slugError = new Error("Slug generation failed");
    mockPostValidator.validate.mockReturnValue(undefined); // Validation passes
    // Mocking the private method 'defineSlug' indirectly by making createUniqueSlug throw
    mockPostRepository.createUniqueSlug.mockRejectedValue(slugError);

    const result = await createPostUseCase.execute(samplePostInfo);

    expect(mockPostValidator.validate).toHaveBeenCalledWith(samplePostInfo);
    expect(mockPostRepository.createUniqueSlug).toHaveBeenCalledWith(samplePostInfo.slug);
    expect(result).toEqual({
      error: slugError,
      errorMessage: "Slug generation failed", // Assuming defineSlug propagates the error message
    });
    expect(mockMediaStorageService.validateFileAndGetType).not.toHaveBeenCalled();
    expect(mockMediaStorageService.uploadFile).not.toHaveBeenCalled();
    expect(mockPostRepository.save).not.toHaveBeenCalled();
  });

  it('should return an error if file validation fails', async () => {
    const fileValidationError = new Error("Invalid file type");
    mockPostValidator.validate.mockReturnValue(undefined); // Validation passes
    mockPostRepository.createUniqueSlug.mockResolvedValue('test-post-slug'); // Slug is defined
    mockMediaStorageService.validateFileAndGetType.mockRejectedValue(fileValidationError); // File validation fails

    const result = await createPostUseCase.execute(samplePostInfo);

    expect(mockPostValidator.validate).toHaveBeenCalledWith(samplePostInfo);
    expect(mockPostRepository.createUniqueSlug).toHaveBeenCalled(); // Assuming slug definition passed
    expect(mockMediaStorageService.validateFileAndGetType).toHaveBeenCalledWith(samplePostInfo.file);
    expect(result).toEqual({
      error: fileValidationError,
      errorMessage: fileValidationError.message, // The use case returns the error message from the exception
    });
    expect(mockMediaStorageService.uploadFile).not.toHaveBeenCalled();
    expect(mockPostRepository.save).not.toHaveBeenCalled();
  });

  it('should return an error if file upload fails', async () => {
    const fileUploadError = new Error(""); // si el error no tiene mensaje muestra uno por defecto
    mockPostValidator.validate.mockReturnValue(undefined); // Validation passes
    mockPostRepository.createUniqueSlug.mockResolvedValue('test-post-slug'); // Slug is defined
    mockMediaStorageService.validateFileAndGetType.mockResolvedValue('image'); // File validation passes
    mockMediaStorageService.uploadFile.mockRejectedValue(fileUploadError); // File upload fails

    const result = await createPostUseCase.execute(samplePostInfo);

    expect(mockPostValidator.validate).toHaveBeenCalledWith(samplePostInfo);
    expect(mockPostRepository.createUniqueSlug).toHaveBeenCalled(); // Assuming slug definition passed
    expect(mockMediaStorageService.validateFileAndGetType).toHaveBeenCalledWith(samplePostInfo.file);
    expect(mockMediaStorageService.uploadFile).toHaveBeenCalledWith(samplePostInfo.file);
    expect(result).toEqual({
      error: fileUploadError,
      errorMessage: "Algo salió mal al subir el archivo al almacenamiento.", // Use case returns a default message
    });
    expect(mockPostRepository.save).not.toHaveBeenCalled();
  });


  it('should return an error if saving the post to the repository fails', async () => {
    const repositoryError = new Error("");
    const expectedSlug = 'test-post-title-unique';
    const expectedFileUrl = 'http://saludjusta.com/files/test.jpg';
    const expectedFileType = 'image';

    mockPostValidator.validate.mockReturnValue(undefined); // Validation passes
    mockPostRepository.createUniqueSlug.mockResolvedValue(expectedSlug); // Returns a unique slug
    mockMediaStorageService.validateFileAndGetType.mockResolvedValue(expectedFileType); // Returns file type
    mockMediaStorageService.uploadFile.mockResolvedValue(expectedFileUrl); // Returns file URL
    mockPostRepository.save.mockRejectedValue(repositoryError); // Saving fails

    const result = await createPostUseCase.execute(samplePostInfo);

    expect(mockPostValidator.validate).toHaveBeenCalledWith(samplePostInfo);
    expect(mockPostRepository.createUniqueSlug).toHaveBeenCalledWith(samplePostInfo.slug);
    expect(mockMediaStorageService.validateFileAndGetType).toHaveBeenCalledWith(samplePostInfo.file);
    expect(mockMediaStorageService.uploadFile).toHaveBeenCalledWith(samplePostInfo.file);
    expect(mockPostRepository.save).toHaveBeenCalledWith({
      title: samplePostInfo.title,
      content: samplePostInfo.content,
      contactInfo: samplePostInfo.contactInfo,
      slug: expectedSlug,
      media: {
        url: expectedFileUrl,
        type: expectedFileType,
        alt: samplePostInfo.title,
      },
      user: samplePostInfo.user,
      createdAt: expect.any(Date)
    });
    expect(result).toEqual({
      error: repositoryError,
      errorMessage: "Algo salió mal al guardar el post en la base de datos.", // Use case returns a default message
    });
  });

  describe('defineSlug', () => {
    it('should generate a slug if no slug is provided in postInfo', async () => {
      const postInfoWithoutSlug: Post = { ...samplePostInfo, slug: '' };
      const generatedSlug = 'generated-slug-from-title';

      mockPostValidator.validate.mockReturnValue(undefined);
      mockPostEntity.generateSlug.mockReturnValue(generatedSlug);
      mockMediaStorageService.validateFileAndGetType.mockResolvedValue('image');
      mockMediaStorageService.uploadFile.mockResolvedValue('http://saludjusta.com/file.jpg');
      mockPostRepository.save.mockResolvedValue('postId');

      const result = await createPostUseCase.execute(postInfoWithoutSlug);

      expect(mockPostValidator.validate).toHaveBeenCalledWith(postInfoWithoutSlug);
      expect(mockPostEntity.generateSlug).toHaveBeenCalledWith(postInfoWithoutSlug.title);
      expect(mockPostRepository.createUniqueSlug).not.toHaveBeenCalled(); // Important: not called when slug is empty
      expect(mockMediaStorageService.validateFileAndGetType).toHaveBeenCalled();
      expect(mockMediaStorageService.uploadFile).toHaveBeenCalled();
      expect(mockPostRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ slug: generatedSlug }) // Check if the generated slug is used
      );
      expect(result.slug).toBe(generatedSlug);
    });

    it('should use createUniqueSlug if a slug is provided in postInfo', async () => {
      const postInfoWithSlug: Post = { ...samplePostInfo, slug: 'user-provided-slug' };
      const uniqueSlug = 'user-provided-slug-1';

      mockPostValidator.validate.mockReturnValue(undefined);
      // We only mock createUniqueSlug because generateSlug shouldn't be called
      mockPostRepository.createUniqueSlug.mockResolvedValue(uniqueSlug);
      mockMediaStorageService.validateFileAndGetType.mockResolvedValue('image');
      mockMediaStorageService.uploadFile.mockResolvedValue('http://saludjusta.com/file.jpg');
      mockPostRepository.save.mockResolvedValue('postId');

      const result = await createPostUseCase.execute(postInfoWithSlug);

      expect(mockPostValidator.validate).toHaveBeenCalledWith(postInfoWithSlug);
      expect(mockPostEntity.generateSlug).not.toHaveBeenCalled(); // Important: not called when slug is provided
      expect(mockPostRepository.createUniqueSlug).toHaveBeenCalledWith(postInfoWithSlug.slug);
      expect(mockMediaStorageService.validateFileAndGetType).toHaveBeenCalled();
      expect(mockMediaStorageService.uploadFile).toHaveBeenCalled();
      expect(mockPostRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ slug: uniqueSlug }) // Check if the unique slug is used
      );
      expect(result.slug).toBe(uniqueSlug);
    });
  });
});