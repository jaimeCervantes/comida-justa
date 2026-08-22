import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { resolveLocale, routing } from "~/i18n/routing";
import { localizedAlternates } from "~/infra/UI/metadata/alternates";
import LegalPageHeader from "~/presentation/legal/LegalPageHeader";
import LegalSectionHeading from "~/presentation/legal/LegalSectionHeading";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: "privacyPolicy" });

  /* Igual que en las condiciones: el canónico apuntaba a `/es/politica-de-privacidad` y a
     `/en/politica-de-privacidad`, y ninguna de las dos existe. */
  return {
    title: t("title"),
    description: t("description"),
    alternates: localizedAlternates("/politica-de-privacidad", locale),
  };
}

export default async function PrivacyPolicyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  setRequestLocale(locale);

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: "privacyPolicy" });

  const lastUpdateDate = new Date().toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <main className="">
      <LegalPageHeader
        title={t("h1")}
        subtitle={t("subtitle")}
        lastUpdate={t("lastUpdate", { date: lastUpdateDate })}
      />

      {/* Llevaba `prose prose-sm sm:prose-base md:prose-lg prose-zinc dark:prose-invert`, y
          **ninguna de esas seis clases existía**: `@tailwindcss/typography` no está instalado, así
          que el plugin nunca emitió una sola regla `.prose`. El cuerpo de esta página se estaba
          pintando solo con `text-text-support` y los estilos propios de cada párrafo. Es el mismo
          hallazgo del slice 13 del design system: en Tailwind v4 una clase que no existe no falla,
          desaparece. Ahora el tamaño y el interlineado salen de la escala.
          De paso se va `prose-zinc`, que era la última paleta fría del sitio. */}
      <div className="text-body leading-relaxed text-text-support space-y-8 sm:space-y-10">
        <p className="text-base sm:text-lg leading-relaxed font-medium">
          {t("intro")}
        </p>

        <section>
          <LegalSectionHeading number={1}>
            {t("section1.title")}
          </LegalSectionHeading>
          <p className="mb-3">{t("section1.intro")}</p>
          <ul className="list-disc pl-6 space-y-2 mb-4">
            <li>{t("section1.items.0")}</li>
            <li>{t("section1.items.1")}</li>
            <li>{t("section1.items.2")}</li>
            <li>{t("section1.items.3")}</li>
          </ul>
          <div className="bg-feedback-warning-soft border-l-4 border-feedback-warning-ink/30 p-4 rounded-r-lg">
            <p className="text-feedback-warning-ink text-sm font-medium m-0">
              {t("section1.warning")}
            </p>
          </div>
        </section>

        <section>
          <LegalSectionHeading number={2}>
            {t("section2.title")}
          </LegalSectionHeading>
          <p className="mb-3">{t("section2.intro")}</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>{t("section2.items.0")}</li>
            <li>{t("section2.items.1")}</li>
            <li>{t("section2.items.2")}</li>
            <li>{t("section2.items.3")}</li>
            <li>{t("section2.items.4")}</li>
          </ul>
        </section>

        <section>
          <LegalSectionHeading number={3}>
            {t("section3.title")}
          </LegalSectionHeading>
          <ul className="list-disc pl-6 space-y-2 mb-4">
            <li>{t("section3.items.0")}</li>
            <li>{t("section3.items.1")}</li>
            <li>{t("section3.items.2")}</li>
          </ul>
          <div className="bg-feedback-error-soft border-l-4 border-feedback-error-ink/30 p-4 rounded-r-lg">
            <p className="text-brand-clay-700 text-sm font-medium m-0">
              {t("section3.warning")}
            </p>
          </div>
        </section>

        <section>
          <LegalSectionHeading number={4}>
            {t("section4.title")}
          </LegalSectionHeading>
          <p className="font-semibold text-text-base mb-3">
            {t("section4.boldText")}
          </p>
          <p className="mb-3">{t("section4.intro")}</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>{t("section4.items.0")}</li>
            <li>{t("section4.items.1")}</li>
            <li>{t("section4.items.2")}</li>
          </ul>
        </section>

        <section>
          <LegalSectionHeading number={5}>
            {t("section5.title")}
          </LegalSectionHeading>
          <p className="mb-3">{t("section5.p1")}</p>
          <p>{t("section5.p2")}</p>
        </section>

        <section>
          <LegalSectionHeading number={6}>
            {t("section6.title")}
          </LegalSectionHeading>
          <p>{t("section6.p1")}</p>
        </section>

        <section>
          <LegalSectionHeading number={7}>
            {t("section7.title")}
          </LegalSectionHeading>
          <p className="mb-3">{t("section7.intro")}</p>
          <ul className="list-disc pl-6 space-y-2 mb-4">
            <li>{t("section7.items.0")}</li>
            <li>{t("section7.items.1")}</li>
            <li>{t("section7.items.2")}</li>
          </ul>
          <div className="bg-surface-elevation-2 rounded-lg p-5">
            <p className="mb-2">
              {t("section7.actionIntro")}
              <strong className="bg-surface-elevation-2 px-2 py-0.5 rounded-sm text-text-base font-mono">
                {t("section7.actionWord")}
              </strong>
              {t("section7.actionOutro")}
            </p>
            <a
              href="mailto:contacto@hazlosano.com"
              className="text-highlight font-medium hover:underline"
            >
              contacto@hazlosano.com
            </a>
          </div>
        </section>

        <section>
          <LegalSectionHeading number={8}>
            {t("section8.title")}
          </LegalSectionHeading>
          <p>{t("section8.p1")}</p>
        </section>

        <section>
          <LegalSectionHeading number={9}>
            {t("section9.title")}
          </LegalSectionHeading>
          <p>{t("section9.p1")}</p>
        </section>

        <section>
          <LegalSectionHeading number={10}>
            {t("section10.title")}
          </LegalSectionHeading>
          <p className="mb-4">{t("section10.intro")}</p>
          <div className="bg-surface-elevation-2 rounded-control p-8 border border-separator">
            <div>
              <strong className="block text-text-base">
                {t("section10.companyName")}
              </strong>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 mt-4">
              <a
                href="mailto:contacto@hazlosano.com"
                className="flex items-center gap-2 text-highlight hover:underline"
              >
                <svg
                  aria-hidden="true"
                  focusable="false"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-5 h-5 shrink-0"
                >
                  <path d="M3 4a2 2 0 00-2 2v8a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2H3zm14 2.207l-6.54 5.606a1.5 1.5 0 01-1.92 0L3 6.207V6h14v.207z" />
                </svg>
                <span className="truncate">contacto@hazlosano.com</span>
              </a>
              <a
                href="mailto:hazlo.sano.comunidad@gmail.com"
                className="flex items-center gap-2 text-highlight hover:underline"
              >
                <svg
                  aria-hidden="true"
                  focusable="false"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-5 h-5 shrink-0"
                >
                  <path d="M3 4a2 2 0 00-2 2v8a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2H3zm14 2.207l-6.54 5.606a1.5 1.5 0 01-1.92 0L3 6.207V6h14v.207z" />
                </svg>
                <span className="truncate">hazlo.sano.comunidad@gmail.com</span>
              </a>
            </div>
            <div className="flex items-center gap-2 text-text-support mt-4">
              <svg
                aria-hidden="true"
                focusable="false"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-5 h-5 shrink-0 text-text-muted"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                  clipRule="evenodd"
                />
              </svg>
              {t("section10.location")}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
