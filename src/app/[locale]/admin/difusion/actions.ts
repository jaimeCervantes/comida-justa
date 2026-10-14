"use server";
// ↑ Primera línea, y no es cosmético: solo cuenta como directiva si es la primera sentencia. Debajo
// de un import, `OutreachTextForm` —que es Client Component— se llevaría al navegador este módulo
// entero, con `auth` y la conexión a la base. Lo vigila `pnpm run check:directives`.

import { getLocale, getTranslations } from "next-intl/server";
import type {
  OutreachTextDraftItem,
  OutreachTextErrors,
} from "~/domain/outreach/outreachTextDraft";
import { redirectKeepingLocale } from "~/i18n/redirectKeepingLocale";
import { resolveLocale } from "~/i18n/routing";
import { auth } from "~/infra/auth";
import { isAdmin } from "~/infra/auth/isAdmin";
import { createOutreachTextRepository } from "~/infra/dataAccess/outreach/factory";
import SaveOutreachTextUseCase from "~/use_cases/outreach/saveOutreachTextUseCase";

export interface OutreachFormState {
  errors: {
    name?: string;
    /** Por posición del producto en el formulario. */
    items?: Record<number, string>;
    form?: string;
  };
}

type Translate = Awaited<ReturnType<typeof getTranslations<"outreach">>>;

/** El gate es el mismo que el de la página: una Server Action se puede invocar directamente. */
async function requireAdmin(): Promise<boolean> {
  const session = await auth();

  return isAdmin(session?.user?.email);
}

function text(formData: FormData, field: string): string {
  const value = formData.get(field);

  return typeof value === "string" ? value : "";
}

/**
 * Los productos viajan como un JSON en un campo oculto, porque su orden **es** el dato y una lista
 * de campos repetidos no lo garantiza. Lo que no tenga la forma esperada se descarta: solo llega así
 * una petición armada a mano.
 */
function parseItems(raw: string): OutreachTextDraftItem[] {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw || "[]");
  } catch {
    return [];
  }

  if (!Array.isArray(parsed)) return [];

  return parsed.flatMap((entry): OutreachTextDraftItem[] => {
    if (typeof entry !== "object" || entry === null) return [];

    const { postId, label, emoji } = entry as Record<string, unknown>;

    if (typeof postId !== "string" || typeof label !== "string") return [];

    return [{ postId, label, emoji: typeof emoji === "string" ? emoji : null }];
  });
}

function translateErrors(
  errors: OutreachTextErrors,
  t: Translate,
): OutreachFormState["errors"] {
  const items = Object.fromEntries(
    Object.keys(errors.items ?? {}).map((index) => [
      Number(index),
      t("labelRequired"),
    ]),
  );

  return {
    ...(errors.name ? { name: t("nameRequired") } : {}),
    ...(errors.items ? { items } : {}),
  };
}

export async function saveOutreachText(
  _state: OutreachFormState,
  formData: FormData,
): Promise<OutreachFormState> {
  const t = await getTranslations("outreach");

  if (!(await requireAdmin())) {
    return { errors: { form: t("noPermission") } };
  }

  const id = text(formData, "id") || null;
  let result: Awaited<ReturnType<SaveOutreachTextUseCase["execute"]>>;

  try {
    result = await new SaveOutreachTextUseCase(
      createOutreachTextRepository(),
    ).execute({
      id,
      draft: {
        name: text(formData, "name"),
        opening: text(formData, "opening"),
        closing: text(formData, "closing"),
        items: parseItems(text(formData, "items")),
        versions: formData
          .getAll("versions")
          .filter((value): value is string => typeof value === "string"),
        footerId: text(formData, "footerId") || null,
      },
    });
  } catch (error) {
    // La base tiene la última palabra: un producto que se borró mientras el formulario estaba
    // abierto choca contra su llave foránea. Se dice en vez de pintar una pantalla de error.
    // i18n-ignore: traza de servidor para quien depura; el visitante ve `saveFailed`.
    console.error("[difusión] no se pudo guardar el texto", error);

    return { errors: { form: t("saveFailed") } };
  }

  if (result.status === "invalid") {
    return { errors: translateErrors(result.errors, t) };
  }
  if (result.status === "not-found") return { errors: { form: t("notFound") } };

  redirectKeepingLocale(
    { pathname: "/admin/difusion/[id]", params: { id: result.id } },
    resolveLocale(await getLocale()),
  );
}
