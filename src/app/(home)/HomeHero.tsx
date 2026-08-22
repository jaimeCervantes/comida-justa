import { useTranslations } from "next-intl";
import { Link } from "~/i18n/navigation";
import type { Post } from "~/infra/types/Posts";
import { buttonVariants } from "~/presentation/design_system/buttons/buttonVariants";
import { Heading } from "~/presentation/design_system/typography/Heading";
import MediaContent from "~/presentation/media/MediaContent/MediaContent";

/**
 * La portada del inicio: qué promete el sitio, con qué voz, y las dos cosas que se pueden hacer.
 *
 * Es la pantalla 5.2 del canvas de v2. La anterior era un degradado naranja a todo sangrado con la
 * ubicación dentro; la ubicación se fue al chrome en el slice 1 de
 * `docs/features/platform/007-2026-08-21-chrome-v2.md`, así que aquí queda lo que una portada tiene
 * que hacer: decir de qué va esto y ofrecer por dónde entrar.
 *
 * **El titular estrena la voz de la marca.** `Heading size="display"` es Newsreader a 56px y peso
 * 400 — el token existía desde el slice 10 y su docstring decía «la portada», pero no lo consumía
 * nadie: la serif se descargaba en cada visita y no se pintaba en un solo píxel.
 *
 * **La cifra del rótulo es la de verdad.** El canvas ilustra «Xalapa · 34 productores activos»; en
 * la base hay dos tiendas, así que un contador de productores delataría en vez de dar confianza. Lo
 * que sí se sabe es cuántas publicaciones tiene delante quien mira, y viene ya contado por la misma
 * consulta que llena el feed: no cuesta una lectura más.
 */
export default function HomeHero({
  publicationCount,
  latest,
}: {
  /** Las publicaciones que el feed de abajo va a listar. Sale del `total` que ya trae la página. */
  publicationCount: number;
  /**
   * La más reciente, para la portada.
   *
   * El canvas pone ahí una «foto de portada, mercado local, 4:3» que no existe como archivo. En vez
   * de inventar un marcador de posición, la portada enseña **lo último que publicó la comunidad**:
   * es una foto real, cambia sola, y demuestra la promesa del titular en lugar de ilustrarla. Se
   * repite justo debajo, en el feed — y esa repetición es el punto: lo primero que se ve es lo
   * último que alguien subió.
   */
  latest?: Post;
}): React.ReactNode {
  const t = useTranslations("home");
  const cover = latest?.media?.[0];
  /* `to` llega **absoluto** desde el mapper (`createAbsoluteUrl`), que es lo que hace falta para
     compartir. Como destino de un enlace interno haría recargar la página entera —y en local se
     iría a producción—, así que se usa el slug, igual que `CardForList` para su enlace de edición. */
  const coverHref = latest?.slug ? `/${String(latest.slug)}` : latest?.to;

  return (
    <header className="grid items-center gap-8 border-b border-separator pb-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
      <div>
        <p className="text-label font-medium uppercase tracking-[0.14em] text-highlight">
          {t("heroEyebrow", { count: publicationCount })}
        </p>

        {/* El énfasis viaja **dentro del mensaje**, no partiendo la cadena en el componente: así cada
          idioma decide qué palabra destaca, que en inglés no cae en el mismo sitio. Se marca con
          color y no con cursiva: `next/font` trae Newsreader solo en redonda, y una cursiva
          sintética sobre una serif editorial se ve como un error de carga. */}
        <Heading level={1} size="display" className="mt-4 max-w-3xl">
          {t.rich("heroTitle", {
            em: (chunks) => (
              <em className="text-highlight not-italic">{chunks}</em>
            ),
          })}
        </Heading>

        <p className="mt-5 max-w-2xl text-body-lg leading-relaxed text-text-support text-pretty">
          {t("heroIntro")}
        </p>

        {/* Los emojis van fuera del texto traducible: no hay que repetirlos en cada idioma y quien
          usa lector de pantalla no los oye deletrear. */}
        <p className="mt-4 flex max-w-2xl items-start gap-2 text-label font-medium italic text-text-support">
          <span aria-hidden className="not-italic">
            ❤️💚
          </span>
          {t("heroIdentity")}
        </p>

        {/* Enlaces, no botones: un CTA de portada tiene que poder abrirse en otra pestaña, copiarse y
          seguirse por un rastreador. Visten las clases del primitivo para no reinventar el relleno
          ni el radio. */}
        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href="/productos"
            className={buttonVariants({ color: "green", size: "md" })}
          >
            {t("browseCta")}
          </Link>
          <Link
            href="/publicar"
            className={buttonVariants({ color: "white", size: "md" })}
          >
            {t("publishCta")}
          </Link>
        </div>
      </div>

      {/* `priority`: es la imagen que se ve sin desplazarse, y la única de la página que lo lleva.
          `sizes` describe el hueco real —una columna de la rejilla, no el ancho de la ventana— para
          que el navegador no se traiga la variante de 3840px y la encoja. */}
      {cover ? (
        <Link
          href={coverHref ?? "/"}
          data-testid="home-cover"
          className="focus-ring group block overflow-hidden rounded-panel border border-separator"
        >
          {/* Un alto fijo y `object-cover`, que es como este repo recorta media: lo dice el propio
              docstring de `MediaContent` —«quien lo pinta lo acompaña de un alto fijo que recorta
              con object-cover»—. Posicionar por dentro no sirve: `MediaContent` envuelve en un
              `div` y `ImageWithSkeleton` en un `span` más, así que el alto tiene que viajar hasta
              la imagen, no quedarse en un contenedor de fuera. */}
          <MediaContent
            media={cover}
            priority
            sizes="(max-width: 1024px) 100vw, 480px"
            /* `transition-[opacity,transform]` y no `transition-transform`: `ImageWithSkeleton`
              pone `transition-opacity` para apagar su esqueleto, y `cn` desempata entre las dos
              —son la misma familia—, así que un `transition-transform` a secas se lo borraba y la
              imagen aparecía de golpe. */
            className="h-64 w-full object-cover transition-[opacity,transform] duration-base ease-natural group-hover:scale-[1.02] sm:h-80 lg:h-72"
          />
          <div className="flex flex-col gap-1 bg-surface-elevation-1 px-5 py-4">
            <span className="text-caption font-semibold uppercase tracking-[0.14em] text-text-muted">
              {t("coverLabel")}
            </span>
            <span className="text-body-lg font-semibold leading-tight text-text-base transition-colors group-hover:text-highlight">
              {latest?.title}
            </span>
          </div>
        </Link>
      ) : null}
    </header>
  );
}
