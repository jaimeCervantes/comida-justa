import type { ReactNode } from "react";
import type { HabitChallengeExperienceKey } from "~/domain/habits/habitChallengeExperiences";
import { Surface } from "~/presentation/design_system/surfaces/Surface";
import { Heading } from "~/presentation/design_system/typography/Heading";
import { Text } from "~/presentation/design_system/typography/Text";
import PillarHero from "~/presentation/habits/PillarHero";
import { getPillarTheme } from "~/presentation/habits/pillarThemes";
import { type PillarKey, pillarColorClasses } from "./pilaresData";

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
  return (
    <article>
      <PillarHero
        level={1}
        title={heading}
        intro={subtitle}
        identity={identity}
        theme={getPillarTheme(challenge)}
        className="mb-10 rounded-[2rem] shadow-xl"
      />

      <div className="space-y-8 text-lg leading-relaxed">{children}</div>
    </article>
  );
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
      radius="2xl"
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
