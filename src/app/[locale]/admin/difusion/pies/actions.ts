"use server";
// ↑ Primera línea, y no es cosmético: solo cuenta como directiva si es la primera sentencia. Debajo
// de un import, `FooterForm` —que es Client Component— se llevaría al navegador este módulo entero,
// con `auth` y la conexión a la base. Lo vigila `pnpm run check:directives`.

import { getLocale, getTranslations } from "next-intl/server";
import { redirectKeepingLocale } from "~/i18n/redirectKeepingLocale";
import { resolveLocale } from "~/i18n/routing";
import { auth } from "~/infra/auth";
import { isAdmin } from "~/infra/auth/isAdmin";
import { createOutreachFooterRepository } from "~/infra/dataAccess/outreach/factory";
import SaveOutreachFooterUseCase from "~/use_cases/outreach/saveOutreachFooterUseCase";

export interface FooterFormState {
  errors: {
    name?: string;
    body?: string;
    form?: string;
  };
}

function text(formData: FormData, field: string): string {
  const value = formData.get(field);

  return typeof value === "string" ? value : "";
}

export async function saveOutreachFooter(
  _state: FooterFormState,
  formData: FormData,
): Promise<FooterFormState> {
  const t = await getTranslations("outreach");
  const session = await auth();

  // El gate es el mismo que el de la página: una Server Action se puede invocar directamente.
  if (!isAdmin(session?.user?.email)) {
    return { errors: { form: t("noPermission") } };
  }

  const result = await new SaveOutreachFooterUseCase(
    createOutreachFooterRepository(),
  ).execute({
    id: text(formData, "id") || null,
    draft: { name: text(formData, "name"), body: text(formData, "body") },
  });

  if (result.status === "invalid") {
    return {
      errors: {
        ...(result.errors.name ? { name: t("footerNameRequired") } : {}),
        ...(result.errors.body ? { body: t("footerBodyRequired") } : {}),
      },
    };
  }
  if (result.status === "not-found") return { errors: { form: t("notFound") } };

  redirectKeepingLocale(
    "/admin/difusion/pies",
    resolveLocale(await getLocale()),
  );
}
