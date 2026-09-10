import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { User } from "~/domain/entities/post/types";
import { splitAppointmentOrders } from "~/domain/order/appointments";
import { resolveLocale } from "~/i18n/routing";
import { auth } from "~/infra/auth";
import { redirectToSignIn } from "~/infra/auth/redirectToSignIn";
import { createOrderRepository } from "~/infra/dataAccess/orders/factory";
import { Heading } from "~/presentation/design_system/typography/Heading";
import BuyerOrders from "~/presentation/orders/OrderLists/BuyerOrders";
import AccountSection from "../cuenta/ui/AccountSection";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("orders");

  return {
    title: t("appointmentsHeading"),
    description: t("appointmentsMetaDescription"),
    robots: { index: false },
  };
}

export default async function AppointmentsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const resolvedLocale = resolveLocale(locale);
  setRequestLocale(resolvedLocale);

  const t = await getTranslations("orders");
  const session = await auth();
  const userId = (session?.user as User | undefined)?.id;

  if (!userId) redirectToSignIn(resolvedLocale, "/citas");

  const appointments = await createOrderRepository().listAppointmentsByBuyer({
    buyerId: userId,
    locale: resolvedLocale,
    fallbackLocale: "es",
  });
  const groups = splitAppointmentOrders(appointments);

  return (
    <AccountSection active="appointments">
      <div className="flex flex-col gap-6" data-testid="appointments-page">
        <header>
          <Heading level={1} className="mb-2">
            {t("appointmentsHeading")}
          </Heading>
          <p className="max-w-3xl text-text-support">
            {t("appointmentsIntro")}
          </p>
        </header>

        <section
          className="flex flex-col gap-4"
          aria-label={t("upcomingAppointments")}
          data-testid="appointments-upcoming"
        >
          <Heading level={2}>{t("upcomingAppointments")}</Heading>
          {groups.upcoming.length > 0 ? (
            <BuyerOrders orders={groups.upcoming} emptyKey="filtered" />
          ) : (
            <p className="text-text-support" data-testid="appointments-empty">
              {t("appointmentsEmpty")}
            </p>
          )}
        </section>

        {groups.past.length > 0 ? (
          <section
            className="flex flex-col gap-4"
            aria-label={t("pastAppointments")}
            data-testid="appointments-past"
          >
            <Heading level={2}>{t("pastAppointments")}</Heading>
            <BuyerOrders orders={groups.past} emptyKey="filtered" />
          </section>
        ) : null}
      </div>
    </AccountSection>
  );
}
