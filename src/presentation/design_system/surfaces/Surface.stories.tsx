import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Surface } from "./Surface";

const meta = {
  component: Surface,
  tags: ["autodocs"],
  argTypes: {
    radius: {
      control: "inline-radio",
      options: ["chip", "chip", "control", "card"],
    },
    elevation: {
      control: "inline-radio",
      options: ["none", "xs", "sm", "chip", "chip"],
    },
    border: { control: "inline-radio", options: ["none", "subtle"] },
    background: {
      control: "inline-radio",
      options: ["none", "base", "raised", "sunken"],
    },
    interactive: { control: "boolean" },
  },
  parameters: {
    docs: {
      description: {
        component:
          "El contenedor con fondo, borde, radio y elevación del sitio. Los tokens --radius-* y " +
          "--shadow-* existían desde el slice 2 sin que los consumiera nadie: el radio se decidía " +
          "archivo por archivo, con 71 rounded-* repartidos en 31 archivos. Los colores salen de " +
          "tokens semánticos, así que no hay variantes dark:.",
      },
    },
  },
} satisfies Meta<typeof Surface>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Tarjeta: Story = {
  args: {
    as: "article",
    radius: "card",
    background: "raised",
    border: "subtle",
    elevation: "md",
    interactive: true,
    className: "p-6 max-w-sm",
    children: "Una publicación del catálogo",
  },
};

export const Escala: Story = {
  args: { children: "" },
  render: () => (
    <div className="flex flex-wrap gap-4">
      {(["chip", "control", "card", "panel"] as const).map((radius) => (
        <Surface
          key={radius}
          radius={radius}
          background="raised"
          border="subtle"
          elevation="sm"
          className="p-6"
        >
          radius {radius}
        </Surface>
      ))}
    </div>
  ),
};

export const Elevaciones: Story = {
  args: { children: "" },
  render: () => (
    <div className="flex flex-wrap gap-6 p-4">
      {(["none", "xs", "sm", "md", "lg"] as const).map((elevation) => (
        <Surface
          key={elevation}
          radius="control"
          background="raised"
          border="subtle"
          elevation={elevation}
          className="p-6"
        >
          {elevation}
        </Surface>
      ))}
    </div>
  ),
};

/** Los tres escalones de fondo, para ver que se distinguen en ambos temas. */
export const Fondos: Story = {
  args: { children: "" },
  render: () => (
    <Surface background="base" radius="card" className="p-6">
      <p className="mb-4 text-sm text-text-support">background: base</p>
      <Surface
        background="raised"
        border="subtle"
        radius="control"
        className="p-6"
      >
        <p className="mb-4 text-sm text-text-support">background: raised</p>
        <Surface background="sunken" radius="chip" className="p-4">
          <p className="text-sm text-text-support">background: sunken</p>
        </Surface>
      </Surface>
    </Surface>
  ),
};
