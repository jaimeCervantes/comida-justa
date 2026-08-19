import type { EventAttendee } from "~/domain/eventAttendance/eventAttendance";
import ListEventAttendeesUseCase from "~/use_cases/eventAttendance/listEventAttendeesUseCase";
import { createEventAttendanceRepository } from "./PostgresEventAttendanceRepository";

export async function readEventAttendees({
  postId,
  viewerId,
}: {
  postId: string;
  viewerId: string | null;
}): Promise<EventAttendee[] | null> {
  const result = await new ListEventAttendeesUseCase(
    createEventAttendanceRepository(),
  ).execute({ postId, viewerId });

  return result.ok ? result.attendees : null;
}
