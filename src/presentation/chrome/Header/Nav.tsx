"use client";
import { CaretDownIcon } from "@radix-ui/react-icons";
import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import { useTranslations } from "next-intl";
import type { CategoryOption } from "~/domain/entities/post/taxonomy";
import { type AppHref, Link, usePathname } from "~/i18n/navigation";
import { PUBLIC_BRAND_NAME } from "~/infra/constants";
import ListItem from "./ListItem";
import {
  activeMenuSection,
  COMMUNITY_OVERVIEW_HREF,
  PILLAR_ITEMS,
  PILLARS_OVERVIEW_HREF,
  VISIBLE_COMMUNITY_ITEMS,
} from "./menuItems";

/*
 * Slice 12. Toda esta barra pintaba con `gray-*` de Tailwind y una variante `dark:` escrita a mano
 * al lado de cada una. Dos problemas: el gris de Tailwind es azulado y sobre el papel cálido del
 * slice 10 se ve frío justo en lo primero que mira cualquiera, y una pareja
 * `claro`/`dark:` que hay que acordarse de mantener se desincroniza sola. Los tokens semánticos ya
 * cambian de valor con el tema, así que **no hay una sola `dark:` aquí**.
 *
 * Slice 2 del chrome v2. Los radios, que el slice 12 había subido a la escala con nombre, pasan a
 * píldora: la barra pintaba tres enlaces de texto y nada decía en qué sección estabas.
 *
 * El par de la píldora activa —`brand-green-soft` de fondo, `brand-green-900` de tinta— es el mismo
 * que usa la variante `brand` de `Badge`, y lo mide `brandPalette.contrast.test.ts`: 7.55 en claro.
 * Los dos tokens cambian de valor con el tema, así que sigue sin haber una sola `dark:` aquí.
 */
/* `whitespace-nowrap` no es decoración: el propio docstring de abajo cuenta que «4 Pilares» ya se
   partió en dos renglones una vez, y los cuatro puntos le quitan ancho a la etiqueta. */
const PILL_BASE =
  "flex select-none items-center whitespace-nowrap text-[15px] leading-none outline-hidden transition-colors";

const PILL_IDLE =
  "font-medium text-text-base hover:bg-surface-elevation-2 hover:text-highlight";

const PILL_ACTIVE = "font-semibold bg-brand-green-soft text-brand-green-900";

/** La sección con desplegable son dos controles —etiqueta y flecha— que forman una sola píldora. */
const SECTION_LINK_CLASS = `${PILL_BASE} rounded-l-full py-2 pl-3.5`;

const SECTION_TRIGGER_CLASS = `${PILL_BASE} group rounded-r-full py-2 pr-3 pl-1`;

const LINK_CLASS = `${PILL_BASE} rounded-full px-3.5 py-2`;

/* `text-current` y no `text-highlight`: dentro de la píldora activa la flecha tiene que ser del
   verde oscuro de la tinta, o se lee como un elemento suelto encima del chip. */
const CARET_CLASS =
  "relative top-px text-current transition-transform duration-[250] ease-in group-data-[state=open]:-rotate-180";

/**
 * Los cuatro pilares, en el orden de sus números (1 Sueño → 4 Mente y Espíritu), como firma de la
 * sección.
 *
 * **Son decorativos y por eso van `aria-hidden`.** La regla que dejó medida
 * `pillarPalette.contrast.test.ts` —Movimiento y Mente contrastan 1.14 entre sí, así que el color
 * nunca puede ser el único portador del significado de un pilar— se cumple porque aquí ningún punto
 * identifica a un pilar concreto: quien nombra es la etiqueta «4 Pilares». Un lector de pantalla no
 * pierde nada al no oírlos, y quien no distingue los tonos tampoco.
 */
const PILLAR_DOTS = [
  "bg-pillar-sleep-solid",
  "bg-pillar-nutrition-solid",
  "bg-pillar-movement-solid",
  "bg-pillar-mind-spirit-solid",
] as const;

function PillarDots() {
  return (
    <span
      aria-hidden
      data-testid="nav-pillar-dots"
      className="ml-2 inline-flex gap-[3px]"
    >
      {PILLAR_DOTS.map((dot) => (
        <span key={dot} className={`size-1.5 rounded-full ${dot}`} />
      ))}
    </span>
  );
}

