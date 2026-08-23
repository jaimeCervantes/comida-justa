import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { MdCheck } from "react-icons/md";
import { publicationPillarNumber } from "~/domain/entities/post/publicationPillars";
import { Link } from "~/i18n/navigation";
import { resolveLocale } from "~/i18n/routing";
import { PUBLIC_BRAND_NAME } from "~/infra/constants";
import { PILLAR_ITEMS } from "~/presentation/chrome/Header/menuItems";
import { Badge } from "~/presentation/design_system/badges/Badge";
import { buttonVariants } from "~/presentation/design_system/buttons/buttonVariants";
import { Heading } from "~/presentation/design_system/typography/Heading";
import { buildAboutMetadata } from "./metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return buildAboutMetadata(resolveLocale(locale));
}

const CARD =
  "bg-surface-elevation-1 p-6 rounded-card border border-separator shadow-xs";
const SOCIAL_LINK =
  "bg-surface-elevation-1 px-3 py-1.5 rounded-full shadow-xs hover:shadow-md border border-separator transition-all flex items-center gap-1.5";

/**
 * El ancho lo pone el layout (`container-width`). Repetirlo aquí y sumarle `max-w-4xl` encajonaba
 * el contenido a 896px dentro de un contenedor de 1280px.
 */
export default async function NosotrosPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(resolveLocale(locale));

  const t = await getTranslations("about");
  const tPillars = await getTranslations("pillars");
  const brand = PUBLIC_BRAND_NAME;
  const bold = (chunks: React.ReactNode) => <strong>{chunks}</strong>;
  const italic = (chunks: React.ReactNode) => <em>{chunks}</em>;

  return (
    /* `article` y no `main`: el layout ya pone el `<main>` de la página, y anidar dos deja el
       documento con dos regiones principales — HTML inválido, y un lector de pantalla que ofrece
       «saltar al contenido» dos veces. Lo destapó el escenario que lee el texto de la página. */
    <article className="py-12 space-y-16">
      <header className="text-center space-y-6">
        <Heading level={1} size="display">
          {t("metaTitle", { brand })}
        </Heading>
        <p className="text-lg sm:text-xl text-text-support text-balance max-w-2xl mx-auto">
          {t("metaSubtitle")}
        </p>

        {/* **Las dos únicas puertas hacia dentro del sitio.**
            Esta página tenía ocho enlaces y los ocho salían fuera —WhatsApp, TikTok, Facebook,
            Instagram, Telegram y dos dominios—: contaba quiénes somos y despedía a quien se
            interesaba. Cero `<Link>` internos, así que quien terminaba de leer no tenía a dónde ir
            dentro. El bloque de contacto del final se queda como está: ese es para pedir por
            WhatsApp o pasar por la sucursal, que es otra intención. */}
        <div
          data-testid="about-ways-in"
          className="flex flex-wrap justify-center gap-3 pt-2"
        >
          <Link
            href="/productos"
            className={buttonVariants({ color: "green", size: "md" })}
          >
            {t("browseCta")}
          </Link>
          <Link
            href="/publicar"
            className={buttonVariants({ color: "default", size: "md" })}
          >
            {t("publishCta")}
          </Link>
        </div>
      </header>

      {/* 1. Ecosistema Hazlo Sano / Chatbot */}
      <section className="bg-pillar-mind-spirit-soft border border-pillar-mind-spirit-ink/20 rounded-panel p-8 sm:p-10 shadow-xs relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start sm:justify-between gap-8">
          <div className="space-y-6 flex-1">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-4 sm:gap-6 text-center sm:text-left">
                <Image
                  src="/logo.webp"
                  alt={`Logo ${brand}`}
                  width={100}
                  height={100}
                  className="hover:scale-105 transition-transform shrink-0"
                  /* Sin `fetchPriority`: es el logo junto a un titular, no lo que se mide como
                     contenido más grande de la página. */
                  preload
                />
                <Heading
                  level={2}
                  size="lg"
                  tone="inherit"
                  className="text-pillar-mind-spirit-ink"
                >
                  {t("ecosystemHeading", { brand })}
                </Heading>
              </div>
              <p className="text-pillar-mind-spirit-ink text-lg leading-relaxed">
                {t.rich("ecosystemIntro", { b: bold, brand })}
              </p>
              <p className="text-pillar-mind-spirit-ink text-lg leading-relaxed font-medium">
                {t("ecosystemPillars")}
              </p>
              {/*
                **Insignias con su número, no palomitas.** Es la primera anotación del 5.11: la ✅
                era el único indicador de lista en toda la página, y una palomita dice «hecho»
                donde aquí solo se está enumerando. El número es además lo que distingue Movimiento
                de Mente para quien no separa sus verdes — la misma razón por la que existe en la
                tarjeta del listado y en el pie.
              */}
              <ul className="flex flex-wrap gap-2">
                {PILLAR_ITEMS.map((item) => (
                  <li key={item.pillar}>
                    <Badge
                      tone={item.pillar}
                      counter={publicationPillarNumber(item.pillar)}
                      data-testid={`about-pillar-${item.pillar}`}
                    >
                      {tPillars(`${item.pillar}.short`)}
                    </Badge>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-6 border-t border-pillar-mind-spirit-ink/20">
              <Heading
                level={3}
                size="md"
                tone="inherit"
                className="text-pillar-mind-spirit-ink flex items-center gap-3 mb-3"
              >
                {t("assistantHeading")}
              </Heading>
              <p className="text-pillar-mind-spirit-ink text-lg leading-relaxed">
                {t.rich("assistantBody", { b: bold })}
              </p>
            </div>
          </div>

          <div className="shrink-0 mt-2 sm:mt-0 sm:self-end">
            <a
              href="https://t.me/HazloSanoBot"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center bg-button-primary-bg hover:bg-button-primary-hover text-button-primary-text font-medium py-3 px-8 rounded-full shadow-md transition-all hover:scale-105 active:scale-95"
            >
              {t("assistantCta")}
            </a>
          </div>
        </div>
      </section>

      {/* 2. Crema de Cacahuate */}
      <section className="space-y-8">
        <div className="space-y-4">
          <Heading level={2} className="flex items-center gap-3">
            {t("peanutHeading")}
          </Heading>
          <Heading level={3} className="font-medium">
            {t("peanutQuestion")}
          </Heading>
          <p className="text-lg leading-relaxed text-text-support">
            {t("peanutIntro")}
            <br />
            {t.rich("peanutIntro2", { b: bold, i: italic, brand })}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          <ul className={`space-y-4 ${CARD}`}>
            <FeatureItem
              label={t("peanutNaturalLabel")}
              text={t("peanutNaturalText")}
            />
            <FeatureItem
              label={t("peanutEnergyLabel")}
              text={t("peanutEnergyText")}
            />
            <FeatureItem
              label={t("peanutNoExtrasLabel")}
              text={t("peanutNoExtrasText")}
            />
          </ul>

          {/*
            **Un acento por bloque**, que es la segunda anotación del 5.11.

            Esta caja es un apunte al margen —con qué acompañar la crema—, no la identidad del
            producto: llevaba la miel y se la quedaba el pan, que es de quien es esa corteza. Aquí
            basta el escalón de superficie; lo que identifica al cacahuate son su foto y sus tres
            cualidades.
          */}
          <div className="bg-surface-elevation-2 p-6 rounded-card border border-separator">
            <Heading
              level={4}
              tone="inherit"
              className="mb-4 text-text-base flex items-center gap-2"
            >
              {t("peanutPairHeading")}
            </Heading>
            <ul className="grid grid-cols-2 gap-y-2 gap-x-4 text-text-support font-medium">
              <li className="flex items-center gap-2">{t("peanutPair1")}</li>
              <li className="flex items-center gap-2">{t("peanutPair2")}</li>
              <li className="flex items-center gap-2">{t("peanutPair3")}</li>
              <li className="flex items-center gap-2">{t("peanutPair4")}</li>
              <li className="flex items-center gap-2">{t("peanutPair5")}</li>
              <li className="flex items-center gap-2">{t("peanutPair6")}</li>
              <li className="flex items-center gap-2">{t("peanutPair7")}</li>
            </ul>
            <p className="mt-4 text-sm text-text-support">
              {t.rich("peanutPairNote", { b: bold })}
            </p>
          </div>
        </div>

        <div className="bg-surface-elevation-2 p-6 rounded-card">
          <Heading
            level={4}
            size="sm"
            tone="inherit"
            className="mb-4 text-text-support flex items-center gap-2"
          >
            {t("peanutTipsHeading")}
          </Heading>
          <ul className="space-y-3 text-text-support list-disc pl-5">
            <TipItem label={t("peanutTip1Label")} text={t("peanutTip1Text")} />
            <TipItem label={t("peanutTip2Label")} text={t("peanutTip2Text")} />
            <TipItem label={t("peanutTip3Label")} text={t("peanutTip3Text")} />
            <TipItem label={t("peanutTip4Label")} text={t("peanutTip4Text")} />
          </ul>
        </div>
      </section>

      {/* 3. Pan de Masa Madre */}
      {/*
        **El pan lleva la miel, y es su único acento.**

        Iba en barro (`--brand-clay-700`, `#c52e0b`), que se lee como rojo y es la semilla del
        naranja del logo — por eso el pilar de Alimentación resuelve al mismo tono y tampoco servía
        de recambio. La miel (`#7a5a03` sobre `#fdf3d6`) es la corteza y el trigo, que es lo que
        este bloque enseña.

        Para que sea de **un solo bloque**, el del cacahuate se apaga a superficie neutra: es la
        segunda anotación del 5.11 —«un acento por bloque»— y antes ni siquiera se cumplía dentro
        del propio cacahuate, que tenía la caja de «va bien con» en miel y la de «cómo guardarla» en
        barro. Lo que identifica a la crema son su foto y sus tres cualidades, no un fondo de color.
      */}
      <section className="space-y-8" id="pan-de-masa-madre-mmnaturalmente">
        <div className="space-y-4">
          <Heading level={2} className="flex items-center gap-3">
            {t("breadHeading")}
          </Heading>
          <Heading level={3} className="font-medium">
            {t("breadQuestion", { brand })}
          </Heading>
          <p className="text-lg leading-relaxed text-text-support">
            {t.rich("breadIntro", { b: bold })}
          </p>

          <div className="bg-brand-honey-soft p-5 rounded-card text-brand-honey-ink border border-brand-honey-ink/20 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p>{t.rich("breadPartner", { b: bold, brand })}</p>
            <div className="flex shrink-0 items-center justify-start gap-4 font-medium text-sm">
              <a
                href="https://www.instagram.com/mmnaturalmente/"
                target="_blank"
                rel="noopener noreferrer"
                className={`${SOCIAL_LINK} hover:text-brand-honey-ink`}
              >
                {t("breadInstagram")}
              </a>
              <a
                href="https://www.facebook.com/profile.php?id=61575188279449"
                target="_blank"
                rel="noopener noreferrer"
                className={`${SOCIAL_LINK} hover:text-pillar-mind-spirit-ink`}
              >
                {t("breadFacebook")}
              </a>
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="bg-brand-honey-soft p-6 rounded-card border border-brand-honey-ink/20">
              <Heading
                level={4}
                tone="inherit"
                className="mb-4 text-brand-honey-ink flex items-center gap-2"
              >
                {t("breadLoafHeading")}
              </Heading>
              <ul className="space-y-4 text-brand-honey-ink">
                <LoafItem
                  label={t("breadDigestionLabel")}
                  text={t("breadDigestionText")}
                />
                <LoafItem
                  label={t("breadNutrientsLabel")}
                  text={t("breadNutrientsText")}
                />
                <LoafItem
                  label={t("breadGlucoseLabel")}
                  text={t("breadGlucoseText")}
                />
              </ul>
            </div>
          </div>

          <div className={`${CARD} flex flex-col justify-center`}>
            <Heading level={4} className="mb-4">
              {t("breadVarietiesHeading")}
            </Heading>
            <ul className="space-y-3 text-lg mb-6">
              <li className="flex justify-between border-b border-separator pb-2">
                <span>{t("breadNatural")}</span>
                <span className="font-semibold text-(--highlight)">$96</span>
              </li>
              <li className="flex justify-between border-b border-separator pb-2">
                <span className="leading-tight">{t("breadSeeds")}</span>
                <span className="font-semibold text-(--highlight)">$125</span>
              </li>
              <li className="flex justify-between pb-2">
                <span>{t("breadChocolate")}</span>
                <span className="font-semibold text-(--highlight)">$136</span>
              </li>
            </ul>
            <div className="mt-auto bg-surface-elevation-2 p-4 rounded-control text-center text-sm font-medium text-text-support">
              {t("breadAvailability")}
            </div>
          </div>
        </div>

        <div className="bg-brand-honey-soft p-6 rounded-card">
          <Heading
            level={4}
            size="sm"
            tone="inherit"
            className="mb-4 text-brand-honey-ink flex items-center gap-2"
          >
            {t("breadTipsHeading")}
          </Heading>
          <ul className="space-y-3 text-brand-honey-ink list-disc pl-5">
            <TipItem label={t("breadTip1Label")} text={t("breadTip1Text")} />
            <TipItem label={t("breadTip2Label")} text={t("breadTip2Text")} />
            <TipItem label={t("breadTip3Label")} text={t("breadTip3Text")} />
          </ul>
        </div>
      </section>

      {/* Redes y Contacto */}
      <section className="bg-surface-elevation-2 p-8 sm:p-12 rounded-panel text-center space-y-6">
        <Heading level={3} size="md">
          {t("orderHeading")}
        </Heading>
        <p className="text-text-support text-lg">{t("orderBody")}</p>

        <div className="flex flex-wrap justify-center gap-4 py-4">
          <a
            href="https://wa.me/522781126948"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-full font-medium transition-all shadow-md hover:shadow-lg flex items-center gap-2"
          >
            {t("orderWhatsapp")}
          </a>
          <a
            href="https://www.tiktok.com/@hazlosano"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-brand-black hover:bg-button-secondary-bg text-pw-white px-6 py-3 rounded-full font-medium transition-all flex items-center gap-2"
          >
            {t("orderTiktok")}
          </a>
          <a
            href="https://fb.com/hazlo.sano.comunidad"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-button-primary-bg hover:bg-button-primary-hover text-button-primary-text px-6 py-3 rounded-full font-medium transition-all flex items-center gap-2"
          >
            {t("orderFacebook")}
          </a>
        </div>

        <div className="border-t border-separator pt-6 flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm font-medium">
          <span className="block w-full sm:w-auto text-text-support">
            {t("orderPhone")}
          </span>
          <a
            href="https://hazlosano.com"
            className="text-(--highlight) hover:underline"
          >
            hazlosano.com
          </a>
          <a
            href="https://restaurante.hazlosano.com"
            className="text-(--highlight) hover:underline"
          >
            restaurante.hazlosano.com
          </a>
        </div>
      </section>
    </article>
  );
}

/** Una virtud del producto: icono, título y una línea que lo explica. */
/**
 * Una cualidad del producto, con la viñeta de la casa.
 *
 * Llevaba un emoji distinto por renglón —✅, 💪, 🌿— pasado como prop. El 5.11 los saca: tres
 * dibujos distintos para tres cosas del mismo rango hacen leer la lista como si fueran categorías
 * diferentes, y además cada plataforma los pinta a su manera. Una sola viñeta, en la tinta de la
 * marca, dice «esto es una lista» sin decir nada más.
 */
function FeatureItem({ label, text }: { label: string; text: string }) {
  return (
    <li className="flex items-start gap-3 text-lg">
      <MdCheck
        aria-hidden="true"
        className="mt-1 size-5 shrink-0 text-highlight"
      />
      <div>
        <strong className="block text-text-base">{label}</strong>
        <span className="text-text-support text-base">{text}</span>
      </div>
    </li>
  );
}

/** Un consejo de conservación. */
function TipItem({ label, text }: { label: string; text: string }) {
  return (
    <li>
      <strong>{label}</strong> {text}
    </li>
  );
}

/** Una propiedad de la hogaza: título y explicación, uno sobre otro. */
function LoafItem({ label, text }: { label: string; text: string }) {
  return (
    <li className="flex flex-col">
      <strong className="text-brand-honey-ink">{label}</strong>
      <span className="text-sm">{text}</span>
    </li>
  );
}
