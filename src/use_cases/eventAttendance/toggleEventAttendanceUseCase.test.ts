import { describe, expect, it } from "vitest";
import type { EventAttendancePost } from "~/domain/eventAttendance/eventAttendance";
import type IEventAttendanceRepository from "./ports/IEventAttendanceRepository";
import ToggleEventAttendanceUseCase from "./toggleEventAttendanceUseCase";

const YO = "H3ucMRnM2ZtD4ezH5tPx";
const EVENTO = "post-evento";

class FakeEventAttendances implements IEventAttendanceRepository {
  readonly rows = new Set<string>();
  readonly posts = new Map<string, EventAttendancePost>([
    [
      EVENTO,
      {
        id: EVENTO,
        kind: "evento",
        startsAt: new Date("2027-08-23T07:30:00Z"),
      },
    ],
  ]);

  async findPostById(postId: string): Promise<EventAttendancePost | null> {
    return this.posts.get(postId) ?? null;
  }

  async attend(userId: string, postId: string): Promise<void> {
    this.rows.add(`${postId}|${userId}`);
  }

  async cancel(userId: string, postId: string): Promise<void> {
    this.rows.delete(`${postId}|${userId}`);
  }

  async count(postId: string): Promise<number> {
    const prefix = `${postId}|`;

    return [...this.rows].filter((row) => row.startsWith(prefix)).length;
  }

  async isAttending(userId: string | null, postId: string): Promise<boolean> {
    return userId !== null && this.rows.has(`${postId}|${userId}`);
  }

  async listAttendees(): Promise<[]> {
    return [];
  }
}

describe("ToggleEventAttendanceUseCase", () => {
  it("confirma asistencia y devuelve el contador actualizado", async () => {
    const attendances = new FakeEventAttendances();

    const result = await new ToggleEventAttendanceUseCase(attendances).execute({
      userId: YO,
      postId: EVENTO,
    });

    expect(result).toEqual({ ok: true, attending: true, attendees: 1 });
    expect(attendances.rows.size).toBe(1);
  });

  it("al repetir la intención cancela la asistencia", async () => {
    const attendances = new FakeEventAttendances();
    const useCase = new ToggleEventAttendanceUseCase(attendances);

    await useCase.execute({ userId: YO, postId: EVENTO });
    const result = await useCase.execute({ userId: YO, postId: EVENTO });

    expect(result).toEqual({ ok: true, attending: false, attendees: 0 });
    expect(attendances.rows.size).toBe(0);
  });

  it("no duplica si la fila ya existía", async () => {
    const attendances = new FakeEventAttendances();
    await attendances.attend(YO, EVENTO);

    const result = await new ToggleEventAttendanceUseCase(attendances).execute({
      userId: YO,
      postId: EVENTO,
    });

    expect(result).toEqual({ ok: true, attending: false, attendees: 0 });
  });

  it.each([
    ["sin sesión", null, EVENTO, "no-user"],
    ["sin post", YO, "no-existe", "not-found"],
  ])("rechaza %s sin escribir", async (_case, userId, postId, reason) => {
    const attendances = new FakeEventAttendances();

    const result = await new ToggleEventAttendanceUseCase(attendances).execute({
      userId,
      postId,
    });

    expect(result).toEqual({ ok: false, reason });
    expect(attendances.rows.size).toBe(0);
  });

  it("rechaza publicaciones que no son eventos con horario", async () => {
    const attendances = new FakeEventAttendances();
    attendances.posts.set("jugo-verde", {
      id: "jugo-verde",
      kind: "producto",
      startsAt: null,
    });

    const result = await new ToggleEventAttendanceUseCase(attendances).execute({
      userId: YO,
      postId: "jugo-verde",
    });

    expect(result).toEqual({ ok: false, reason: "not-event" });
    expect(attendances.rows.size).toBe(0);
  });
});
