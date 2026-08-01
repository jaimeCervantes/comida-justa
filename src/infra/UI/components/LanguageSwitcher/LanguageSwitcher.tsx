"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { usePathname, useRouter } from "~/i18n/navigation";
import { type AppLocale, routing } from "~/i18n/routing";
import { Button } from "~/presentation/design_system/buttons/Button";

const localesMap: Record<AppLocale, { label: string; flag: string }> = {
  es: { label: "Español", flag: "🇲🇽" },
  en: { label: "English", flag: "🇺🇸" },
};

const locales = routing.locales.map((code) => ({ code, ...localesMap[code] }));

export default function LanguageSwitcher() {
  /* `usePathname` de `~/i18n/navigation` devuelve la ruta **sin** el prefijo de idioma, así que
     cambiar de idioma es volver a pedir la misma ruta con otro locale. Antes esto era cirugía de
     strings sobre la ruta cruda (`pathname.replace("/es", "/en")`), que se rompía con cualquier
     ruta que contuviera el código de idioma en otra posición. */
  const t = useTranslations("nav");
  const pathname = usePathname();
  const router = useRouter();
  const currentLocale = useLocale();
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => setIsOpen((prev) => !prev);

  const handleChange = (newLocale: AppLocale) => {
    setIsOpen(false);
    router.replace(pathname, { locale: newLocale });
  };

  const current = locales.find((l) => l.code === currentLocale) ?? locales[0];

  return (
    <div className="relative inline-block text-left">
      <Button
        color="black"
        size="xs"
        onClick={toggleDropdown}
        aria-label={t("changeLanguage")}
      >
        <span className="text-sm">{current.flag}</span>
        <span className="text-sm">{isOpen ? "▲" : "▼"}</span>
      </Button>

      {isOpen && (
        <div className="absolute right-0 z-10 mt-2 w-40 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
          <div className="py-1">
            {locales.map((locale) => (
              <button
                key={locale.code}
                type="button"
                onClick={() => handleChange(locale.code)}
                className={`${
                  locale.code === currentLocale
                    ? "bg-gray-100 text-gray-900 font-semibold"
                    : "text-gray-700"
                } flex w-full items-center px-4 py-2 text-sm hover:bg-gray-100`}
              >
                <span className="mr-2 text-lg">{locale.flag}</span>
                {locale.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
