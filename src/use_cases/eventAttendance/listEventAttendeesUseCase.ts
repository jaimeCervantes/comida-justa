import {
  canConfirmEventAttendance,
  canViewEventAttendees,
  type EventAttendanceRejection,
  type EventAttendee,
} from "~/domain/eventAttendance/eventAttendance";
import type IEventAttendanceRepository from "./ports/IEventAttendanceRepository";

export type ListEventAttendeesResult =
  | { ok: true; attendees: EventAttendee[] }
  | { ok: false; reason: EventAttendanceRejection | "forbidden" };

export interface ListEventAttendeesRequest {
  viewerId: string | null;
  postId: string;
}

export default class ListEventAttendeesUseCase {
  constructor(private readonly attendances: IEventAttendanceRepository) {}

  async execute({
    viewerId,
    postId,
  }: ListEventAttendeesRequest): Promise<ListEventAttendeesResult> {
    const post = postId ? await this.attendances.findPostById(postId) : null;

    if (!post) return { ok: false, reason: "not-found" };
    if (!canConfirmEventAttendance(post)) {
      return { ok: false, reason: "not-event" };
    }
    if (!canViewEventAttendees({ viewerId, authorId: post.authorId })) {
      return { ok: false, reason: "forbidden" };
    }

    return {
      ok: true,
      attendees: await this.attendances.listAttendees(post.id),
    };
  }
}
