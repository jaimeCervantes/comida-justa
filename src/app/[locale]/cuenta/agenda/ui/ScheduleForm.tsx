"use client";

import { useActionState, useState } from "react";
import type { WeeklyHours } from "~/domain/schedule/slots";
import { saveSchedule } from "../actions";

export type ScheduleLabels = {
  weekday: string;
  from: string;
  to: string;
  add: string;
  remove: string;
  empty: string;
  submit: string;
  saved: string;
  invalid: string;
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
    <form action={action} data-testid="schedule-form">
      {rows.length === 0 ? (
        <p className="text-gray-500 mb-4" data-testid="schedule-empty">
          {labels.empty}
        </p>
      ) : null}

      <ul className="list-none p-0 m-0">
        {rows.map((row, index) => (
          <li
            // El índice ES la identidad aquí: las filas no tienen id hasta guardarse.
            key={`${row.weekday}-${index}`}
            data-testid={`schedule-row-${index}`}
            className="flex flex-wrap items-end gap-2 mb-3"
          >
            <label className="flex flex-col">
              <span className="text-sm">{labels.weekday}</span>
              <select
                name="weekday"
                value={row.weekday}
                onChange={(e) =>
                  update(index, { weekday: Number(e.target.value) })
                }
                className="border rounded px-2 py-1 bg-transparent"
              >
                {labels.days.map((day, value) => (
                  <option key={day} value={value}>
                    {day}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col">
              <span className="text-sm">{labels.from}</span>
              <input
                type="time"
                name="from"
                value={row.from}
                onChange={(e) => update(index, { from: e.target.value })}
                className="border rounded px-2 py-1 bg-transparent"
              />
            </label>

            <label className="flex flex-col">
              <span className="text-sm">{labels.to}</span>
              <input
                type="time"
                name="to"
                value={row.to}
                onChange={(e) => update(index, { to: e.target.value })}
                className="border rounded px-2 py-1 bg-transparent"
              />
            </label>

            <button
              type="button"
              onClick={() => setRows(rows.filter((_, i) => i !== index))}
              data-testid={`schedule-remove-${index}`}
              className="text-sm underline text-pw-green"
            >
              {labels.remove}
            </button>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center gap-4 mt-4">
        <button
          type="button"
          onClick={() =>
            setRows([...rows, { weekday: 1, from: "09:00", to: "14:00" }])
          }
          data-testid="schedule-add"
          className="text-sm underline text-pw-green"
        >
          {labels.add}
        </button>

        <button
          type="submit"
          disabled={pending}
          data-testid="schedule-submit"
          className="rounded bg-pw-green px-4 py-2 text-white disabled:opacity-50"
        >
          {labels.submit}
        </button>
      </div>

      {state.saved ? (
        <p className="mt-3 text-sm" data-testid="schedule-saved">
          {labels.saved}
        </p>
      ) : null}
      {state.error === "invalid" ? (
        <p
          className="mt-3 text-sm text-feedback-error"
          data-testid="schedule-error"
        >
          {labels.invalid}
        </p>
      ) : null}
    </form>
  );
}
