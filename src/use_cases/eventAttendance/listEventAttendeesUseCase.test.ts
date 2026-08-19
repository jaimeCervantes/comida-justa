import { describe, expect, it } from "vitest";
import type {
  EventAttendancePost,
  EventAttendee,
} from "~/domain/eventAttendance/eventAttendance";
import ListEventAttendeesUseCase from "./listEventAttendeesUseCase";
import type IEventAttendanceRepository from "./ports/IEventAttendanceRepository";

const OWNER = "autor";
const ATTENDEE = "asistente";
const EVENTO = "post-evento";

class FakeEventAttendances implements IEventAttendanceRepository {
  readonly posts = new Map<string, EventAttendancePost>([
    [
      EVENTO,
      {
        id: EVENTO,
        kind: "evento",
        startsAt: new Date("2027-08-23T07:30:00Z"),
        authorId: OWNER,
      },
    ],
  ]);
  readonly attendees: EventAttendee[] = [
    {
      id: ATTENDEE,
      name: "Ana López",
      email: "ana@example.com",
      image: null,
      confirmedAt: new Date("2026-08-18T18:00:00Z"),
    },
  ];

  async findPostById(postId: string): Promise<EventAttendancePost | null> {
    return this.posts.get(postId) ?? null;
  }

  async attend(): Promise<void> {}

  async cancel(): Promise<void> {}

  async count(): Promise<number> {
    return this.attendees.length;
  }

  async isAttending(): Promise<boolean> {
    return false;
  }

  async listAttendees(): Promise<EventAttendee[]> {
    return this.attendees;
  }
}

describe("ListEventAttendeesUseCase", () => {
  it("devuelve asistentes solo al creador del evento", async () => {
    const result = await new ListEventAttendeesUseCase(
      new FakeEventAttendances(),
    ).execute({
      viewerId: OWNER,
      postId: EVENTO,
    });

    expect(result).toEqual({
      ok: true,
      attendees: [
        {
          id: ATTENDEE,
          name: "Ana López",
          email: "ana@example.com",
          image: null,
          confirmedAt: new Date("2026-08-18T18:00:00Z"),
        },
      ],
    });
  });

  it.each([
    ["visitante anónimo", null],
    ["otra persona", ATTENDEE],
  ])("oculta la lista a %s", async (_case, viewerId) => {
    const result = await new ListEventAttendeesUseCase(
      new FakeEventAttendances(),
    ).execute({
      viewerId,
      postId: EVENTO,
    });

    expect(result).toEqual({ ok: false, reason: "forbidden" });
  });

  it("rechaza publicaciones que no son eventos", async () => {
    const attendances = new FakeEventAttendances();
    attendances.posts.set("jugo", {
      id: "jugo",
      kind: "producto",
      startsAt: null,
      authorId: OWNER,
    });

    const result = await new ListEventAttendeesUseCase(attendances).execute({
      viewerId: OWNER,
      postId: "jugo",
    });

    expect(result).toEqual({ ok: false, reason: "not-event" });
  });
});
