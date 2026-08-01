import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "~/i18n/navigation";
import { PUBLIC_BRAND_NAME } from "~/infra/constants";
import { PILLAR_SHORT_KEYS } from "../Header/menuItems";

export default function Footer() {
  const t = useTranslations("footer");
  const tPillars = useTranslations("pillars");
  const tCommon = useTranslations("common");
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white dark:bg-[#0a0a0a] border-t border-gray-100 dark:border-gray-800/60 pt-16 pb-8 mt-16">
      <div className="container-width grid grid-cols-1 md:grid-cols-4 gap-12 lg:gap-8 mb-12">
        {/* Brand & Pillars */}
        <div className="md:col-span-2 space-y-6">
          <Link
            href="/"
            className="inline-flex items-center gap-3 text-2xl font-bold"
          >
            <Image
              src="/logo.webp"
              alt={tCommon("logoAlt", { brand: PUBLIC_BRAND_NAME })}
              width={40}
              height={40}
            />
            {/*
              El logotipo va en verde sólido, no en degradado: recortar el degradado contra el
              texto deja las primeras letras casi ilegibles sobre fondo claro.
            */}
            <span className="text-pw-green">{PUBLIC_BRAND_NAME}</span>
          </Link>
          <p className="text-gray-600 dark:text-gray-400 text-sm max-w-sm leading-relaxed">
            {t("tagline")}
          </p>
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider text-xs">
              {t("pillarsHeading")}
            </h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400 font-medium">
              {PILLAR_SHORT_KEYS.map((key) => (
                <li key={key} className="flex items-center gap-2">
                  <span className="text-(--highlight)">✓</span> {tPillars(key)}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Explore & Links */}
        <div className="space-y-6">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider text-xs">
            {t("exploreHeading")}
          </h4>
          <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
            <li>
              <Link
                href="/publicar"
                className="hover:text-(--highlight) transition-colors inline-block font-medium"
              >
                {t("publishLink")}
              </Link>
            </li>
            <li>
              <Link
                href="/nosotros"
                className="hover:text-(--highlight) transition-colors inline-block font-medium"
              >
                {t("aboutLink", { brand: PUBLIC_BRAND_NAME })}
              </Link>
            </li>
            <li>
              <a
                href="https://hazlosano.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-(--highlight) transition-colors inline-block"
              >
                {t("communityLink")}
              </a>
            </li>
            <li>
              <a
                href="https://restaurante.hazlosano.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-(--highlight) transition-colors inline-block"
              >
                {t("restaurantLink")}
              </a>
            </li>
          </ul>
        </div>

        {/* Contact & Socials */}
        <div className="space-y-6">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider text-xs">
            {t("connectHeading")}
          </h4>
          <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
            <li>
              <a
                href="https://t.me/HazloSanoBot"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-500 transition-colors flex items-center gap-2"
              >
                {t("telegram")}
              </a>
            </li>
            <li>
              <a
                href="https://wa.me/522781126948"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-green-500 transition-colors flex items-center gap-2"
              >
                {t("whatsapp")}
              </a>
            </li>
            <li>
              <a
                href="https://www.tiktok.com/@hazlosano"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-2"
              >
                {t("tiktok")}
              </a>
            </li>
            <li>
              <a
                href="https://fb.com/hazlo.sano.comunidad"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-600 transition-colors flex items-center gap-2"
              >
                {t("facebook")}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="container-width border-t border-gray-100 dark:border-gray-800/60 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500 dark:text-gray-500">
        <p>{t("rights", { year: currentYear, brand: PUBLIC_BRAND_NAME })}</p>
        <p>{t("motto")}</p>
      </div>
    </footer>
  );
}
