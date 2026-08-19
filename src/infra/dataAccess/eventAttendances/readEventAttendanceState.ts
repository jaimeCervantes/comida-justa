import { createEventAttendanceRepository } from "./PostgresEventAttendanceRepository";

export interface EventAttendanceState {
  attending: boolean;
  attendees: number;
}

export async function readEventAttendanceState(
  postId: string,
  viewerId: string | null,
): Promise<EventAttendanceState> {
  const repository = createEventAttendanceRepository();
  const [attending, attendees] = await Promise.all([
    repository.isAttending(viewerId, postId),
    repository.count(postId),
  ]);

  return { attending, attendees };
}
