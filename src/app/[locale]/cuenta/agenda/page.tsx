import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { User } from "~/domain/entities/post/types";
import { resolveLocale } from "~/i18n/routing";
import { auth } from "~/infra/auth";
import { redirectToSignIn } from "~/infra/auth/redirectToSignIn";
import { createScheduleRepository } from "~/infra/dataAccess/schedule/factory";
import { createSellerRepository } from "~/infra/dataAccess/sellers/factory";
import { CARD_PADDING } from "~/presentation/design_system/surfaces/cardSpacing";
import { Surface } from "~/presentation/design_system/surfaces/Surface";
import { Heading } from "~/presentation/design_system/typography/Heading";
import AccountCard from "../ui/AccountCard";
import AccountSection from "../ui/AccountSection";
import ScheduleForm, { type ScheduleLabels } from "./ui/ScheduleForm";
import TimeOffList from "./ui/TimeOffList";

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
  const tCommon = await getTranslations("common");

  const session = await auth();
  const userId = (session?.user as User | undefined)?.id;

  if (!userId) redirectToSignIn(resolveLocale(locale), "/cuenta/agenda");

  const seller = await createSellerRepository().findByUserId(userId);

  // Sin tienda no hay a qué colgar el horario: se dice, en vez de enseñar un formulario inútil.
  if (!seller) {
    return (
      <AccountSection active="schedule">
        <Heading level={1} className="mb-2">
          {t("scheduleHeading")}
        </Heading>
        <p data-testid="schedule-needs-store">{t("scheduleNeedsStore")}</p>
      </AccountSection>
    );
  }

  const schedule = createScheduleRepository();
  const [hours, timeOff] = await Promise.all([
    schedule.findWeeklyHours(seller.id),
    schedule.findUpcomingTimeOff(seller.id),
  ]);

  const labels: ScheduleLabels = {
    formLabel: t("scheduleFormLabel"),
    listLabel: t("scheduleListLabel"),
    weekday: t("scheduleWeekday"),
    from: t("scheduleFrom"),
    to: t("scheduleTo"),
    add: t("scheduleAdd"),
    remove: t("scheduleRemove"),
    empty: t("scheduleEmpty"),
    submit: t("scheduleSubmit"),
    saved: t("scheduleSaved"),
    savedStatusLabel: tCommon("alertSaved"),
    invalid: t("scheduleInvalid"),
    invalidStatusLabel: tCommon("alertError"),
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
    <AccountSection active="schedule">
      <div className="flex flex-col gap-6">
        <header>
          <Heading level={1} className="mb-2">
            {t("scheduleHeading")}
          </Heading>
          <p className="max-w-3xl text-text-support">{t("scheduleIntro")}</p>
        </header>

        <Surface
          as="section"
          background="raised"
          border="subtle"
          elevation="sm"
          radius="card"
          className={CARD_PADDING}
          data-testid="schedule-summary"
          aria-label={t("scheduleSummaryHeading")}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-control bg-surface-elevation-2 p-4">
              <p className="text-sm font-semibold text-text-base">
                {t("weeklyHoursHeading")}
              </p>
              <p className="mt-1 text-body-lg font-semibold text-highlight">
                {hours.length > 0
                  ? t("scheduleSummaryWeeklyCount", { count: hours.length })
                  : t("scheduleSummaryWeeklyEmpty")}
              </p>
            </div>

            <div className="rounded-control bg-surface-elevation-2 p-4">
              <p className="text-sm font-semibold text-text-base">
                {t("timeOffHeading")}
              </p>
              <p className="mt-1 text-body-lg font-semibold text-highlight">
                {timeOff.length > 0
                  ? t("scheduleSummaryTimeOffCount", {
                      count: timeOff.length,
                    })
                  : t("scheduleSummaryTimeOffEmpty")}
              </p>
            </div>
          </div>
        </Surface>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] xl:items-start">
          <AccountCard
            title={t("weeklyHoursHeading")}
            intro={t("weeklyHoursIntro")}
            testId="weekly-hours-card"
          >
            <ScheduleForm initial={hours} labels={labels} />
          </AccountCard>

          {/* Debajo del horario y no en otra página: son las dos mitades de la misma respuesta
          —cuándo atiendo y cuándo no— y separarlas obligaría a ir y volver para entender la
          agenda. */}
          <AccountCard
            title={t("timeOffHeading")}
            intro={t("timeOffIntro")}
            testId="time-off-card"
          >
            <TimeOffList
              periods={timeOff}
              labels={{
                formLabel: t("timeOffFormLabel"),
                listLabel: t("timeOffListLabel"),
                from: t("timeOffFrom"),
                to: t("timeOffTo"),
                reason: t("timeOffReason"),
                add: t("timeOffAdd"),
                remove: t("timeOffRemove"),
                empty: t("timeOffEmpty"),
                invalid: t("timeOffInvalid"),
                invalidStatusLabel: tCommon("alertError"),
              }}
            />
          </AccountCard>
        </div>
      </div>
    </AccountSection>
  );
}
