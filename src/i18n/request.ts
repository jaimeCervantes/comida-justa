import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  // Typically corresponds to the `[locale]` segment
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: {
      common: (await import(`./locales/${locale}/common.json`)).default,
      home: (await import(`./locales/${locale}/home.json`)).default,
      privacyPolicy: (await import(`./locales/${locale}/privacyPolicy.json`))
        .default,
      termsOfService: (await import(`./locales/${locale}/termsOfService.json`))
        .default,
    },
  };
});
