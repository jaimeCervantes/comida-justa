import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { User } from "~/domain/entities/post/types";
import { splitAppointmentOrders } from "~/domain/order/appointments";
import { Link } from "~/i18n/navigation";
import { resolveLocale } from "~/i18n/routing";
import { auth } from "~/infra/auth";
import { redirectToSignIn } from "~/infra/auth/redirectToSignIn";
import { createOrderRepository } from "~/infra/dataAccess/orders/factory";
import { createScheduleRepository } from "~/infra/dataAccess/schedule/factory";
import { createSellerRepository } from "~/infra/dataAccess/sellers/factory";
import { CARD_PADDING } from "~/presentation/design_system/surfaces/cardSpacing";
import { Surface } from "~/presentation/design_system/surfaces/Surface";
import { Heading } from "~/presentation/design_system/typography/Heading";
import SellerOrders from "~/presentation/orders/OrderLists/SellerOrders";
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
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ tab?: string | string[] }>;
}) {
  const { locale } = await params;
  const resolvedLocale = resolveLocale(locale);
  setRequestLocale(resolvedLocale);
  const t = await getTranslations("account");
  const tOrders = await getTranslations("orders");
  const tCommon = await getTranslations("common");
  const requestedTab = firstParam((await searchParams)?.tab);
  const activeTab = requestedTab === "citas" ? "appointments" : "availability";

  const session = await auth();
  const userId = (session?.user as User | undefined)?.id;

  if (!userId) redirectToSignIn(resolvedLocale, "/cuenta/agenda");

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

  function AgendaHeader(): React.ReactElement {
    return (
      <header className="flex flex-col gap-4">
        <div>
          <Heading level={1} className="mb-2">
            {t("scheduleHeading")}
          </Heading>
          <p className="max-w-3xl text-text-support">{t("scheduleIntro")}</p>
        </div>

        <nav
          aria-label={t("scheduleTabsLabel")}
          className="flex flex-wrap gap-2"
          data-testid="schedule-tabs"
        >
          <Link
            href="/cuenta/agenda"
            aria-current={activeTab === "availability" ? "page" : undefined}
            className={tabClass(activeTab === "availability")}
          >
            {t("scheduleAvailabilityTab")}
          </Link>
          <Link
            href={{ pathname: "/cuenta/agenda", query: { tab: "citas" } }}
            aria-current={activeTab === "appointments" ? "page" : undefined}
            className={tabClass(activeTab === "appointments")}
          >
            {t("scheduleAppointmentsTab")}
          </Link>
        </nav>
      </header>
    );
  }

  if (activeTab === "appointments") {
    const appointments = await createOrderRepository().listAppointmentsBySeller(
      {
        sellerId: seller.id,
        locale: resolvedLocale,
        fallbackLocale: "es",
      },
    );
    const groups = splitAppointmentOrders(appointments);

    return (
      <AccountSection active="schedule">
        <div className="flex flex-col gap-6" data-testid="seller-appointments">
          <AgendaHeader />

          <section
            className="flex flex-col gap-4"
            aria-label={tOrders("upcomingAppointments")}
            data-testid="seller-appointments-upcoming"
          >
            <Heading level={2}>{tOrders("upcomingAppointments")}</Heading>
            {groups.upcoming.length > 0 ? (
              <SellerOrders orders={groups.upcoming} emptyKey="filtered" />
            ) : (
              <p
                className="text-text-support"
                data-testid="seller-appointments-empty"
              >
                {tOrders("sellerAppointmentsEmpty")}
              </p>
            )}
          </section>

          {groups.past.length > 0 ? (
            <section
              className="flex flex-col gap-4"
              aria-label={tOrders("pastAppointments")}
              data-testid="seller-appointments-past"
            >
              <Heading level={2}>{tOrders("pastAppointments")}</Heading>
              <SellerOrders orders={groups.past} emptyKey="filtered" />
            </section>
          ) : null}
        </div>
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
        <AgendaHeader />

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

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function tabClass(active: boolean): string {
  const base =
    "focus-ring rounded-control px-3 py-2 text-sm font-medium transition-colors";

  return active
    ? `${base} bg-brand-green-soft text-brand-green-900`
    : `${base} text-text-base hover:bg-surface-elevation-2 hover:text-highlight`;
}
