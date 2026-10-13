import { notFound } from "next/navigation";
import { type AppLocale, routing } from "~/i18n/routing";
import { createOutreachTextRepository } from "~/infra/dataAccess/outreach/factory";
import GetOutreachKitUseCase, {
  type OutreachKitView,
} from "~/use_cases/outreach/getOutreachKitUseCase";

/** El texto con su lista de hoy, o 404 si la dirección no lleva a ninguno. */
export async function loadOutreachText(
  id: string,
  locale: AppLocale,
): Promise<OutreachKitView> {
  const view = await new GetOutreachKitUseCase(
    createOutreachTextRepository(),
  ).execute(id, { locale, fallbackLocale: routing.defaultLocale });

  if (!view) notFound();

  return view;
}
