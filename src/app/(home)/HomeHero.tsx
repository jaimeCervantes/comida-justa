import { useTranslations } from "next-intl";
import { Link } from "~/i18n/navigation";
import { buttonVariants } from "~/presentation/design_system/buttons/buttonVariants";
import { Heading } from "~/presentation/design_system/typography/Heading";

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
}: {
  /** Las publicaciones que el feed de abajo va a listar. Sale del `total` que ya trae la página. */
  publicationCount: number;
}): React.ReactNode {
  const t = useTranslations("home");

  return (
    <header className="border-b border-separator pb-8">
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
    </header>
  );
}