/** Enlace de una categoría dentro del desplegable: solo la etiqueta, sin descripción. */
const CATEGORY_LINK_CLASS =
  "text-text-base hover:bg-surface-elevation-2 hover:text-highlight block select-none rounded-chip px-3 py-2 text-[15px] leading-none no-underline outline-hidden transition-colors";

function SectionControl({
  href,
  label,
  openLabel,
  active,
  children,
}: {
  href: AppHref;
  label: string;
  openLabel: string;
  /** Si la ruta actual pertenece a esta sección. Lo decide `activeMenuSection`. */
  active: boolean;
  /** Lo que va dentro de la etiqueta, después del texto: hoy solo los puntos de los pilares. */
  children?: React.ReactNode;
}) {
  const tone = active ? PILL_ACTIVE : PILL_IDLE;

  return (
    /* El fondo lo lleva el contenedor y no cada mitad: son dos controles que tienen que leerse
       como una sola píldora, y el `hover` de cualquiera de los dos tiñe el conjunto porque en CSS
       el hover de un hijo también es hover del padre. */
    <div
      className={`relative flex items-center justify-center rounded-full transition-colors ${active ? PILL_ACTIVE : "hover:bg-surface-elevation-2"
        }`}
    >
      <NavigationMenu.Link asChild>
        <Link
          href={href}
          aria-current={active ? "page" : undefined}
          className={`${SECTION_LINK_CLASS} ${tone}`}
        >
          <span data-testid="section-label">{label}</span>
          {children}
        </Link>
      </NavigationMenu.Link>
      <NavigationMenu.Trigger
        className={`${SECTION_TRIGGER_CLASS} ${tone}`}
        aria-label={openLabel}
      >
        <CaretDownIcon className={CARET_CLASS} aria-hidden />
        <span
          aria-hidden
          className="pointer-events-none absolute top-full left-1/2 z-1 h-2 w-4 -translate-x-1/2 opacity-0 transition-opacity group-data-[state=open]:opacity-100"
        >
          <span
            data-testid="submenu-indicator"
            className="absolute inset-0 bg-surface-elevation-1 [clip-path:polygon(50%_0,100%_100%,0_100%)]"
          />
        </span>
      </NavigationMenu.Trigger>
    </div>
  );
}

/**
 * La barra principal.
 *
 * Empezó con cinco elementos —«4 Pilares», «Comunidad», «Nosotros», «Productos» y «Reporte»— y no
 * cabían: «4 Pilares» se partía en dos renglones. Quedan tres.
 *
 * «Comunidad» es ahora la puerta a todo lo que publica la gente, en el orden en que se busca: las
 * publicaciones y los productos primero, las categorías después y al final las secciones. Tener
 * «Productos» como desplegable aparte separaba dos cosas que son lo mismo —lo que la comunidad
 * comparte— en dos menús que había que aprenderse por separado.
 *
 * «Reporte», que solo ven los administradores, vive en el menú del avatar.
 */
