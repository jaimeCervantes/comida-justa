import { notFound } from "next/navigation";
import { type AppLocale, routing } from "~/i18n/routing";
import {
  createOutreachChannelRepository,
  createOutreachPublicationRepository,
  createOutreachTextRepository,
} from "~/infra/dataAccess/outreach/factory";
import GetOutreachKitUseCase, {
  type OutreachKitView,
} from "~/use_cases/outreach/getOutreachKitUseCase";

/** El texto con su lista de hoy y su historial, o 404 si la dirección no lleva a ninguno. */
export async function loadOutreachText(
  id: string,
  locale: AppLocale,
): Promise<OutreachKitView> {
  const view = await new GetOutreachKitUseCase(
    createOutreachTextRepository(),
    createOutreachChannelRepository(),
    createOutreachPublicationRepository(),
  ).execute(id, { locale, fallbackLocale: routing.defaultLocale });

  if (!view) notFound();

  return view;
}
