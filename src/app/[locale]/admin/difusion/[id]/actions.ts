"use server";
// ↑ Primera línea, y no es cosmético: solo cuenta como directiva si es la primera sentencia. Debajo
// de un import, `MarkPublishedForm` —que es Client Component— se llevaría al navegador este módulo
// entero, con `auth` y la conexión a la base. Lo vigila `pnpm run check:directives`.

import { getLocale, getTranslations } from "next-intl/server";
import { redirectKeepingLocale } from "~/i18n/redirectKeepingLocale";
import { resolveLocale, routing } from "~/i18n/routing";
import { auth } from "~/infra/auth";
import { isAdmin } from "~/infra/auth/isAdmin";
import {
  createOutreachChannelRepository,
  createOutreachPublicationRepository,
  createOutreachTextRepository,
} from "~/infra/dataAccess/outreach/factory";
import RecordOutreachPublicationsUseCase from "~/use_cases/outreach/recordOutreachPublicationsUseCase";

export interface MarkPublishedState {
  error?: string;
}

function text(formData: FormData, field: string): string {
  const value = formData.get(field);

  return typeof value === "string" ? value : "";
}

/**
 * Deja escrito en qué grupos quedó publicada: la línea entera o, con `postId`, un pan suelto.
 *
 * Al terminar vuelve a la misma página, que se arma otra vez con el historial nuevo: así lo que se
 * ve después de marcar es lo que dice la base, no lo que el formulario cree que pasó.
 */
export async function markOutreachPublished(
  _state: MarkPublishedState,
  formData: FormData,
): Promise<MarkPublishedState> {
  const t = await getTranslations("outreach");
  const session = await auth();

  // El gate es el mismo que el de la página: una Server Action se puede invocar directamente.
  if (!isAdmin(session?.user?.email)) return { error: t("noPermission") };

  const locale = resolveLocale(await getLocale());
  const outreachTextId = text(formData, "outreachTextId");
  const result = await new RecordOutreachPublicationsUseCase(
    createOutreachTextRepository(),
    createOutreachChannelRepository(),
    createOutreachPublicationRepository(),
  ).execute({
    outreachTextId,
    channelIds: formData
      .getAll("channelIds")
      .filter((value): value is string => typeof value === "string"),
    postId: text(formData, "postId") || null,
    locales: { locale, fallbackLocale: routing.defaultLocale },
  });

  if (result.status === "nothing-selected") {
    return { error: t("markNothingSelected") };
  }
  if (result.status === "not-found") return { error: t("notFound") };
  if (result.status === "invalid") return { error: t("markInvalid") };

  redirectKeepingLocale(
    { pathname: "/admin/difusion/[id]", params: { id: outreachTextId } },
    locale,
  );
}
