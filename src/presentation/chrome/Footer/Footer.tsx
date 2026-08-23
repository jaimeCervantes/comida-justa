import Image from "next/image";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { publicationPillarNumber } from "~/domain/entities/post/publicationPillars";
import { Link } from "~/i18n/navigation";
import { PUBLIC_BRAND_NAME } from "~/infra/constants";
import { BadgeCounter } from "~/presentation/design_system/badges/Badge";
import { Heading } from "~/presentation/design_system/typography/Heading";
import { PILLAR_ITEMS, VISIBLE_COMMUNITY_ITEMS } from "../Header/menuItems";
import LanguageSwitcher from "../LanguageSwitcher/LanguageSwitcher";

/**
 * El encabezado de una columna del pie.
 *
 * Vive aquí dentro y no en el design system porque es el estilo de **este** pie, no un primitivo
 * del sitio: promoverlo sin un segundo uso real sería inventar una abstracción.
 */
function ColumnHeading({ children }: { children: ReactNode }) {
  return (
    <Heading level={4} size="eyebrow" tone="inherit">
      {children}
    </Heading>
  );
}

const LINK_CLASS =
  "text-on-inverted-support transition-colors hover:text-link-on-inverted";

/**
 * Un enlace externo del pie. Los cuatro se escribían con la misma tríada de atributos.
 */
function ExternalLink({ href, children }: { href: string; children: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={LINK_CLASS}
    >
      {children}
    </a>
  );
}

/**
 * El pie del sitio.
 *
 * **Es oscuro a propósito**, y es lo que pide el 5.16: cierra la página y libera el papel claro
 * para el contenido. No sigue al tema —sería un pie que deja de cerrar nada en claro—, así que sus
 * colores salen de `--surface-inverted` y sus tres tintas, que se declaran una vez fuera de los
 * bloques de tema y se miden en `invertedSurface.contrast.test.ts`.
 *
 * **Los pilares dejaron de ser una lista de palomitas.** Eran cuatro `✓` con el nombre al lado, sin
 * enlace: decoración en el sitio donde alguien busca a dónde ir. Ahora llevan a su pilar y traen
 * **su número**, como en el resto de la aplicación —y el número sale de `publicationPillarNumber`,
 * no del orden de la lista—.
 *
 * **El idioma se muda aquí desde el header.** Es la otra instrucción del 5.16: la barra de arriba
 * ya cargaba con búsqueda, publicar y cuenta, y cambiar de idioma es algo que se hace una vez y no
 * en cada visita. El conmutador de **tema** que dibuja el canvas todavía no existe en la
 * aplicación —haría falta el interruptor, dónde recordarlo y un script que evite el parpadeo al
 * cargar—, así que es su propio slice y no un añadido de éste.
 */
export default function Footer() {
  const t = useTranslations("footer");
  /* Los pilares se nombran desde `pillars` y las secciones de comunidad desde `nav`: son los
     mismos catálogos que usa el menú de arriba, así que el pie no puede llamarles de otra forma. */
  const tPillars = useTranslations("pillars");
  const tNav = useTranslations("nav");
  const tCommon = useTranslations("common");
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-16 bg-surface-inverted pt-16 pb-8 text-on-inverted">
      <div className="container-width mb-12 grid grid-cols-1 gap-12 md:grid-cols-4 lg:gap-8">
        <div className="space-y-6 md:col-span-1">
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
            {/* Sobre el fondo oscuro, el verde de marca no se lee: aquí va el que sí, medido. */}
            <span className="text-link-on-inverted">{PUBLIC_BRAND_NAME}</span>
          </Link>

          <p className="max-w-sm text-label leading-relaxed text-on-inverted-support">
            {t("tagline")}
          </p>

          <ul className="flex flex-wrap gap-x-4 gap-y-2 text-label">
            <li>
              <ExternalLink href="https://wa.me/522781126948">
                {t("whatsapp")}
              </ExternalLink>
            </li>
            <li>
              <ExternalLink href="https://t.me/HazloSanoBot">
                {t("telegram")}
              </ExternalLink>
            </li>
            <li>
              <ExternalLink href="https://www.tiktok.com/@hazlosano">
                {t("tiktok")}
              </ExternalLink>
            </li>
            <li>
              <ExternalLink href="https://fb.com/hazlo.sano.comunidad">
                {t("facebook")}
              </ExternalLink>
            </li>
          </ul>
        </div>

        {/* Los pilares, con su número y llevando a alguna parte. */}
        <nav className="space-y-6" aria-label={t("pillarsHeading")}>
          <ColumnHeading>{t("pillarsHeading")}</ColumnHeading>
          <ul className="space-y-3 text-label">
            {PILLAR_ITEMS.map((item) => (
              <li key={item.pillar}>
                <Link
                  href={item.href}
                  data-testid={`footer-pillar-${item.pillar}`}
                  className={`inline-flex items-center gap-2 ${LINK_CLASS}`}
                >
                  <BadgeCounter tone={item.pillar}>
                    {publicationPillarNumber(item.pillar)}
                  </BadgeCounter>
                  {tPillars(item.titleKey)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Comunidad: solo lo publicado. `VISIBLE_COMMUNITY_ITEMS` ya filtra los stubs que
            responden 404 a propósito, así que el pie no puede enlazarlos por descuido. */}
        <nav className="space-y-6" aria-label={t("communityHeading")}>
          <ColumnHeading>{t("communityHeading")}</ColumnHeading>
          <ul className="space-y-3 text-label">
            {VISIBLE_COMMUNITY_ITEMS.map((item) => (
              <li key={item.titleKey}>
                <Link href={item.href} className={LINK_CLASS}>
                  {tNav(item.titleKey)}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/productos" className={LINK_CLASS}>
                {t("productsLink")}
              </Link>
            </li>
            <li>
              <Link href="/eventos" className={LINK_CLASS}>
                {t("eventsLink")}
              </Link>
            </li>
          </ul>
        </nav>

        <nav className="space-y-6" aria-label={t("exploreHeading")}>
          <ColumnHeading>{t("exploreHeading")}</ColumnHeading>
          <ul className="space-y-3 text-label">
            <li>
              <Link href="/nosotros" className={LINK_CLASS}>
                {t("aboutLink", { brand: PUBLIC_BRAND_NAME })}
              </Link>
            </li>
            <li>
              <Link href="/publicar" className={LINK_CLASS}>
                {t("publishLink")}
              </Link>
            </li>
            <li>
              <ExternalLink href="https://hazlosano.com">
                {t("communityLink")}
              </ExternalLink>
            </li>
            <li>
              <ExternalLink href="https://restaurante.hazlosano.com">
                {t("restaurantLink")}
              </ExternalLink>
            </li>
          </ul>
        </nav>
      </div>

      <div className="container-width flex flex-col items-center justify-between gap-4 border-t border-separator-on-inverted pt-8 text-caption text-on-inverted-support md:flex-row">
        <p>{t("rights", { year: currentYear, brand: PUBLIC_BRAND_NAME })}</p>
        <p>{t("motto")}</p>
        {/* Bajado del header: cambiar de idioma se hace una vez, no en cada visita. */}
        <LanguageSwitcher />
      </div>
    </footer>
  );
}
