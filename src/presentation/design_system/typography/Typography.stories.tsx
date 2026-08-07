import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Heading } from "./Heading";
import { Text } from "./Text";

function Escala() {
  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <Text variant="caption" tone="support">
          Encabezados — el nivel es estructura, el tamaño es apariencia
        </Text>
        <Heading level={1}>Sueño (nivel 1)</Heading>
        <Heading level={2}>Alimentación (nivel 2)</Heading>
        <Heading level={3}>Movimiento (nivel 3)</Heading>
        <Heading level={4}>Mente y Espíritu (nivel 4)</Heading>
      </section>

      <section className="flex flex-col gap-3">
        <Text variant="caption" tone="support">
          Un h2 con apariencia pequeña: la jerarquía del documento no se toca
        </Text>
        <Heading level={2} size="xs">
          Sección discreta, pero sigue siendo un h2
        </Heading>
      </section>

      <section className="flex flex-col gap-3">
        <Text variant="caption" tone="support">
          Texto — la variante dice el papel, no el tamaño
        </Text>
        <Text variant="lead">
          Entradilla: la frase que sostiene el encabezado y decide si alguien
          sigue leyendo.
        </Text>
        <Text>
          Cuerpo: el párrafo largo lleva interlineado holgado porque está hecho
          para leerse seguido, no para ojearse.
        </Text>
        <Text variant="label" weight="medium">
          Etiqueta: el pie de una tarjeta o el nombre de un campo.
        </Text>
        <Text variant="caption" tone="support">
          Leyenda: una nota que acompaña sin competir.
        </Text>
        <Text variant="tiny" tone="support">
          Diminuto: avisos legales. Por debajo de esto no se lee.
        </Text>
      </section>

      <section className="flex flex-col gap-3">
        <Text variant="caption" tone="support">
          El color sale del token: cambia solo con el tema
        </Text>
        <Text tone="base">Tono base</Text>
        <Text tone="support">Tono de apoyo</Text>
        <Heading level={3} tone="inherit" className="text-pillar-movement-ink">
          Tono heredado, pintado con el token de Movimiento
        </Heading>
      </section>
    </div>
  );
}

const meta = {
  title: "Tipografía/Escala",
  component: Escala,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Los tokens --fs-* existían desde el slice 2 sin que ningún componente los consumiera: " +
          "nunca llegaron a @theme, así que no generaban ninguna clase. Mientras tanto había 99 " +
          "text-sm, 47 text-xl y 40 text-2xl escritos a mano por el árbol.",
      },
    },
  },
} satisfies Meta<typeof Escala>;

export default meta;

export const Escalas: StoryObj<typeof meta> = {};
