import { describe, expect, it } from "vitest";
import {
  canConfirmEventAttendance,
  canViewEventAttendees,
  rejectEventAttendanceRequest,
} from "./eventAttendance";

const USER = "H3ucMRnM2ZtD4ezH5tPx";
const EVENT = {
  id: "post-evento",
  kind: "evento",
  startsAt: new Date("2027-08-23T07:30:00Z"),
};

describe("eventAttendance", () => {
  it("acepta un evento con horario", () => {
    expect(canConfirmEventAttendance(EVENT)).toBe(true);
    expect(rejectEventAttendanceRequest({ userId: USER, post: EVENT })).toBe(
      null,
    );
  });

  it.each([
    ["sin sesión", null, EVENT, "no-user"],
    ["sin publicación", USER, null, "not-found"],
    ["con producto", USER, { ...EVENT, kind: "producto" }, "not-event"],
    ["sin horario", USER, { ...EVENT, startsAt: null }, "not-event"],
  ])("rechaza %s", (_case, userId, post, reason) => {
    expect(rejectEventAttendanceRequest({ userId, post })).toBe(reason);
  });

  it("solo permite que el autor vea la lista de asistentes", () => {
    expect(canViewEventAttendees({ viewerId: USER, authorId: USER })).toBe(
      true,
    );
    expect(canViewEventAttendees({ viewerId: USER, authorId: "otro" })).toBe(
      false,
    );
    expect(canViewEventAttendees({ viewerId: null, authorId: USER })).toBe(
      false,
    );
  });
});
