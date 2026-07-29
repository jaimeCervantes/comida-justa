import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { routing } from "~/i18n/routing";
import { CANONICAL_URL } from "~/infra/constants";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: "termsOfService" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `${CANONICAL_URL}/${locale}/condiciones-de-servicio`,
    },
  };
}

export default async function TermsOfServicePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: "termsOfService" });

  const lastUpdateDate = new Date("2026-02-28").toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <main className="">
      <header className="mb-8 md:mb-12 border-b border-zinc-200 dark:border-zinc-800 pb-6 md:pb-8">
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight mb-3 sm:mb-4">
          {t("h1")}
        </h1>
        <p className="text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 font-medium mb-1 sm:mb-2">
          {t("subtitle")}
        </p>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-500 font-mono">
          {t("lastUpdate", { date: lastUpdateDate })}
        </p>
      </header>

      <div className="prose prose-sm sm:prose-base md:prose-lg prose-zinc dark:prose-invert max-w-none text-zinc-700 dark:text-zinc-300 space-y-8 sm:space-y-10">
        <p className="text-base sm:text-lg leading-relaxed font-medium">
          {t("intro")}
        </p>

        <section>
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-3 mb-4 sm:mb-5">
            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full w-7 sm:w-8 h-7 sm:h-8 flex items-center justify-center text-sm font-semibold shrink-0">
              1
            </span>
            {t("section1.title")}
          </h2>
          <p className="mb-3">{t("section1.intro")}</p>
          <ul className="list-disc pl-6 space-y-2 mb-4">
            <li>{t("section1.items.0")}</li>
            <li>{t("section1.items.1")}</li>
            <li>{t("section1.items.2")}</li>
            <li>{t("section1.items.3")}</li>
          </ul>
          <p className="text-zinc-800 dark:text-zinc-200 font-medium">
            {t("section1.outro")}
          </p>
        </section>

        <section>
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-3 mb-4 sm:mb-5">
            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full w-7 sm:w-8 h-7 sm:h-8 flex items-center justify-center text-sm font-semibold shrink-0">
              2
            </span>
            {t("section2.title")}
          </h2>
          <ul className="list-disc pl-6 space-y-2 mb-4">
            <li>{t("section2.items.0")}</li>
            <li>{t("section2.items.1")}</li>
            <li>{t("section2.items.2")}</li>
          </ul>
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r-lg">
            <p className="text-red-800 dark:text-red-300 text-sm font-medium m-0">
              {t("section2.warning")}
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-3 mb-4 sm:mb-5">
            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full w-7 sm:w-8 h-7 sm:h-8 flex items-center justify-center text-sm font-semibold shrink-0">
              3
            </span>
            {t("section3.title")}
          </h2>
          <p className="mb-3">{t("section3.intro")}</p>
          <ul className="list-disc pl-6 space-y-2 mb-4">
            <li>{t("section3.items.0")}</li>
            <li>{t("section3.items.1")}</li>
            <li>{t("section3.items.2")}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-3 mb-4 sm:mb-5">
            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full w-7 sm:w-8 h-7 sm:h-8 flex items-center justify-center text-sm font-semibold shrink-0">
              4
            </span>
            {t("section4.title")}
          </h2>
          <p className="mb-3">{t("section4.intro")}</p>
          <ul className="list-disc pl-6 space-y-2 mb-4">
            <li>{t("section4.items.0")}</li>
            <li>{t("section4.items.1")}</li>
            <li>{t("section4.items.2")}</li>
          </ul>
          <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-4 rounded-r-lg">
            <p className="text-amber-800 dark:text-amber-300 text-sm font-medium m-0">
              {t("section4.outro")}
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-3 mb-4 sm:mb-5">
            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full w-7 sm:w-8 h-7 sm:h-8 flex items-center justify-center text-sm font-semibold shrink-0">
              5
            </span>
            {t("section5.title")}
          </h2>
          <p className="mb-3">{t("section5.p1")}</p>
          <p>{t("section5.p2")}</p>
        </section>

        <section>
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-3 mb-4 sm:mb-5">
            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full w-7 sm:w-8 h-7 sm:h-8 flex items-center justify-center text-sm font-semibold shrink-0">
              6
            </span>
            {t("section6.title")}
          </h2>
          <p className="mb-3">{t("section6.p1")}</p>
          <p>{t("section6.p2")}</p>
        </section>

        <section>
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-3 mb-4 sm:mb-5">
            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full w-7 sm:w-8 h-7 sm:h-8 flex items-center justify-center text-sm font-semibold shrink-0">
              7
            </span>
            {t("section7.title")}
          </h2>
          <p>{t("section7.p1")}</p>
        </section>

        <section>
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-3 mb-4 sm:mb-5">
            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full w-7 sm:w-8 h-7 sm:h-8 flex items-center justify-center text-sm font-semibold shrink-0">
              8
            </span>
            {t("section8.title")}
          </h2>
          <p className="mb-3">{t("section8.p1")}</p>
          <Link
            href={`/${locale}/politica-de-privacidad`}
            className="text-blue-600 dark:text-blue-400 font-medium hover:underline inline-flex items-center gap-1"
          >
            {t("section8.linkText")}
            <svg
              aria-hidden="true"
              focusable="false"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4 h-4"
            >
              <path
                fillRule="evenodd"
                d="M5.22 14.78a.75.75 0 001.06 0l7.22-7.22v5.69a.75.75 0 001.5 0v-7.5a.75.75 0 00-.75-.75h-7.5a.75.75 0 000 1.5h5.69l-7.22 7.22a.75.75 0 000 1.06z"
                clipRule="evenodd"
              />
            </svg>
          </Link>
        </section>

        <section>
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-3 mb-4 sm:mb-5">
            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full w-7 sm:w-8 h-7 sm:h-8 flex items-center justify-center text-sm font-semibold shrink-0">
              9
            </span>
            {t("section9.title")}
          </h2>
          <p>{t("section9.p1")}</p>
        </section>

        <section>
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-3 mb-4 sm:mb-5">
            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full w-7 sm:w-8 h-7 sm:h-8 flex items-center justify-center text-sm font-semibold shrink-0">
              10
            </span>
            {t("section10.title")}
          </h2>
          <p className="mb-3">{t("section10.p1")}</p>
          <p>{t("section10.p2")}</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 mb-4">
            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full w-8 h-8 flex items-center justify-center text-sm">
              11
            </span>
            {t("section11.title")}
          </h2>
          <p className="mb-4">{t("section11.intro")}</p>
          <div className="bg-zinc-100 dark:bg-zinc-800/30 rounded-xl p-8 border border-zinc-100 dark:border-zinc-800">
            <div>
              <strong className="block text-zinc-900 dark:text-zinc-100">
                {t("section11.companyName")}
              </strong>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 mt-4">
              <a
                href="mailto:contacto@hazlosano.com"
                className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
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
                className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
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
            <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 mt-4">
              <svg
                aria-hidden="true"
                focusable="false"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-5 h-5 shrink-0 text-zinc-400"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                  clipRule="evenodd"
                />
              </svg>
              {t("section11.location")}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
