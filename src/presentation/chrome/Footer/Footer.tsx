import Image from "next/image";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { publicationPillarNumber } from "~/domain/entities/post/publicationPillars";
import { Link } from "~/i18n/navigation";
import { PUBLIC_BRAND_NAME } from "~/infra/constants";
import type { ThemePreference } from "~/infra/theme/themeCookie";
import { BadgeCounter } from "~/presentation/design_system/badges/Badge";
import { Heading } from "~/presentation/design_system/typography/Heading";
import { PILLAR_ITEMS, VISIBLE_COMMUNITY_ITEMS } from "../Header/menuItems";
import ThemeToggle from "../ThemeToggle/ThemeToggle";

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

const LINK_CLASS = "text-text-support transition-colors hover:text-highlight";

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
 * **Sigue al tema**: claro con el tema claro, oscuro con el oscuro. El 5.16 lo dibuja siempre
 * oscuro —«cierra la página y libera el papel claro para el contenido»— y así se entregó primero,
 * con una superficie que no participaba del tema. Se revirtió por decisión del usuario: una banda
 * negra en mitad de una página clara no cierra, corta, y en el tema oscuro se fundía con el resto.
 *
 * Lo que sí hay que conservar del 5.16 es el **cierre**, y eso lo dan dos cosas que no dependen del
 * color: un escalón de superficie (`surface-elevation-1` sobre el fondo de la página) y un filo
 * arriba (`border-t border-border`, el borde fuerte y no el separador tenue). En los dos temas se
 * lee como «aquí se acaba el contenido», que era lo que el oscuro venía a conseguir.
 *
 * **Los pilares dejaron de ser una lista de palomitas.** Eran cuatro `✓` con el nombre al lado, sin
 * enlace: decoración en el sitio donde alguien busca a dónde ir. Ahora llevan a su pilar y traen
 * **su número**, como en el resto de la aplicación —y el número sale de `publicationPillarNumber`,
 * no del orden de la lista—.
 *
 * **El idioma no está aquí, y es a propósito.** El 5.16 lo baja del header —«ya cargaba con
 * búsqueda, publicar y cuenta»— y así se entregó un momento; se devolvió arriba por decisión del
 * usuario: en un sitio de dos idiomas, cambiar de idioma es de las primeras cosas que alguien
 * busca, y el final de la página es encontrarlo tarde. Está en un solo sitio, no en los dos.
 *
 * **El conmutador de tema vive aquí**, y no en el header: a diferencia del idioma, no es de las
 * primeras cosas que alguien busca —el sitio ya sigue al sistema operativo sin que nadie toque
 * nada—, así que el pie es sitio de sobra. La preferencia la lee `RootLayout` de la cookie y
 * llega ya resuelta: sin ella no hay parpadeo que corregir al cargar.
 */
export default function Footer({ theme }: { theme: ThemePreference | null }) {
  const t = useTranslations("footer");
  /* Los pilares se nombran desde `pillars` y las secciones de comunidad desde `nav`: son los
     mismos catálogos que usa el menú de arriba, así que el pie no puede llamarles de otra forma. */
  const tPillars = useTranslations("pillars");
  const tNav = useTranslations("nav");
  const tCommon = useTranslations("common");
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-border bg-surface-elevation-1 pt-16 pb-28 text-text-base lg:pb-8">
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
            {/* El logotipo va en verde sólido, no en degradado: recortar el degradado contra el
                texto deja las primeras letras casi ilegibles. `--highlight` ya resuelve al verde
                que aguanta como tinta en cada tema. */}
            <span className="text-highlight">{PUBLIC_BRAND_NAME}</span>
          </Link>

          <p className="max-w-sm text-label leading-relaxed text-text-support">
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

      <div className="container-width flex flex-col items-center justify-between gap-4 border-t border-separator pt-8 text-caption text-text-support md:flex-row">
        <p>{t("rights", { year: currentYear, brand: PUBLIC_BRAND_NAME })}</p>
        <p>{t("motto")}</p>
        <ThemeToggle initial={theme} />
      </div>
    </footer>
  );
}
