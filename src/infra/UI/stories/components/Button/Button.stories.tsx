import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { Button } from "~/presentation/design_system/buttons/Button";

const meta = {
  component: Button,
  tags: ["autodocs"],
  argTypes: {
    type: {
      control: "select",
      options: ["button", "reset", "submit"],
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
    },
    color: { control: "select", options: ["green", "orange", "black"] },
    isLoading: { control: "boolean", value: false },
  },
} satisfies Meta<typeof Button>;

export default meta;

export const Default: StoryObj<typeof meta> = {
  args: {
    size: "md",
    color: "green",
    children: "Publicar",
  },
};

export const LoadingInteraction: StoryObj<typeof meta> = {
  args: {
    ...Default.args,
    isLoading: true,
    children: "Publicar",
    loadingLabel: "Cargando...",
  },
  async play({ canvasElement }) {
    const canvas = within(canvasElement);

    const icon = canvas.getByTitle(/cargando/i);

    expect(icon).toBeInTheDocument();
  },
};
