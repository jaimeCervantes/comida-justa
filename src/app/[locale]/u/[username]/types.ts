import type { PracticeCard } from "~/domain/practices/practiceCard";

export type ProfileSharedPractice = PracticeCard & {
  startedAt: Date;
};
