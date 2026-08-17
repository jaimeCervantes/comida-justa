import BookAppointmentUseCase from "~/use_cases/bookAppointment/bookAppointmentUseCase";
import { PostgresScheduleRepository } from "./PostgresScheduleRepository";

let repository: PostgresScheduleRepository | null = null;

export function createScheduleRepository(): PostgresScheduleRepository {
  if (repository) return repository;
  repository = new PostgresScheduleRepository();
  return repository;
}

export function createBookAppointmentUseCase(): BookAppointmentUseCase {
  return new BookAppointmentUseCase(createScheduleRepository());
}
