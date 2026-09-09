"use client";

import { useFormatter } from "next-intl";
import { useActionState } from "react";
import { MdAdd, MdDeleteOutline } from "react-icons/md";
import type { TimeOff } from "~/infra/dataAccess/schedule/PostgresScheduleRepository";
import { Button } from "~/presentation/design_system/buttons/Button";
import { Alert } from "~/presentation/design_system/feedback/Alert";
import { TextField } from "~/presentation/design_system/forms/TextField";
import { addTimeOff, removeTimeOff } from "../actions";

export type TimeOffLabels = {
  formLabel: string;
  listLabel: string;
  from: string;
  to: string;
  reason: string;
  add: string;
  remove: string;
  empty: string;
  invalid: string;
  invalidStatusLabel: string;
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
    <div className="flex flex-col gap-5" data-testid="time-off">
      {periods.length === 0 ? (
        <div
          className="rounded-control border border-dashed border-separator bg-surface-elevation-2 p-4 text-sm text-text-support"
          data-testid="time-off-empty"
        >
          {labels.empty}
        </div>
      ) : (
        <ul
          aria-label={labels.listLabel}
          className="m-0 flex list-none flex-col gap-3 p-0"
        >
          {periods.map((period) => (
            <li
              key={period.id}
              data-testid={`time-off-${period.id}`}
              className="grid gap-3 rounded-control border border-separator bg-surface-elevation-2 p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
            >
              <div className="min-w-0">
                <p className="font-semibold text-text-base">
                  {when(period.startsAt)} - {when(period.endsAt)}
                </p>
                {period.reason ? (
                  <p className="mt-1 text-sm text-text-support">
                    {period.reason}
                  </p>
                ) : null}
              </div>

              {/* Acción simple, sin estado: quitar una ausencia no tiene nada que contestar. */}
              <form action={removeTimeOff}>
                <input type="hidden" name="id" value={period.id} />
                <button
                  type="submit"
                  data-testid={`time-off-remove-${period.id}`}
                  className="focus-ring inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-control px-3 py-2 text-sm font-semibold text-highlight hover:bg-surface-elevation-1 sm:w-auto"
                >
                  <MdDeleteOutline aria-hidden="true" className="size-4" />
                  {labels.remove}
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <form
        action={action}
        aria-label={labels.formLabel}
        className="grid gap-3 rounded-control bg-surface-elevation-2 p-3 sm:grid-cols-2 lg:grid-cols-1 2xl:grid-cols-2"
      >
        <TextField
          required
          type="datetime-local"
          name="from"
          label={labels.from}
          data-testid="time-off-from"
        />

        <TextField
          required
          type="datetime-local"
          name="to"
          label={labels.to}
          data-testid="time-off-to"
        />

        <TextField
          type="text"
          name="reason"
          label={labels.reason}
          data-testid="time-off-reason"
          containerClassName="sm:col-span-2 lg:col-span-1 2xl:col-span-2"
        />

        <Button
          type="submit"
          disabled={pending}
          isLoading={pending}
          data-testid="time-off-add"
          color="green"
          startIcon={<MdAdd aria-hidden="true" />}
          className="w-full sm:col-span-2 lg:col-span-1 2xl:col-span-2"
        >
          {labels.add}
        </Button>
      </form>

      {state.error === "invalid" ? (
        <Alert
          tone="error"
          label={labels.invalidStatusLabel}
          data-testid="time-off-error"
        >
          {labels.invalid}
        </Alert>
      ) : null}
    </div>
  );
}
