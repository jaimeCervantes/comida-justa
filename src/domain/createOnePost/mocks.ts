import { vi } from 'vitest';
import type { IPostValidator, IPostEntity } from "~/entities/post/types";
import type IPostRepository from "./ports/IPostRepository";
import type IMediaStorageService from "./ports/IMediaStorageService";

export const mockPostValidator: IPostValidator = {
  MIN_LENGTH_TITLE: 5,
  MIN_LENGTH_CONTENT: 10,
  validate: vi.fn(),
  validateStringOnPost: vi.fn(),
  validateNumberOnPost: vi.fn(),
  validateFile: vi.fn(),
  validateUser: vi.fn(),
};

export const mockPostEntity: IPostEntity = {
  generateSlug: vi.fn(),
};

export const mockPostRepository: IPostRepository = {
  save: vi.fn(),
  createUniqueSlug: vi.fn(),
};

export const mockMediaStorageService: IMediaStorageService = {
  uploadFile: vi.fn(),
  createFilePath: vi.fn(),
  validateFileAndGetType: vi.fn(),
};
