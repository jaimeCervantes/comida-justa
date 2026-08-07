import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import MediaContent from "./MediaContent";

const meta = {
  title: "Components/MediaContent",
  component: MediaContent,
  tags: ["autodocs"],
  argTypes: {
    media: {
      control: "object",
      description:
        "Objeto que define el tipo de medio, URL y texto alternativo",
    },
    className: {
      control: "text",
      description: "Clases CSS adicionales para personalizar el componente",
    },
  },
  args: {
    media: {
      type: "image",
      url: "/sample-image.jpg",
      alt: "Imagen de ejemplo",
    },
    className: "",
  },
} satisfies Meta<typeof MediaContent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Video: Story = {
  args: {
    media: {
      type: "video",
      url: "https://example.com/sample-video.mp4",
      alt: "Video de ejemplo",
    },
  },
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);

    const videoElement = canvas.getByTitle("Video de ejemplo");
    await expect(videoElement).toBeInTheDocument();
    await expect(videoElement.tagName).toBe("VIDEO");

    await expect(videoElement).toHaveAttribute(
      "src",
      "https://example.com/sample-video.mp4",
    );
    await expect(videoElement).toHaveAttribute("controls");

    await expect(videoElement).toBeInTheDocument();
  },
};

export const Image: Story = {
  args: {
    media: {
      type: "image",
      url: "/sample-image.jpg",
      alt: "Imagen de ejemplo",
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const imageElement = canvas.getByAltText("Imagen de ejemplo");
    await expect(imageElement).toBeInTheDocument();

    await expect(imageElement).toHaveAttribute(
      "src",
      expect.stringContaining("/sample-image.jpg"),
    );
    await expect(imageElement).toHaveAttribute("alt", "Imagen de ejemplo");

    await expect(imageElement).toBeInTheDocument();
  },
};

export const Audio: Story = {
  args: {
    media: {
      type: "audio",
      url: "https://example.com/sample-audio.mp3",
      alt: "Audio de ejemplo",
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verificar que el elemento de audio existe
    const audioElement = canvas.getByTitle("Audio de ejemplo");
    await expect(audioElement).toBeInTheDocument();
    await expect(audioElement.tagName).toBe("AUDIO");

    // Verificar atributos del audio
    await expect(audioElement).toHaveAttribute(
      "src",
      "https://example.com/sample-audio.mp3",
    );
    await expect(audioElement).toHaveAttribute("controls");

    await expect(audioElement).toBeInTheDocument();
  },
};

export const Default: Story = {
  args: {
    media: {
      type: "pdf",
      url: "https://example.com/sample-document.pdf",
      alt: "PDF de ejemplo",
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const linkElement = canvas.getByText("PDF de ejemplo");
    await expect(linkElement).toBeInTheDocument();
    await expect(linkElement.tagName).toBe("A");

    // Verificar atributos del enlace
    await expect(linkElement).toHaveAttribute(
      "href",
      "https://example.com/sample-document.pdf",
    );
    await expect(linkElement).toHaveAttribute("target", "_blank");
    await expect(linkElement).toHaveAttribute("rel", "noopener noreferrer");

    await expect(linkElement).toBeInTheDocument();
  },
};

export const WithCustomClass: Story = {
  args: {
    media: {
      type: "image",
      url: "/sample-image.jpg",
      alt: "Imagen con clase personalizada",
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const imageElement = canvas.getByAltText("Imagen con clase personalizada");
    await expect(imageElement).toBeInTheDocument();

    await expect(imageElement).toHaveClass("w-full", "aspect-video");
  },
};

export const UnknownType: Story = {
  args: {
    media: {
      type: "unknown-type",
      url: "https://example.com/unknown-file.xyz",
      alt: "Tipo de archivo desconocido",
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const linkElement = canvas.getByText("Tipo de archivo desconocido");
    await expect(linkElement).toBeInTheDocument();
    await expect(linkElement.tagName).toBe("A");

    await expect(linkElement).toHaveAttribute(
      "href",
      "https://example.com/unknown-file.xyz",
    );
  },
};

export const EmptyAltText: Story = {
  args: {
    media: {
      type: "pdf",
      url: "https://example.com/empty-alt-file.pdf",
      alt: "",
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const linkElement = canvas.getByText("Descargar archivo");
    await expect(linkElement).toBeInTheDocument();

    await expect(linkElement).toHaveAttribute(
      "href",
      "https://example.com/empty-alt-file.pdf",
    );
  },
};
