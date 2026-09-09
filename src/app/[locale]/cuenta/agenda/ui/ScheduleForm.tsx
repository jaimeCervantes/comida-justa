"use client";

import { useActionState, useState } from "react";
import { MdAdd, MdDeleteOutline, MdSave } from "react-icons/md";
import type { WeeklyHours } from "~/domain/schedule/slots";
import { Button } from "~/presentation/design_system/buttons/Button";
import { Alert } from "~/presentation/design_system/feedback/Alert";
import { Select } from "~/presentation/design_system/forms/Select";
import { TextField } from "~/presentation/design_system/forms/TextField";
import { saveSchedule } from "../actions";

export type ScheduleLabels = {
  formLabel: string;
  listLabel: string;
  weekday: string;
  from: string;
  to: string;
  add: string;
  remove: string;
  empty: string;
  submit: string;
  saved: string;
  savedStatusLabel: string;
  invalid: string;
  invalidStatusLabel: string;
  days: readonly string[];
};

/** "09:30" desde minutos: es lo que quiere un `<input type="time">`. */
function toTimeValue(minutes: number): string {
  const h = String(Math.floor(minutes / 60)).padStart(2, "0");
  const m = String(minutes % 60).padStart(2, "0");

  return `${h}:${m}`;
}

type Row = { weekday: number; from: string; to: string };

/**
 * La semana tipo del proveedor.
 *
 * Es Client Component porque las franjas se añaden y se quitan **antes** de guardar: quien atiende
 * martes y jueves no debería tener que guardar dos veces para decirlo.
 *
 * El formulario manda el horario **completo** y la acción lo reemplaza entero. Es lo que la persona
 * está viendo, así que es lo que debe quedar guardado — sin diffs que necesitarían una identidad
 * por franja que aquí no existe.
 */
export default function ScheduleForm({
  initial,
  labels,
}: {
  initial: readonly WeeklyHours[];
  labels: ScheduleLabels;
}) {
  const [state, action, pending] = useActionState(saveSchedule, {});
  const [rows, setRows] = useState<Row[]>(
    initial.map((h) => ({
      weekday: h.weekday,
      from: toTimeValue(h.startsMinutes),
      to: toTimeValue(h.endsMinutes),
    })),
  );

  const update = (index: number, patch: Partial<Row>) =>
    setRows((current) =>
      current.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );

  return (
    <form
      action={action}
      aria-label={labels.formLabel}
      data-testid="schedule-form"
      className="flex flex-col gap-5"
    >
      {rows.length === 0 ? (
        <div
          className="rounded-control border border-dashed border-separator bg-surface-elevation-2 p-4 text-sm text-text-support"
          data-testid="schedule-empty"
        >
          {labels.empty}
        </div>
      ) : null}

      <ul
        aria-label={labels.listLabel}
        className="m-0 flex list-none flex-col gap-3 p-0"
      >
        {rows.map((row, index) => (
          <li
            // El índice ES la identidad aquí: las filas no tienen id hasta guardarse.
            // biome-ignore lint/suspicious/noArrayIndexKey: ver la línea de arriba.
            key={`${row.weekday}-${index}`}
            data-testid={`schedule-row-${index}`}
            className="grid min-w-0 gap-3 rounded-control border border-separator bg-surface-elevation-2 p-3 sm:grid-cols-[minmax(150px,1.2fr)_minmax(120px,0.8fr)_minmax(120px,0.8fr)_auto] sm:items-end"
          >
            <Select
              name="weekday"
              value={row.weekday}
              label={labels.weekday}
              onChange={(e) =>
                update(index, { weekday: Number(e.target.value) })
              }
            >
              {labels.days.map((day, value) => (
                <option key={day} value={value}>
                  {day}
                </option>
              ))}
            </Select>

            <TextField
              type="time"
              name="from"
              value={row.from}
              label={labels.from}
              onChange={(e) => update(index, { from: e.target.value })}
            />

            <TextField
              type="time"
              name="to"
              value={row.to}
              label={labels.to}
              onChange={(e) => update(index, { to: e.target.value })}
            />

            <button
              type="button"
              onClick={() =>
                setRows((current) => current.filter((_, i) => i !== index))
              }
              data-testid={`schedule-remove-${index}`}
              className="focus-ring inline-flex min-h-11 items-center justify-center gap-1.5 rounded-control px-3 py-2 text-sm font-semibold text-highlight hover:bg-surface-elevation-1"
            >
              <MdDeleteOutline aria-hidden="true" className="size-4" />
              {labels.remove}
            </button>
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Button
          type="button"
          onClick={() =>
            setRows((current) => [
              ...current,
              { weekday: 1, from: "09:00", to: "14:00" },
            ])
          }
          data-testid="schedule-add"
          startIcon={<MdAdd aria-hidden="true" />}
          className="w-full sm:w-auto"
        >
          {labels.add}
        </Button>

        <Button
          type="submit"
          color="green"
          disabled={pending}
          isLoading={pending}
          data-testid="schedule-submit"
          startIcon={<MdSave aria-hidden="true" />}
          className="w-full sm:w-auto"
        >
          {labels.submit}
        </Button>
      </div>

      {state.saved ? (
        <Alert
          tone="success"
          label={labels.savedStatusLabel}
          data-testid="schedule-saved"
        >
          {labels.saved}
        </Alert>
      ) : null}
      {state.error === "invalid" ? (
        <Alert
          tone="error"
          label={labels.invalidStatusLabel}
          data-testid="schedule-error"
        >
          {labels.invalid}
        </Alert>
      ) : null}
    </form>
  );
}
