import { type Mocked, vi } from "vitest";
import type { IPostEntity, IPostValidator } from "~/domain/entities/post/types";
import type IMediaStorageService from "./ports/IMediaStorageService";
import type IPostRepository from "./ports/IPostRepository";

/*
 * `Mocked<T>` y no `T` a secas: anotar con la interfaz pelada **borra** el tipo de `vi.fn()`, así
 * que `mockResolvedValue` y compañía dejaban de existir para TypeScript (18 de los 39 errores que
 * destapó `typecheck:tests` salían de aquí). `Mocked<T>` conserva los dos lados: sigue exigiendo
 * que el objeto cumpla el puerto, y además tipa cada mock contra su firma —`save` solo acepta
 * `mockResolvedValue(string)`, no cualquier cosa—.
 */

export const mockPostValidator: Mocked<IPostValidator> = {
  MIN_LENGTH_TITLE: 5,
  MIN_LENGTH_CONTENT: 10,
  validate: vi.fn(),
  validateStringOnPost: vi.fn(),
  validateNumberOnPost: vi.fn(),
  validateFile: vi.fn(),
  validateUser: vi.fn(),
};

export const mockPostEntity: Mocked<IPostEntity> = {
  generateSlug: vi.fn(),
};

export const mockPostRepository: Mocked<IPostRepository> = {
  save: vi.fn(),
  createUniqueSlug: vi.fn(),
};

export const mockMediaStorageService: Mocked<IMediaStorageService> = {
  uploadFile: vi.fn(),
  createFilePath: vi.fn(),
  validateFileAndGetType: vi.fn(),
};
