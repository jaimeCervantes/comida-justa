import { useTranslations } from "next-intl";
import { Heading } from "~/presentation/design_system/typography/Heading";
import { PillarSectionHeading } from "./PillarArticle";
import { pillarColorClasses } from "./pilaresData";

/**
 * La triada del plato: mitad vegetales, un cuarto proteína, un cuarto carbohidrato y una porción de
 * grasa.
 *
 * **La proporción se dibuja, no solo se dice.** El ancho de cada bloque es su porcentaje, así que
 * la regla se entiende antes de leerla —que es justo lo que la vuelve utilizable a las siete de la
 * tarde y con hambre—. En móvil los vegetales ocupan la fila entera y los otros dos media cada uno:
 * la mitad y los dos cuartos siguen siendo visibles sin obligar a hacer scroll horizontal.
 *
 * La grasa va aparte y no como cuarto bloque: no es una fracción del plato, es una porción que se
 * suma. Meterla en la barra habría dibujado una regla falsa.
 */
type PlateSlice = {
  share: string;
  title: string;
  body: string;
  /** Cuánto ocupa en la barra. La mitad manda fila propia en móvil; los cuartos la comparten. */
  width: string;
};

export default function NutritionPlateTriad(): React.ReactNode {
  const t = useTranslations("pillarPages.nutrition");
  const color = pillarColorClasses.nutrition;

  const slices: readonly PlateSlice[] = [
    {
      share: t("triadVegetablesShare"),
      title: t("triadVegetablesTitle"),
      body: t("triadVegetablesBody"),
      width: "basis-full sm:basis-1/2",
    },
    {
      share: t("triadProteinShare"),
      title: t("triadProteinTitle"),
      body: t("triadProteinBody"),
      width: "basis-1/2 sm:basis-1/4",
    },
    {
      share: t("triadCarbsShare"),
      title: t("triadCarbsTitle"),
      body: t("triadCarbsBody"),
      width: "basis-1/2 sm:basis-1/4",
    },
  ];

  return (
    <section>
      <PillarSectionHeading>{t("triadHeading")}</PillarSectionHeading>
      <p className="mb-6">{t("triadIntro")}</p>

      <ul className="flex flex-wrap gap-2">
        {slices.map((slice) => (
          <li
            key={slice.title}
            className={`grow ${slice.width} rounded-card border p-5 ${color.bg} ${color.border}`}
          >
            <span className={`block text-3xl font-black ${color.text}`}>
              {slice.share}
            </span>
            <Heading level={3} size="xs" className="mt-2">
              {slice.title}
            </Heading>
            <p className="mt-2 text-base leading-relaxed">{slice.body}</p>
          </li>
        ))}
      </ul>

      <div
        className={`mt-2 rounded-card border border-dashed p-5 ${color.border}`}
      >
        <span className={`block text-2xl font-black ${color.text}`}>
          {t("triadFatShare")}
        </span>
        <Heading level={3} size="xs" className="mt-2">
          {t("triadFatTitle")}
        </Heading>
        <p className="mt-2 text-base leading-relaxed">{t("triadFatBody")}</p>
      </div>
    </section>
  );
}
