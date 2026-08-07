import { createTranslationService } from "~/infra/services/factory";
import TranslatePostUseCase from "~/use_cases/translatePost/translatePostUseCase";
import PostgresPostTranslationRepository from "./PostgresPostTranslationRepository";

export function createTranslatePostUseCase(): TranslatePostUseCase {
  return new TranslatePostUseCase(
    new PostgresPostTranslationRepository(),
    createTranslationService(),
  );
}

export function createPostTranslationRepository(): PostgresPostTranslationRepository {
  return new PostgresPostTranslationRepository();
}
