"use server";
// ↑ Primera línea, y no es cosmético: solo cuenta como directiva si es la primera sentencia. Debajo
// de un import, `ChannelForm` —que es Client Component— se llevaría al navegador este módulo entero,
// con `auth` y la conexión a la base. Lo vigila `pnpm run check:directives`.

import { getLocale, getTranslations } from "next-intl/server";
import type { OutreachChannelErrors } from "~/domain/outreach/outreachChannelDraft";
import { redirectKeepingLocale } from "~/i18n/redirectKeepingLocale";
import { resolveLocale } from "~/i18n/routing";
import { auth } from "~/infra/auth";
import { isAdmin } from "~/infra/auth/isAdmin";
import { createOutreachChannelRepository } from "~/infra/dataAccess/outreach/factory";
import SaveOutreachChannelUseCase from "~/use_cases/outreach/saveOutreachChannelUseCase";
import { deleteOutreachRecord } from "../deleteRecord";
import type { DeleteState } from "../ui/ConfirmDelete";

export interface ChannelFormState {
  errors: {
    name?: string;
    url?: string;
    format?: string;
    minDaysBetween?: string;
    form?: string;
  };
}

type Translate = Awaited<ReturnType<typeof getTranslations<"outreach">>>;

function text(formData: FormData, field: string): string {
  const value = formData.get(field);

  return typeof value === "string" ? value : "";
}

function translateErrors(
  errors: OutreachChannelErrors,
  t: Translate,
): ChannelFormState["errors"] {
  return {
    ...(errors.name ? { name: t("groupNameRequired") } : {}),
    ...(errors.url ? { url: t("groupUrlInvalid") } : {}),
    ...(errors.format ? { format: t("groupFormatInvalid") } : {}),
    ...(errors.minDaysBetween
      ? { minDaysBetween: t("groupMinDaysInvalid") }
      : {}),
  };
}

export async function saveOutreachChannel(
  _state: ChannelFormState,
  formData: FormData,
): Promise<ChannelFormState> {
  const t = await getTranslations("outreach");
  const session = await auth();

  // El gate es el mismo que el de la página: una Server Action se puede invocar directamente.
  if (!isAdmin(session?.user?.email)) {
    return { errors: { form: t("noPermission") } };
  }

  const result = await new SaveOutreachChannelUseCase(
    createOutreachChannelRepository(),
  ).execute({
    id: text(formData, "id") || null,
    draft: {
      name: text(formData, "name"),
      url: text(formData, "url"),
      format: text(formData, "format"),
      minDaysBetween: text(formData, "minDaysBetween"),
      notes: text(formData, "notes"),
    },
  });

  if (result.status === "invalid") {
    return { errors: translateErrors(result.errors, t) };
  }
  if (result.status === "not-found") {
    return { errors: { form: t("groupNotFound") } };
  }

  redirectKeepingLocale(
    "/admin/difusion/grupos",
    resolveLocale(await getLocale()),
  );
}

export async function deleteOutreachChannel(
  _state: DeleteState,
  formData: FormData,
): Promise<DeleteState> {
  return deleteOutreachRecord(createOutreachChannelRepository(), formData, {
    backTo: "/admin/difusion/grupos",
    gone: "groupNotFound",
  });
}