export default function Nav({
  categories,
}: {
  categories: readonly CategoryOption[];
}) {
  const t = useTranslations("nav");
  const tPillars = useTranslations("pillars");
  /* La plantilla interna (`/categoria/[key]`), no la URL visible: la regla vale en los dos
     idiomas sin escribirla dos veces. */
  const active = activeMenuSection(usePathname());

  return (
    <NavigationMenu.Root
      className="relative z-20 flex justify-center"
      data-testid="desktop-menu"
    >
      <NavigationMenu.List className="center m-0 flex list-none rounded-full bg-surface-elevation-1/60 px-2 py-1 shadow-xs backdrop-blur-xs gap-1">
        <NavigationMenu.Item>
          <SectionControl
            href={COMMUNITY_OVERVIEW_HREF}
            label={t("communityMenu")}
            openLabel={t("openSectionMenu", {
              section: t("communityMenu"),
            })}
            active={active === "community"}
          />
          <NavigationMenu.Content className="absolute top-0 left-0 w-auto">
            <div className="p-[22px] w-[300px] md:w-[600px]">
              {/* Lo que se vende va primero: es a lo que viene la mayoría. */}
              <ul className="m-0 grid list-none gap-x-[10px] grid-cols-1 md:grid-cols-2">
                <ListItem href="/" title={t("publications")}>
                  {t("publicationsDescription")}
                </ListItem>
                <ListItem href="/productos" title={t("brandProducts")}>
                  {t("brandProductsDescription", { brand: PUBLIC_BRAND_NAME })}
                </ListItem>
                <ListItem href="/eventos" title={t("events")}>
                  {t("eventsDescription")}
                </ListItem>
              </ul>

              {categories.length > 0 ? (
                <>
                  <hr className="my-3 border-separator" />
                  <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
                    {t("byCategory")}
                  </p>
                  <ul className="m-0 grid list-none gap-x-[10px] grid-cols-2 md:grid-cols-3">
                    {categories.map((category) => (
                      <li key={category.value}>
                        <NavigationMenu.Link asChild>
                          <Link
                            href={{
                              pathname: "/categoria/[key]",
                              params: { key: category.value },
                            }}
                            className={CATEGORY_LINK_CLASS}
                          >
                            {category.label}
                          </Link>
                        </NavigationMenu.Link>
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}

              {/* Sin secciones publicadas no hay encabezado que pintar: un rótulo "Secciones"
                  seguido de nada es peor que no tenerlo. */}
              {VISIBLE_COMMUNITY_ITEMS.length > 0 ? (
                <>
                  <hr className="my-3 border-separator" />
                  <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
                    {t("communitySections")}
                  </p>
                  <ul className="m-0 grid list-none gap-x-[10px] grid-cols-1 md:grid-cols-2">
                    {VISIBLE_COMMUNITY_ITEMS.map((item) => (
                      <ListItem
                        key={item.titleKey}
                        href={item.href}
                        title={t(item.titleKey)}
                      >
                        {t(item.descriptionKey, { brand: PUBLIC_BRAND_NAME })}
                      </ListItem>
                    ))}
                  </ul>
                </>
              ) : null}
            </div>
          </NavigationMenu.Content>
        </NavigationMenu.Item>

        <NavigationMenu.Item>
          <SectionControl
            href={PILLARS_OVERVIEW_HREF}
            label={t("pillarsMenu")}
            openLabel={t("openSectionMenu", { section: t("pillarsMenu") })}
            active={active === "pillars"}
          >
            <PillarDots />
          </SectionControl>
          <NavigationMenu.Content className="absolute top-0 left-0 w-auto">
            <ul className="m-0 grid list-none gap-x-[10px] p-[22px] w-[300px] md:w-[600px] lg:w-[700px] grid-cols-[1fr_1fr]">
              {PILLAR_ITEMS.map((item) => (
                <ListItem
                  key={item.titleKey}
                  href={item.href}
                  title={tPillars(item.titleKey)}
                >
                  {tPillars(item.descriptionKey)}
                </ListItem>
              ))}
            </ul>
          </NavigationMenu.Content>
        </NavigationMenu.Item>

        <NavigationMenu.Item>
          <NavigationMenu.Link asChild>
            <Link
              href="/nosotros"
              aria-current={active === "about" ? "page" : undefined}
              className={`${LINK_CLASS} ${active === "about" ? PILL_ACTIVE : PILL_IDLE
                }`}
            >
              {t("about")}
            </Link>
          </NavigationMenu.Link>
        </NavigationMenu.Item>
      </NavigationMenu.List>
      <div className="absolute top-full left-0 pt-1">
        <NavigationMenu.Viewport
          data-testid="desktop-submenu"
          /* La sombra era un `hsla(206, 22%, 7%, …)` incrustado: azul, de la plantilla de Radix, y
             el único sitio del sitio que no pasaba por la escala de elevación. `shadow-lg` es la
             misma altura con el verde del papel. */
          className="data-[state=open]:animate-scaleIn data-[state=closed]:animate-scaleOut relative h-(--radix-navigation-menu-viewport-height) w-(--radix-navigation-menu-viewport-width) origin-[top_center] overflow-hidden rounded-panel bg-surface-elevation-1 shadow-lg transition-[width,height] duration-300 border border-separator"
        />
      </div>
    </NavigationMenu.Root>
  );
}
