import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { resolveLocale } from "~/i18n/routing";
import { PUBLIC_BRAND_NAME } from "~/infra/constants";
import { PILLAR_SHORT_KEYS } from "~/infra/UI/components/Header/menuItems";
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
  "bg-white dark:bg-[#1a1a1a] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xs";
const SOCIAL_LINK =
  "bg-white dark:bg-[#1a1a1a] px-3 py-1.5 rounded-full shadow-xs hover:shadow-md border border-orange-100 dark:border-orange-900/50 transition-all flex items-center gap-1.5";

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
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-balance">
          {t("metaTitle", { brand })}
        </h1>
        <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 text-balance max-w-2xl mx-auto">
          {t("metaSubtitle")}
        </p>
      </header>

      {/* 1. Ecosistema Hazlo Sano / Chatbot */}
      <section className="bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 rounded-3xl p-8 sm:p-10 shadow-xs relative overflow-hidden">
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
                <h2 className="text-3xl sm:text-4xl font-bold text-blue-900 dark:text-blue-100">
                  {t("ecosystemHeading", { brand })}
                </h2>
              </div>
              <p className="text-blue-800 dark:text-blue-200 text-lg leading-relaxed">
                {t.rich("ecosystemIntro", { b: bold, brand })}
              </p>
              <p className="text-blue-800 dark:text-blue-200 text-lg leading-relaxed font-medium">
                {t("ecosystemPillars")}
              </p>
              <ul className="space-y-2 text-blue-900 dark:text-blue-100 font-medium text-lg">
                {PILLAR_SHORT_KEYS.map((key) => (
                  <li key={key} className="flex items-center gap-3">
                    <span className="text-xl">✅</span> {tPillars(key)}
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-6 border-t border-blue-200 dark:border-blue-800/50">
              <h3 className="text-2xl font-bold text-blue-900 dark:text-blue-100 flex items-center gap-3 mb-3">
                {t("assistantHeading")}
              </h3>
              <p className="text-blue-800 dark:text-blue-200 text-lg leading-relaxed">
                {t.rich("assistantBody", { b: bold })}
              </p>
            </div>
          </div>

          <div className="shrink-0 mt-2 sm:mt-0 sm:self-end">
            <a
              href="https://t.me/HazloSanoBot"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-full shadow-md transition-all hover:scale-105 active:scale-95"
            >
              {t("assistantCta")}
            </a>
          </div>
        </div>
      </section>

      {/* 2. Crema de Cacahuate */}
      <section className="space-y-8">
        <div className="space-y-4">
          <h2 className="text-3xl font-bold flex items-center gap-3">
            {t("peanutHeading")}
          </h2>
          <h3 className="text-xl font-medium text-gray-700 dark:text-gray-300">
            {t("peanutQuestion")}
          </h3>
          <p className="text-lg leading-relaxed text-gray-600 dark:text-gray-400">
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

          <div className="bg-amber-50 dark:bg-amber-900/10 p-6 rounded-2xl border border-amber-100 dark:border-amber-900/50">
            <h4 className="text-lg font-bold mb-4 text-amber-900 dark:text-amber-400 flex items-center gap-2">
              {t("peanutPairHeading")}
            </h4>
            <ul className="grid grid-cols-2 gap-y-2 gap-x-4 text-amber-800 dark:text-amber-200/80 font-medium">
              <li className="flex items-center gap-2">{t("peanutPair1")}</li>
              <li className="flex items-center gap-2">{t("peanutPair2")}</li>
              <li className="flex items-center gap-2">{t("peanutPair3")}</li>
              <li className="flex items-center gap-2">{t("peanutPair4")}</li>
              <li className="flex items-center gap-2">{t("peanutPair5")}</li>
              <li className="flex items-center gap-2">{t("peanutPair6")}</li>
              <li className="flex items-center gap-2">{t("peanutPair7")}</li>
            </ul>
            <p className="mt-4 text-sm text-amber-900/80 dark:text-amber-300">
              {t.rich("peanutPairNote", { b: bold })}
            </p>
          </div>
        </div>

        <div className="bg-amber-100/50 dark:bg-amber-950/30 p-6 rounded-2xl">
          <h4 className="text-xl font-bold mb-4 text-amber-800 dark:text-amber-500 flex items-center gap-2">
            {t("peanutTipsHeading")}
          </h4>
          <ul className="space-y-3 text-amber-900 dark:text-amber-100/90 list-disc pl-5">
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
          <h2 className="text-3xl font-bold flex items-center gap-3">
            {t("breadHeading")}
          </h2>
          <h3 className="text-xl font-medium text-gray-700 dark:text-gray-300">
            {t("breadQuestion", { brand })}
          </h3>
          <p className="text-lg leading-relaxed text-gray-600 dark:text-gray-400">
            {t.rich("breadIntro", { b: bold })}
          </p>

          <div className="bg-orange-50/80 dark:bg-orange-950/30 p-5 rounded-2xl text-orange-900 dark:text-orange-200 border border-orange-200/60 dark:border-orange-900/40 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p>{t.rich("breadPartner", { b: bold, brand })}</p>
            <div className="flex shrink-0 items-center justify-start gap-4 font-medium text-sm">
              <a
                href="https://www.instagram.com/mmnaturalmente/"
                target="_blank"
                rel="noopener noreferrer"
                className={`${SOCIAL_LINK} hover:text-orange-600 dark:hover:text-orange-400`}
              >
                {t("breadInstagram")}
              </a>
              <a
                href="https://www.facebook.com/profile.php?id=61575188279449"
                target="_blank"
                rel="noopener noreferrer"
                className={`${SOCIAL_LINK} hover:text-blue-600 dark:hover:text-blue-400`}
              >
                {t("breadFacebook")}
              </a>
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="bg-orange-50 dark:bg-orange-950/30 p-6 rounded-2xl border border-orange-100 dark:border-orange-900/50">
              <h4 className="text-lg font-bold mb-4 text-orange-900 dark:text-orange-400 flex items-center gap-2">
                {t("breadLoafHeading")}
              </h4>
              <ul className="space-y-4 text-orange-900 dark:text-orange-100/80">
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
            <h4 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
              {t("breadVarietiesHeading")}
            </h4>
            <ul className="space-y-3 text-lg mb-6">
              <li className="flex justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
                <span>{t("breadNatural")}</span>
                <span className="font-semibold text-(--highlight)">$96</span>
              </li>
              <li className="flex justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
                <span className="leading-tight">{t("breadSeeds")}</span>
                <span className="font-semibold text-(--highlight)">$125</span>
              </li>
              <li className="flex justify-between pb-2">
                <span>{t("breadChocolate")}</span>
                <span className="font-semibold text-(--highlight)">$136</span>
              </li>
            </ul>
            <div className="mt-auto bg-gray-50 dark:bg-gray-900 p-4 rounded-xl text-center text-sm font-medium text-gray-600 dark:text-gray-400">
              {t("breadAvailability")}
            </div>
          </div>
        </div>

        <div className="bg-orange-100/60 dark:bg-orange-900/20 p-6 rounded-2xl">
          <h4 className="text-xl font-bold mb-4 text-orange-900 dark:text-orange-500 flex items-center gap-2">
            {t("breadTipsHeading")}
          </h4>
          <ul className="space-y-3 text-orange-900 dark:text-orange-100/90 list-disc pl-5">
            <TipItem label={t("breadTip1Label")} text={t("breadTip1Text")} />
            <TipItem label={t("breadTip2Label")} text={t("breadTip2Text")} />
            <TipItem label={t("breadTip3Label")} text={t("breadTip3Text")} />
          </ul>
        </div>
      </section>

      {/* Redes y Contacto */}
      <section className="bg-gray-100 dark:bg-[#141414] p-8 sm:p-12 rounded-3xl text-center space-y-6">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t("orderHeading")}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          {t("orderBody")}
        </p>

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
            className="bg-black dark:bg-zinc-800 hover:bg-gray-800 dark:hover:bg-zinc-700 text-white px-6 py-3 rounded-full font-medium transition-all flex items-center gap-2"
          >
            {t("orderTiktok")}
          </a>
          <a
            href="https://fb.com/hazlo.sano.comunidad"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-medium transition-all flex items-center gap-2"
          >
            {t("orderFacebook")}
          </a>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-800 pt-6 flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm font-medium">
          <span className="block w-full sm:w-auto text-gray-500">
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
        <strong className="block text-gray-900 dark:text-white">{label}</strong>
        <span className="text-gray-600 dark:text-gray-400 text-base">
          {text}
        </span>
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
      <strong className="text-orange-950 dark:text-orange-300">{label}</strong>
      <span className="text-sm">{text}</span>
    </li>
  );
}
