import TextField from "~/components/ui/TextField";
import { userEvent, within, fn, expect } from "@storybook/test";
import type { Meta, StoryObj } from "@storybook/react";
import { FaUser } from "react-icons/fa";

const meta = {
  component: TextField,
  tags: ["autodocs"],
  argTypes: {
    type: {
      options: [
        "button",
        "reset",
        "checkbox",
        "range",
        "datetime-local",
        "file",
        "hidden",
        "image",
        "text",
        "email",
        "password",
        "number",
        "search",
        "color",
        "tel",
        "url",
        "submit",
        "radio",
        "time",
        "date",
        "month",
        "week",
      ],
      control: "select",
    },
  },
} satisfies Meta<typeof TextField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    type: "text",
    name: "nombre",
    label: "Nombre",
  },
};

export const WithIcon: Story = {
  args: { ...Default.args, icon: <FaUser /> },
};

export const WithIconEnd: Story = {
  args: { ...Default.args, iconEnd: <FaUser /> },
};

export const RequiredValueInteraction: Story = {
  args: { ...WithIconEnd.args, required: true },
  async play({ canvasElement }) {
    const canvas = within(canvasElement);

    const field = await canvas.findByRole("textbox", { name: "Nombre" });
    expect(field).toBeRequired();

    await userEvent.click(field);

    expect(field).toBeInvalid();
  },
};

export const TriggerOnChangeEventInteraction: Story = {
  args: {
    ...Default.args,
    onChange: fn(),
  },
  async play({ args, canvasElement }) {
    const canvas = within(canvasElement);

    const field = await canvas.findByRole("textbox", { name: "Nombre" });

    await userEvent.type(field, "Jaime");

    expect(args.onChange).toBeCalled();
  },
};
