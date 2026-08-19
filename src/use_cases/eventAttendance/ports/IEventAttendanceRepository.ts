import type {
  EventAttendancePost,
  EventAttendee,
} from "~/domain/eventAttendance/eventAttendance";

export default interface IEventAttendanceRepository {
  findPostById(postId: string): Promise<EventAttendancePost | null>;
  attend(userId: string, postId: string): Promise<void>;
  cancel(userId: string, postId: string): Promise<void>;
  count(postId: string): Promise<number>;
  isAttending(userId: string | null, postId: string): Promise<boolean>;
  listAttendees(postId: string): Promise<EventAttendee[]>;
}
