import { expect, type Locator, type Page } from "@playwright/test";
import type { OutreachChannelFormat } from "~/domain/outreach/channelFormats";
import es from "~/i18n/messages/es.json";
import { fillWhenHydrated } from "../testUtils/fillWhenHydrated";
import { deleteAndConfirm } from "./confirmDelete";
import { labelled } from "./labelled";

const t = es.outreach;

export interface GroupFields {
  name: string;
  url: string;
  format: OutreachChannelFormat;
  minDaysBetween: number;
  notes: string;
}

/** `/admin/difusion/grupos` visto por quien la usa: el alta y la lista de grupos. */
export default class OutreachGroups {
  constructor(private readonly page: Page) {}

  async openNew(): Promise<void> {
    await this.page.goto("/admin/difusion/grupos/nuevo");
    await expect(this.form()).toBeVisible();
  }

  form(): Locator {
    return this.page.getByRole("form", { name: t.newGroupHeading });
  }

  async fill(fields: GroupFields): Promise<void> {
    const form = this.form();

    await fillWhenHydrated(
      form.getByRole("textbox", { name: labelled(t.groupName) }),
      fields.name,
    );
    await fillWhenHydrated(
      form.getByRole("textbox", { name: labelled(t.groupUrl) }),
      fields.url,
    );
    await form
      .getByRole("combobox", { name: labelled(t.groupFormat) })
      .selectOption(fields.format);
    await fillWhenHydrated(
      form.getByRole("spinbutton", { name: labelled(t.groupMinDays) }),
      String(fields.minDaysBetween),
    );
    await fillWhenHydrated(
      form.getByRole("textbox", { name: labelled(t.groupNotes) }),
      fields.notes,
    );
  }

  async save(): Promise<void> {
    await this.form().getByRole("button", { name: t.saveGroup }).click();
    // Guardar lleva a la lista: hasta que se ve, la acción no terminó.
    await expect(this.page.getByTestId("outreach-groups")).toBeVisible();
  }

  group(name: string): Locator {
    return this.page.getByTestId("outreach-group").filter({ hasText: name });
  }

  summary(name: string): Locator {
    return this.group(name).getByTestId("outreach-group-summary");
  }

  /** El nombre del grupo es el enlace que lo abre en Facebook. */
  link(name: string): Locator {
    return this.group(name).getByRole("link", { name, exact: true });
  }

  async openEdit(id: string): Promise<void> {
    await this.page.goto(`/admin/difusion/grupos/${id}/editar`);
    await expect(this.page.getByRole("heading", { level: 1 })).toBeVisible();
  }

  /** Desde su edición: confirma y vuelve a la lista de grupos. */
  async deleteGroup(): Promise<void> {
    await deleteAndConfirm(this.page, t.deleteGroup, t.groupsHeading);
  }
}
