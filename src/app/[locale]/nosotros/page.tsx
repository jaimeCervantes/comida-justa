import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { resolveLocale } from "~/i18n/routing";
import { PUBLIC_BRAND_NAME } from "~/infra/constants";
import { PILLAR_SHORT_KEYS } from "~/presentation/chrome/Header/menuItems";
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
  "bg-surface-elevation-1 px-3 py-1.5 rounded-full shadow-xs hover:shadow-md border border-brand-clay-700/20 transition-all flex items-center gap-1.5";

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
    <main className="py-12 space-y-16">
      <header className="text-center space-y-6">
        <Heading level={1} size="display">
          {t("metaTitle", { brand })}
        </Heading>
        <p className="text-lg sm:text-xl text-text-support text-balance max-w-2xl mx-auto">
          {t("metaSubtitle")}
        </p>
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
                  priority
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
              <ul className="space-y-2 text-pillar-mind-spirit-ink font-medium text-lg">
                {PILLAR_SHORT_KEYS.map((key) => (
                  <li key={key} className="flex items-center gap-3">
                    <span className="text-xl">✅</span> {tPillars(key)}
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
              icon="✅"
              label={t("peanutNaturalLabel")}
              text={t("peanutNaturalText")}
            />
            <FeatureItem
              icon="💪"
              label={t("peanutEnergyLabel")}
              text={t("peanutEnergyText")}
            />
            <FeatureItem
              icon="🌿"
              label={t("peanutNoExtrasLabel")}
              text={t("peanutNoExtrasText")}
            />
          </ul>

          <div className="bg-brand-honey-soft p-6 rounded-card border border-brand-honey-ink/20">
            <Heading
              level={4}
              tone="inherit"
              className="mb-4 text-brand-honey-ink flex items-center gap-2"
            >
              {t("peanutPairHeading")}
            </Heading>
            <ul className="grid grid-cols-2 gap-y-2 gap-x-4 text-brand-honey-ink font-medium">
              <li className="flex items-center gap-2">{t("peanutPair1")}</li>
              <li className="flex items-center gap-2">{t("peanutPair2")}</li>
              <li className="flex items-center gap-2">{t("peanutPair3")}</li>
              <li className="flex items-center gap-2">{t("peanutPair4")}</li>
              <li className="flex items-center gap-2">{t("peanutPair5")}</li>
              <li className="flex items-center gap-2">{t("peanutPair6")}</li>
              <li className="flex items-center gap-2">{t("peanutPair7")}</li>
            </ul>
            <p className="mt-4 text-sm text-brand-honey-ink">
              {t.rich("peanutPairNote", { b: bold })}
            </p>
          </div>
        </div>

        <div className="bg-brand-honey-soft p-6 rounded-card">
          <Heading
            level={4}
            size="sm"
            tone="inherit"
            className="mb-4 text-brand-honey-ink flex items-center gap-2"
          >
            {t("peanutTipsHeading")}
          </Heading>
          <ul className="space-y-3 text-brand-honey-ink list-disc pl-5">
            <TipItem label={t("peanutTip1Label")} text={t("peanutTip1Text")} />
            <TipItem label={t("peanutTip2Label")} text={t("peanutTip2Text")} />
            <TipItem label={t("peanutTip3Label")} text={t("peanutTip3Text")} />
            <TipItem label={t("peanutTip4Label")} text={t("peanutTip4Text")} />
          </ul>
        </div>
      </section>

      {/* 3. Pan de Masa Madre */}
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

          <div className="bg-brand-clay-soft p-5 rounded-card text-brand-clay-700 border border-brand-clay-700/20 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p>{t.rich("breadPartner", { b: bold, brand })}</p>
            <div className="flex shrink-0 items-center justify-start gap-4 font-medium text-sm">
              <a
                href="https://www.instagram.com/mmnaturalmente/"
                target="_blank"
                rel="noopener noreferrer"
                className={`${SOCIAL_LINK} hover:text-brand-clay-700`}
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
            <div className="bg-brand-clay-soft p-6 rounded-card border border-brand-clay-700/20">
              <Heading
                level={4}
                tone="inherit"
                className="mb-4 text-brand-clay-700 flex items-center gap-2"
              >
                {t("breadLoafHeading")}
              </Heading>
              <ul className="space-y-4 text-brand-clay-700">
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

        <div className="bg-brand-clay-soft p-6 rounded-card">
          <Heading
            level={4}
            size="sm"
            tone="inherit"
            className="mb-4 text-brand-clay-700 flex items-center gap-2"
          >
            {t("breadTipsHeading")}
          </Heading>
          <ul className="space-y-3 text-brand-clay-700 list-disc pl-5">
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
    </main>
  );
}

/** Una virtud del producto: icono, título y una línea que lo explica. */
function FeatureItem({
  icon,
  label,
  text,
}: {
  icon: string;
  label: string;
  text: string;
}) {
  return (
    <li className="flex items-start gap-3 text-lg">
      <span className="mt-1">{icon}</span>
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
      <strong className="text-brand-clay-700">{label}</strong>
      <span className="text-sm">{text}</span>
    </li>
  );
}
