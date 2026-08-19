import {
  type EventAttendanceRejection,
  rejectEventAttendanceRequest,
} from "~/domain/eventAttendance/eventAttendance";
import type IEventAttendanceRepository from "./ports/IEventAttendanceRepository";

export type ToggleEventAttendanceResult =
  | { ok: true; attending: boolean; attendees: number }
  | { ok: false; reason: EventAttendanceRejection };

export interface ToggleEventAttendanceRequest {
  userId: string | null;
  postId: string;
}

/**
 * Cambia la asistencia leyendo primero lo que existe.
 *
 * El formulario manda una intención, no un estado. Si dos pestañas tienen vistas distintas, el
 * servidor decide contra la fila real y la restricción única sostiene que no haya duplicados.
 */
export default class ToggleEventAttendanceUseCase {
  constructor(private readonly attendances: IEventAttendanceRepository) {}

  async execute({
    userId,
    postId,
  }: ToggleEventAttendanceRequest): Promise<ToggleEventAttendanceResult> {
    const post = postId ? await this.attendances.findPostById(postId) : null;
    const rejection = rejectEventAttendanceRequest({ userId, post });

    if (rejection !== null) return { ok: false, reason: rejection };
    if (!userId || !post) return { ok: false, reason: "not-found" };

    const attending = await this.attendances.isAttending(userId, post.id);

    if (attending) {
      await this.attendances.cancel(userId, post.id);
    } else {
      await this.attendances.attend(userId, post.id);
    }

    return {
      ok: true,
      attending: !attending,
      attendees: await this.attendances.count(post.id),
    };
  }
}
