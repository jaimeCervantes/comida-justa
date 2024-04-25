import Button from "~/components/ui/Button/Button";
import { within, expect } from "@storybook/test";
import type { Meta, StoryObj } from "@storybook/react";

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
  },
  async play({ args, canvasElement }) {
    const canvas = within(canvasElement);

    const icon = canvas.getByTitle(/cargando/i);

    expect(icon).toBeInTheDocument();
  },
};
