import { createContentModerationService } from "~/infra/services/factory";
import ModerateCommentUseCase from "~/use_cases/moderateComment/moderateCommentUseCase";
import ReportCommentUseCase from "~/use_cases/moderateComment/reportCommentUseCase";
import ReviewCommentContentUseCase from "~/use_cases/moderateComment/reviewCommentContentUseCase";
import { PostgresCommentModerationRepository } from "./PostgresCommentModerationRepository";

let repository: PostgresCommentModerationRepository | null = null;

export function createCommentModerationRepository(): PostgresCommentModerationRepository {
  if (repository) return repository;
  repository = new PostgresCommentModerationRepository();
  return repository;
}

export function createModerateCommentUseCase(): ModerateCommentUseCase {
  return new ModerateCommentUseCase(createCommentModerationRepository());
}

export function createReviewCommentContentUseCase(): ReviewCommentContentUseCase {
  return new ReviewCommentContentUseCase(
    createContentModerationService(),
    createCommentModerationRepository(),
  );
}

export function createReportCommentUseCase(): ReportCommentUseCase {
  return new ReportCommentUseCase(createCommentModerationRepository());
}
