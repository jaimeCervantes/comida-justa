import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Badge, type BadgeTone } from "./Badge";

const TONES: BadgeTone[] = [
  "neutral",
  "brand",
  "accent",
  "sleep",
  "nutrition",
  "movement",
  "mindSpirit",
];

const meta = {
  component: Badge,
  tags: ["autodocs"],
  argTypes: {
    tone: { control: "select", options: TONES },
    emphasis: { control: "inline-radio", options: ["soft", "strong"] },
    children: { control: "text" },
  },
  parameters: {
    docs: {
      description: {
        component:
          "La insignia del sitio. Antes existía tres veces —SoldOutBadge, ProvenanceBadge y " +
          "CategoryTag— con el mismo chip copiado y tres colores distintos. La forma vive aquí, el " +
          "color es una variante y el texto llega ya traducido: el design system nunca lee el " +
          "catálogo de mensajes, porque tiene que poder renderizarse fuera del proveedor de i18n.",
      },
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { tone: "neutral", emphasis: "soft", children: "Agotado" },
};

/** Los tres usos que hoy existen en el sitio, tal como se ven en una tarjeta. */
export const EnUnaTarjeta: Story = {
  args: { children: "" },
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Badge tone="brand" emphasis="strong">
        🌿 Hazlo Sano
      </Badge>
      <Badge tone="accent">Jugos</Badge>
      <Badge tone="neutral">Agotado</Badge>
    </div>
  ),
};

/** La rampa de los cuatro pilares. Cada par fondo/tinta está verificado contra AA. */
export const Pilares: Story = {
  args: { children: "" },
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Badge tone="sleep">1 · Sueño</Badge>
      <Badge tone="nutrition">2 · Alimentación</Badge>
      <Badge tone="movement">3 · Movimiento</Badge>
      <Badge tone="mindSpirit">4 · Mente y Espíritu</Badge>
    </div>
  ),
};

export const TodosLosTonos: Story = {
  args: { children: "" },
  render: () => (
    <div className="flex flex-col gap-4">
      {(["soft", "strong"] as const).map((emphasis) => (
        <div key={emphasis} className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-wide text-text-support">
            emphasis: {emphasis}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {TONES.map((tone) => (
              <Badge key={tone} tone={tone} emphasis={emphasis}>
                {tone}
              </Badge>
            ))}
          </div>
        </div>
      ))}
    </div>
  ),
};
