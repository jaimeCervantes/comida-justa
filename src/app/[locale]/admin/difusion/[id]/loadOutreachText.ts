import { notFound } from "next/navigation";
import { COMMUNITY_TIME_ZONE } from "~/domain/schedule/timezone";
import { type AppLocale, routing } from "~/i18n/routing";
import {
  createOutreachChannelRepository,
  createOutreachPublicationRepository,
  createOutreachTextRepository,
} from "~/infra/dataAccess/outreach/factory";
import GetOutreachKitUseCase, {
  type OutreachKitView,
} from "~/use_cases/outreach/getOutreachKitUseCase";

/**
 * El texto con su lista de hoy, su historial y su ritmo, o 404 si la dirección no lleva a ninguno.
 *
 * «Hoy» se cuenta en la zona de la comunidad, no en la del servidor: Vercel corre en UTC, y a las
 * 19:00 de México ya sería mañana.
 */
export async function loadOutreachText(
  id: string,
  locale: AppLocale,
  now: Date = new Date(),
): Promise<OutreachKitView> {
  const view = await new GetOutreachKitUseCase(
    createOutreachTextRepository(),
    createOutreachChannelRepository(),
    createOutreachPublicationRepository(),
  ).execute(
    id,
    { locale, fallbackLocale: routing.defaultLocale },
    { now, timeZone: COMMUNITY_TIME_ZONE },
  );

  if (!view) notFound();

  return view;
}
