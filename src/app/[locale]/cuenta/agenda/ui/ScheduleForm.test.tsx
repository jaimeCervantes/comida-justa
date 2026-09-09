import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import es from "~/i18n/messages/es.json";
import ScheduleForm, { type ScheduleLabels } from "./ScheduleForm";

vi.mock("../actions", () => ({
  saveSchedule: vi.fn(async () => ({})),
}));

const labels: ScheduleLabels = {
  formLabel: es.account.scheduleFormLabel,
  listLabel: es.account.scheduleListLabel,
  weekday: es.account.scheduleWeekday,
  from: es.account.scheduleFrom,
  to: es.account.scheduleTo,
  add: es.account.scheduleAdd,
  remove: es.account.scheduleRemove,
  empty: es.account.scheduleEmpty,
  submit: es.account.scheduleSubmit,
  saved: es.account.scheduleSaved,
  savedStatusLabel: es.common.alertSaved,
  invalid: es.account.scheduleInvalid,
  invalidStatusLabel: es.common.alertError,
  days: [
    es.account.weekday0,
    es.account.weekday1,
    es.account.weekday2,
    es.account.weekday3,
    es.account.weekday4,
    es.account.weekday5,
    es.account.weekday6,
  ],
};

describe("ScheduleForm", () => {
  it("explica el estado vacio sin ocultar las acciones principales", () => {
    render(<ScheduleForm initial={[]} labels={labels} />);

    const form = screen.getByRole("form", { name: labels.formLabel });

    expect(within(form).getByTestId("schedule-empty")).toHaveTextContent(
      labels.empty,
    );
    expect(
      within(form).getByRole("button", { name: labels.add }),
    ).toBeVisible();
    expect(
      within(form).getByRole("button", { name: labels.submit }),
    ).toBeVisible();
  });

  it("agrega una franja editable antes de guardar", async () => {
    const user = userEvent.setup();
    render(<ScheduleForm initial={[]} labels={labels} />);

    await user.click(screen.getByRole("button", { name: labels.add }));

    const list = screen.getByRole("list", { name: labels.listLabel });
    const row = within(list).getByTestId("schedule-row-0");

    expect(
      within(row).getByRole("combobox", { name: labels.weekday }),
    ).toHaveValue("1");
    expect(
      within(row).getByLabelText(labels.from) as HTMLInputElement,
    ).toHaveValue("09:00");
    expect(
      within(row).getByLabelText(labels.to) as HTMLInputElement,
    ).toHaveValue("14:00");
    expect(
      within(row).getByRole("button", { name: labels.remove }),
    ).toBeVisible();
  });
});
