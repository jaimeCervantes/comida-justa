import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { User } from "~/domain/entities/post/types";
import { redirectKeepingLocale } from "~/i18n/redirectKeepingLocale";
import { resolveLocale } from "~/i18n/routing";
import { auth } from "~/infra/auth";
import { SIGNIN_PATH } from "~/infra/constants";
import { createScheduleRepository } from "~/infra/dataAccess/schedule/factory";
import { createSellerRepository } from "~/infra/dataAccess/sellers/factory";
import ScheduleForm, { type ScheduleLabels } from "./ui/ScheduleForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account");

  return { title: t("scheduleHeading"), robots: { index: false } };
}

/**
 * Dónde el proveedor dice cuándo atiende.
 *
 * Cuelga de la cuenta y no de la tienda porque la agenda es **de quien atiende**, no de un servicio:
 * una masajista con dos servicios tiene una sola semana. Es la misma decisión que ya toma el
 * esquema al colgar `provider_availability` de `sellers`.
 */
export default async function AgendaPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(resolveLocale(locale));
  const t = await getTranslations("account");

  const session = await auth();
  const userId = (session?.user as User | undefined)?.id;

  if (!userId) redirectKeepingLocale(SIGNIN_PATH, resolveLocale(locale));

  const seller = await createSellerRepository().findByUserId(userId);

  // Sin tienda no hay a qué colgar el horario: se dice, en vez de enseñar un formulario inútil.
  if (!seller) {
    return (
      <main>
        <h1 className="text-xl font-bold mb-2">{t("scheduleHeading")}</h1>
        <p data-testid="schedule-needs-store">{t("scheduleNeedsStore")}</p>
      </main>
    );
  }

  const hours = await createScheduleRepository().findWeeklyHours(seller.id);

  const labels: ScheduleLabels = {
    weekday: t("scheduleWeekday"),
    from: t("scheduleFrom"),
    to: t("scheduleTo"),
    add: t("scheduleAdd"),
    remove: t("scheduleRemove"),
    empty: t("scheduleEmpty"),
    submit: t("scheduleSubmit"),
    saved: t("scheduleSaved"),
    invalid: t("scheduleInvalid"),
    days: [
      t("weekday0"),
      t("weekday1"),
      t("weekday2"),
      t("weekday3"),
      t("weekday4"),
      t("weekday5"),
      t("weekday6"),
    ],
  };

  return (
    <main>
      <h1 className="text-xl font-bold mb-2">{t("scheduleHeading")}</h1>
      <p className="mb-6 text-gray-600 dark:text-gray-400">
        {t("scheduleIntro")}
      </p>

      <ScheduleForm initial={hours} labels={labels} />
    </main>
  );
}
