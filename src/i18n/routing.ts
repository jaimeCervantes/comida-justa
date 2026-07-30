import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["es", "en"],
  // Used when no locale matches
  defaultLocale: "es",
  localePrefix: "as-needed", // 'as-needed' means that the locale prefix is only added when the locale is not the default one
});
