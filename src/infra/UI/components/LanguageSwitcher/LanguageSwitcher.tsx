"use client";

import { useParams, usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { routing } from "~/i18n/routing";
import { Button } from "~/presentation/design_system/buttons/Button";

const localesMap = {
  es: { code: "es", label: "Español", flag: "🇲🇽" },
  en: { code: "en", label: "English", flag: "🇺🇸" },
};

const locales = routing.locales.map((item) => {
  return localesMap[item] || { code: item, label: item, flag: "🏳️" };
});

export default function LanguageSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const currentLocale = params.locale as string;
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => setIsOpen((prev) => !prev);

  const handleChange = (newLocale: string) => {
    let newPath = pathname;
    if (!pathname.includes(`/${currentLocale}`)) {
      newPath = `/${newLocale}${pathname}`;
    } else if (currentLocale !== newLocale) {
      newPath = pathname.replace(`/${currentLocale}`, `/${newLocale}`);
    }
    setIsOpen(false);
    router.push(newPath);
  };

  const current = locales.find((l) => l.code === currentLocale) ?? locales[0];

  return (
    <div className="relative inline-block text-left">
      <Button
        color="black"
        size="xs"
        onClick={toggleDropdown}
        aria-label="Change language"
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
