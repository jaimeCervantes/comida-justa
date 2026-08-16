import ModeratePostUseCase from "~/use_cases/moderatePost/moderatePostUseCase";
import { PostgresModerationRepository } from "./PostgresModerationRepository";

let repository: PostgresModerationRepository | null = null;

export function createModerationRepository(): PostgresModerationRepository {
  if (repository) return repository;
  repository = new PostgresModerationRepository();
  return repository;
}

export function createModeratePostUseCase(): ModeratePostUseCase {
  return new ModeratePostUseCase(createModerationRepository());
}
