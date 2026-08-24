import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import type { HabitChallengeExperienceKey } from "~/domain/habits/habitChallengeExperiences";
import { buttonVariants } from "~/presentation/design_system/buttons/buttonVariants";
import { Surface } from "~/presentation/design_system/surfaces/Surface";
import { Heading } from "~/presentation/design_system/typography/Heading";
import { Text } from "~/presentation/design_system/typography/Text";
import PillarHero from "~/presentation/habits/PillarHero";
import {
  PILLAR_LOCAL_ANCHOR,
  PILLAR_PRACTICE_ANCHOR,
} from "~/presentation/habits/pillarPageAnchors";
import { getPillarTheme } from "~/presentation/habits/pillarThemes";
import {
  PILLAR_KEY_BY_CHALLENGE,
  PILLARS,
  type PillarKey,
  pillarColorClasses,
} from "./pilaresData";

/**
 * El armazón que comparten las cuatro páginas de pilar: su hero, y el cuerpo con su ritmo
 * tipográfico. Solo cambia el color, y no entra como cadena de clases: entra la clave del pilar y el
 * color se resuelve aquí.
 *
 * Antes cada página se traía sus propias clases (`text-violet-500`, `bg-emerald-50/50 dark:…`) y
 * eso fue justo lo que se pudrió: un find/replace dejó `da dark:` como clase suelta,
 * `bg-violet-50/da` y `text-violet-100xt-lg`, y nadie lo notó porque el color estaba escrito
 * cuatro veces en cuatro archivos. Con la clave, un pilar solo puede pintarse de su color.
 *
 * El hero también se arma aquí y no en cada página: las cuatro lo montaban con las mismas seis
 * propiedades y las mismas clases, y era cuestión de tiempo que una se quedara sin la sombra o con
 * otro radio. Entra el reto —no el color ni el tema— y de él salen la paleta y la identidad.
 */
export default function PillarArticle({
  challenge,
  heading,
  subtitle,
  identity,
  children,
}: {
  challenge: HabitChallengeExperienceKey;
  heading: string;
  subtitle: string;
  /** La frase en primera persona del reto: quién es alguien que practica este pilar. */
  identity: string;
  children: ReactNode;
}) {
  const t = useTranslations("pillarPages");
  const number = pillarNumberOf(challenge);

  return (
    <article>
      <PillarHero
        level={1}
        number={number}
        eyebrow={t("heroEyebrow", { number })}
        title={heading}
        intro={subtitle}
        identity={identity}
        theme={getPillarTheme(challenge)}
        className="mb-10 rounded-panel shadow-xl"
        /*
          **La primera pantalla ofrece algo que hacer.** Es la anotación número uno del 5.6: «el
          pilar deja de ser una página de texto». La práctica y lo que hay cerca ya estaban en la
          página, pero detrás del artículo entero; ahora se llega a las dos desde arriba.

          «Empezar la práctica» y no «Adoptar un hábito», que es lo que dibuja el canvas: este
          producto se niega en su propia redacción a afirmar que alguien formó un hábito
          —`noHabitClaim` lo dice después de cinco repeticiones—, así que prometerlo en un botón
          sería contradecirse en la primera pantalla. Además «práctica» es la palabra que usa el
          resto del sitio.
        */
        action={
          <>
            <a
              href={`#${PILLAR_PRACTICE_ANCHOR}`}
              className={buttonVariants({ color: "white", size: "lg" })}
            >
              {t("heroPracticeCta")}
            </a>
            {/* Blanco y subrayado, sin la tinta del pilar: encima del héroe de color, `text-white`
                y `text-pillar-*-ink` en el mismo `class` dejan el color a merced del orden del CSS
                —el mismo enredo que se llevó por delante el precio de la tarjeta del feed—. */}
            <a
              href={`#${PILLAR_LOCAL_ANCHOR}`}
              className="focus-ring rounded-control font-semibold text-white underline underline-offset-4 hover:opacity-80"
            >
              {t("heroLocalCta")}
            </a>
          </>
        }
      />

      <div className="space-y-8 text-lg leading-relaxed">{children}</div>
    </article>
  );
}

/**
 * El número de un pilar, a partir de su reto.
 *
 * Se **deriva** de `PILLAR_KEY_BY_CHALLENGE` y de `PILLARS` en vez de escribir aquí un cuarto
 * emparejamiento a mano: ya hubo que arreglar el de `mind`/`mindSpirit` una vez, y una lista más es
 * una lista más que se desincroniza el día que entre un quinto pilar.
 */
function pillarNumberOf(challenge: HabitChallengeExperienceKey): number {
  const key = PILLAR_KEY_BY_CHALLENGE[challenge];
  const pillar = PILLARS.find((candidate) => candidate.key === key);

  if (!pillar) {
    // i18n-ignore: lo lee quien programa, no quien visita el sitio.
    throw new Error(`El pilar "${key}" no está en PILLARS.`);
  }

  return pillar.number;
}

/** El encabezado de sección que las cuatro páginas repiten. */
export function PillarSectionHeading({ children }: { children: ReactNode }) {
  return (
    <Heading level={2} className="mb-4">
      {children}
    </Heading>
  );
}

/** Una fila de «etiqueta en negrita + texto» de las cajas destacadas. */
export function LabeledItem({ label, text }: { label: string; text: string }) {
  return (
    <li className="flex flex-col sm:flex-row gap-2 sm:gap-4">
      <Text
        as="span"
        variant="lead"
        weight="bold"
        className="shrink-0 sm:w-28 text-xl"
      >
        {label}
      </Text>
      <Text as="span" variant="lead">
        {text}
      </Text>
    </li>
  );
}

/** La caja destacada con el par «cambio / impacto» de cada pilar. */
export function PillarPanel({
  pillar,
  children,
}: {
  pillar: PillarKey;
  children: ReactNode;
}) {
  const color = pillarColorClasses[pillar];

  return (
    <Surface
      radius="card"
      elevation="xs"
      className={`p-6 sm:p-8 my-8 border ${color.bg} ${color.border}`}
    >
      <ul className="space-y-6">{children}</ul>
    </Surface>
  );
}

/** La caja con barra lateral de color que cierra cada pilar. */
export function PillarCallout({
  pillar,
  children,
}: {
  pillar: PillarKey;
  children: ReactNode;
}) {
  const color = pillarColorClasses[pillar];

  return (
    <Surface
      radius="none"
      className={`border-l-4 p-6 rounded-r-xl my-8 ${color.bg} ${color.border}`}
    >
      <Text variant="lead" tone="inherit" className={`m-0 ${color.text}`}>
        {children}
      </Text>
    </Surface>
  );
}
