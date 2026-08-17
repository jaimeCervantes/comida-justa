"use client";

import { useFormatter } from "next-intl";
import { useActionState } from "react";
import type { TimeOff } from "~/infra/dataAccess/schedule/PostgresScheduleRepository";
import { addTimeOff, removeTimeOff } from "../actions";

export type TimeOffLabels = {
  heading: string;
  intro: string;
  from: string;
  to: string;
  reason: string;
  add: string;
  remove: string;
  empty: string;
  invalid: string;
};

/**
 * Cuándo el proveedor NO atiende, aunque su horario diga que sí.
 *
 * Se piden fecha **y hora**, no solo el día: es lo que permite anotar "el jueves solo por la mañana"
 * sin inventar otra forma de decirlo, y es la razón de que la tabla guarde instantes.
 *
 * Las ausencias pasadas no se listan. Una vacación de hace dos años no es algo que nadie vaya a
 * editar, y enseñarlas convertiría esto en un archivo histórico.
 */
export default function TimeOffList({
  periods,
  labels,
}: {
  periods: readonly TimeOff[];
  labels: TimeOffLabels;
}) {
  const [state, action, pending] = useActionState(addTimeOff, {});
  const format = useFormatter();

  const when = (date: Date) =>
    format.dateTime(date, {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <section className="mt-10" data-testid="time-off">
      <h2 className="text-lg font-bold mb-2">{labels.heading}</h2>
      <p className="mb-4 text-gray-600 dark:text-gray-400">{labels.intro}</p>

      {periods.length === 0 ? (
        <p className="text-gray-500 mb-4" data-testid="time-off-empty">
          {labels.empty}
        </p>
      ) : (
        <ul className="list-none p-0 m-0 mb-4">
          {periods.map((period) => (
            <li
              key={period.id}
              data-testid={`time-off-${period.id}`}
              className="flex flex-wrap items-center gap-3 py-2 border-b border-gray-100 dark:border-gray-800"
            >
              <span>
                {when(period.startsAt)} — {when(period.endsAt)}
              </span>
              {period.reason ? (
                <span className="text-sm text-gray-500">{period.reason}</span>
              ) : null}

              {/* Acción simple, sin estado: quitar una ausencia no tiene nada que contestar. */}
              <form action={removeTimeOff} className="ml-auto">
                <input type="hidden" name="id" value={period.id} />
                <button
                  type="submit"
                  data-testid={`time-off-remove-${period.id}`}
                  className="text-sm underline text-pw-green"
                >
                  {labels.remove}
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <form action={action} className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col">
          <span className="text-sm">{labels.from}</span>
          <input
            required
            type="datetime-local"
            name="from"
            data-testid="time-off-from"
            className="border rounded px-2 py-1 bg-transparent"
          />
        </label>

        <label className="flex flex-col">
          <span className="text-sm">{labels.to}</span>
          <input
            required
            type="datetime-local"
            name="to"
            data-testid="time-off-to"
            className="border rounded px-2 py-1 bg-transparent"
          />
        </label>

        <label className="flex flex-col">
          <span className="text-sm">{labels.reason}</span>
          <input
            type="text"
            name="reason"
            data-testid="time-off-reason"
            className="border rounded px-2 py-1 bg-transparent"
          />
        </label>

        <button
          type="submit"
          disabled={pending}
          data-testid="time-off-add"
          className="rounded bg-pw-green px-4 py-2 text-white disabled:opacity-50"
        >
          {labels.add}
        </button>
      </form>

      {state.error === "invalid" ? (
        <p
          className="mt-2 text-sm text-feedback-error"
          data-testid="time-off-error"
        >
          {labels.invalid}
        </p>
      ) : null}
    </section>
  );
}
