import { EVENT_KIND } from "~/domain/entities/post/kind";

export type EventAttendanceRejection = "no-user" | "not-found" | "not-event";

export interface EventAttendancePost {
  id: string;
  kind: string | null;
  startsAt: Date | string | null;
}

export interface EventAttendanceRequest {
  userId: string | null;
  post: EventAttendancePost | null;
}

function hasUsableDate(value: Date | string | null): boolean {
  if (!value) return false;
  const date = value instanceof Date ? value : new Date(value);

  return !Number.isNaN(date.getTime());
}

export function canConfirmEventAttendance(
  post: EventAttendancePost | null,
): post is EventAttendancePost {
  return post?.kind === EVENT_KIND && hasUsableDate(post.startsAt);
}

export function rejectEventAttendanceRequest({
  userId,
  post,
}: EventAttendanceRequest): EventAttendanceRejection | null {
  if (!userId) return "no-user";
  if (!post) return "not-found";
  if (!canConfirmEventAttendance(post)) return "not-event";

  return null;
}
