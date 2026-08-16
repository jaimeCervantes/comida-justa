import { createContentModerationService } from "~/infra/services/factory";
import ModeratePostUseCase from "~/use_cases/moderatePost/moderatePostUseCase";
import ReportPostUseCase from "~/use_cases/moderatePost/reportPostUseCase";
import ReviewPostContentUseCase from "~/use_cases/moderatePost/reviewPostContentUseCase";
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

export function createReviewPostContentUseCase(): ReviewPostContentUseCase {
  return new ReviewPostContentUseCase(
    createContentModerationService(),
    createModerationRepository(),
  );
}

export function createReportPostUseCase(): ReportPostUseCase {
  return new ReportPostUseCase(createModerationRepository());
}
