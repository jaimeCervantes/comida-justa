import { getTranslations } from "next-intl/server";
import { type AppHref, Link } from "~/i18n/navigation";
import { PILLARS_OVERVIEW_HREF } from "~/i18n/routes";
import { Button } from "~/presentation/design_system/buttons/Button";
import { Heading } from "~/presentation/design_system/typography/Heading";

/**
 * Las tres salidas que se ofrecen después de las dos principales.
 *
 * Son destinos que **existen y tienen contenido hoy**: el directorio de productores, la agenda de
 * eventos y la portada de los cuatro pilares. No se enlaza aquí ninguna de las seis secciones de
 * comunidad que todavía responden 404 a propósito —mandar de un 404 a otro 404 es la única forma de
 * empeorar esta página—.
 */
const SUGGESTIONS: readonly {
  href: AppHref;
  labelKey: "suggestProducers" | "suggestEvents" | "suggestPillars";
  testId: string;
}[] = [
  {
    href: {
      pathname: "/productores-locales/[[...slug]]",
      params: { slug: [] },
    },
    labelKey: "suggestProducers",
    testId: "not-found-producers",
  },
  { href: "/eventos", labelKey: "suggestEvents", testId: "not-found-events" },
  {
    href: PILLARS_OVERVIEW_HREF,
    labelKey: "suggestPillars",
    testId: "not-found-pillars",
  },
];

/**
 * La página que se encuentra quien llega a una dirección que ya no existe.
 *
 * **Dice la causa más probable, y es la novedad.** Antes bromeaba —«se fue a hacer una serie extra
 * de burpees»— repartida en cuatro encabezados, `h1` a `h4`, usando el `h4` de párrafo. Nada de eso
 * contestaba la pregunta de quien llega: *¿me equivoqué yo?*
 *
 * En un sitio donde la gente publica, **las páginas mueren de verdad**: una publicación se vence,
 * su dueño la borra, un evento pasa. El 5.16 del canvas lo dice con todas las letras —«pasa, y no
 * es tu culpa»— y eso es información, no consuelo: quien cree haberse equivocado vuelve a intentar
 * la misma dirección.
 *
 * Debajo, dos salidas y no una. «Ver lo que hay hoy» para quien venía a mirar y «buscar otra cosa»
 * para quien venía a por algo concreto, que es quien llega aquí desde un enlace viejo.
 *
 * La ilustración anterior (`/404/404.webp`) se retira: enseñaba a alguien descansando, que
 * acompañaba a la broma y contradice al mensaje nuevo.
 */
export default async function NotFound() {
  const t = await getTranslations("notFound");

  return (
    <section className="mx-auto flex max-w-2xl flex-col items-start gap-4 py-12">
      <span className="text-caption font-semibold uppercase tracking-[0.14em] text-text-muted">
        {t("code")}
      </span>

      <Heading level={1}>{t("heading")}</Heading>

      <p className="text-body text-text-support">{t("cause")}</p>

      <div className="mt-2 flex flex-wrap items-center gap-3">
        <Link href="/">
          <Button color="green" data-testid="not-found-home">
            {t("goHome")}
          </Button>
        </Link>

        <Link href="/buscar">
          <Button data-testid="not-found-search">{t("goSearch")}</Button>
        </Link>
      </div>

      <nav
        aria-label={t("suggestionsLabel")}
        className="mt-6 flex flex-col gap-2"
      >
        <span className="text-caption font-semibold uppercase tracking-[0.14em] text-text-muted">
          {t("suggestionsLabel")}
        </span>

        <ul className="flex flex-wrap gap-x-4 gap-y-2">
          {SUGGESTIONS.map((suggestion) => (
            <li key={suggestion.testId}>
              <Link
                href={suggestion.href}
                data-testid={suggestion.testId}
                className="text-label text-highlight hover:underline"
              >
                {t(suggestion.labelKey)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </section>
  );
}
