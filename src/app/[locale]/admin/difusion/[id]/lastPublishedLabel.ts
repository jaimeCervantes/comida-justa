import type { getTranslations } from "next-intl/server";
import { daysSincePublished } from "~/domain/outreach/lastPublished";
import { COMMUNITY_TIME_ZONE } from "~/domain/schedule/timezone";

type Translate = Awaited<ReturnType<typeof getTranslations<"outreach">>>;

/**
 * «Última vez aquí: hoy», «ayer», «hace 7 días» o «nunca».
 *
 * Se cuenta en el servidor y en la zona de la comunidad, no en la del navegador: así lo que dice la
 * pantalla es lo mismo que contaría el grupo, y la prueba no depende del reloj de quien la corre.
 */
export function lastPublishedLabel(
  t: Translate,
  lastPublishedAt: Date | null,
  now: Date,
): string {
  const days = daysSincePublished(lastPublishedAt, now, COMMUNITY_TIME_ZONE);

  return t("lastPublished", {
    when: days === null ? t("whenNever") : t("whenDays", { days }),
  });
}
