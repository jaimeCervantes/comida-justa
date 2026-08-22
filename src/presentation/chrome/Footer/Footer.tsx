import Image from "next/image";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Link } from "~/i18n/navigation";
import { PUBLIC_BRAND_NAME } from "~/infra/constants";
import { Heading } from "~/presentation/design_system/typography/Heading";
import { PILLAR_SHORT_KEYS } from "../Header/menuItems";

/**
 * El encabezado de una columna del pie.
 *
 * Estaba escrito tres veces con la misma cadena
 * (`font-semibold text-text-base uppercase tracking-wider text-xs`). Vive aquí
 * dentro y no en el design system porque es el estilo de **este** pie, no un primitivo del sitio:
 * promoverlo sin un segundo uso real sería inventar una abstracción.
 */
function ColumnHeading({ children }: { children: ReactNode }) {
  return (
    <Heading level={4} size="eyebrow" tone="inherit">
      {children}
    </Heading>
  );
}

export default function Footer() {
  const t = useTranslations("footer");
  const tPillars = useTranslations("pillars");
  const tCommon = useTranslations("common");
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-surface-elevation-1 border-t border-separator pt-16 pb-8 mt-16">
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
          <p className="text-label text-text-support max-w-sm leading-relaxed">
            {t("tagline")}
          </p>
          <div className="space-y-3">
            <ColumnHeading>{t("pillarsHeading")}</ColumnHeading>
            <ul className="space-y-2 text-label text-text-support font-medium">
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
          <ColumnHeading>{t("exploreHeading")}</ColumnHeading>
          <ul className="space-y-3 text-label text-text-support">
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
          <ColumnHeading>{t("connectHeading")}</ColumnHeading>
          <ul className="space-y-3 text-label text-text-support">
            <li>
              <a
                href="https://t.me/HazloSanoBot"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-highlight transition-colors flex items-center gap-2"
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
                className="hover:text-highlight transition-colors flex items-center gap-2"
              >
                {t("tiktok")}
              </a>
            </li>
            <li>
              <a
                href="https://fb.com/hazlo.sano.comunidad"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-highlight transition-colors flex items-center gap-2"
              >
                {t("facebook")}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="container-width border-t border-separator pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-caption text-text-support">
        <p>{t("rights", { year: currentYear, brand: PUBLIC_BRAND_NAME })}</p>
        <p>{t("motto")}</p>
      </div>
    </footer>
  );
}
