import { isFinal, type Order } from "./order";

export type ScheduledOrder = Pick<Order, "appointment" | "status">;

export interface AppointmentGroups<T extends ScheduledOrder> {
  upcoming: T[];
  past: T[];
}

export function hasAppointment<T extends ScheduledOrder>(
  order: T,
): order is T & { appointment: NonNullable<Order["appointment"]> } {
  return Boolean(order.appointment);
}

export function splitAppointmentOrders<T extends ScheduledOrder>(
  orders: readonly T[],
  now: Date = new Date(),
): AppointmentGroups<T> {
  return orders.reduce<AppointmentGroups<T>>(
    (groups, order) => {
      if (!order.appointment) return groups;

      const target =
        order.appointment.endsAt <= now || isFinal(order.status)
          ? groups.past
          : groups.upcoming;

      target.push(order);

      return groups;
    },
    { upcoming: [], past: [] },
  );
}
