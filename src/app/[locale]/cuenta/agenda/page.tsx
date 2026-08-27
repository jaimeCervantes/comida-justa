import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { User } from "~/domain/entities/post/types";
import { resolveLocale } from "~/i18n/routing";
import { auth } from "~/infra/auth";
import { redirectToSignIn } from "~/infra/auth/redirectToSignIn";
import { findProfileOfUser } from "~/infra/dataAccess/identity/sessionIdentity";
import { createScheduleRepository } from "~/infra/dataAccess/schedule/factory";
import { createSellerRepository } from "~/infra/dataAccess/sellers/factory";
import { Heading } from "~/presentation/design_system/typography/Heading";
import AccountNav, { ACCOUNT_PAGE_LAYOUT } from "../ui/AccountNav";
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

  const session = await auth();
  const userId = (session?.user as User | undefined)?.id;

  if (!userId) redirectToSignIn(resolveLocale(locale), "/cuenta/agenda");

  const [seller, profile] = await Promise.all([
    createSellerRepository().findByUserId(userId),
    findProfileOfUser(userId),
  ]);

  // Sin tienda no hay a qué colgar el horario: se dice, en vez de enseñar un formulario inútil.
  if (!seller) {
    return (
      <main className={ACCOUNT_PAGE_LAYOUT}>
        <AccountNav
          active="schedule"
          username={profile?.username ?? null}
          hasStore={false}
        />

        <div>
          <Heading level={1} className="mb-2">
            {t("scheduleHeading")}
          </Heading>
          <p data-testid="schedule-needs-store">{t("scheduleNeedsStore")}</p>
        </div>
      </main>
    );
  }

  const schedule = createScheduleRepository();
  const [hours, timeOff] = await Promise.all([
    schedule.findWeeklyHours(seller.id),
    schedule.findUpcomingTimeOff(seller.id),
  ]);

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
    <main className={ACCOUNT_PAGE_LAYOUT}>
      <AccountNav
        active="schedule"
        username={profile?.username ?? null}
        hasStore={true}
      />

      <div>
        <Heading level={1} className="mb-2">
          {t("scheduleHeading")}
        </Heading>
        <p className="mb-6 text-text-support">{t("scheduleIntro")}</p>

        <ScheduleForm initial={hours} labels={labels} />

        {/* Debajo del horario y no en otra página: son las dos mitades de la misma respuesta
            —cuándo atiendo y cuándo no— y separarlas obligaría a ir y volver para entender la
            agenda. */}
        <TimeOffList
          periods={timeOff}
          labels={{
            heading: t("timeOffHeading"),
            intro: t("timeOffIntro"),
            from: t("timeOffFrom"),
            to: t("timeOffTo"),
            reason: t("timeOffReason"),
            add: t("timeOffAdd"),
            remove: t("timeOffRemove"),
            empty: t("timeOffEmpty"),
            invalid: t("timeOffInvalid"),
          }}
        />
      </div>
    </main>
  );
}
