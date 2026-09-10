import { describe, expect, it } from "vitest";
import {
  hasAppointment,
  type ScheduledOrder,
  splitAppointmentOrders,
} from "./appointments";

function scheduled(
  status: ScheduledOrder["status"],
  startsAt: string,
  endsAt: string,
): ScheduledOrder {
  return {
    status,
    appointment: {
      startsAt: new Date(startsAt),
      endsAt: new Date(endsAt),
    },
  };
}

describe("appointment orders", () => {
  it("keeps only orders with an appointment", () => {
    const orders: ScheduledOrder[] = [
      scheduled(
        "CONFIRMED",
        "2032-05-20T16:00:00.000Z",
        "2032-05-20T17:00:00.000Z",
      ),
      { status: "PENDING", appointment: null },
    ];

    expect(orders.filter(hasAppointment)).toHaveLength(1);
  });

  it("splits future appointments from finished or elapsed ones", () => {
    const now = new Date("2032-05-20T15:00:00.000Z");
    const future = scheduled(
      "CONFIRMED",
      "2032-05-20T16:00:00.000Z",
      "2032-05-20T17:00:00.000Z",
    );
    const elapsed = scheduled(
      "CONFIRMED",
      "2032-05-19T16:00:00.000Z",
      "2032-05-19T17:00:00.000Z",
    );
    const closed = scheduled(
      "DELIVERED",
      "2032-05-21T16:00:00.000Z",
      "2032-05-21T17:00:00.000Z",
    );

    expect(splitAppointmentOrders([future, elapsed, closed], now)).toEqual({
      upcoming: [future],
      past: [elapsed, closed],
    });
  });
});
