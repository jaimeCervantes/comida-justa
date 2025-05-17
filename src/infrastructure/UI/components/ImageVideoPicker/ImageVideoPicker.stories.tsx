import type { Meta, StoryObj } from '@storybook/react';
import { within, userEvent, expect, fn } from '@storybook/test';
import ImageVideoPicker from '~/infrastructure/UI/components/ImageVideoPicker/ImageVideoPicker';
import { createMockFile } from '~/infrastructure/UI/stories/utils';

const meta = {
  title: 'Components/UI/ImageVideoPicker',
  component: ImageVideoPicker,
  tags: ['autodocs'],
  argTypes: {
    // Mock the onChange function using Storybook actions or fn()
    // This allows us to check if it gets called in the 'play' functions
    onChange: { action: 'changed' },
    label: { control: 'text' },
    name: { control: 'text' },
    error: { control: 'text' },
    required: { control: 'boolean' },
    accept: {
      control: 'text',
      description: `Especifica los tipos de archivo aceptados. 
        **Nota importante para pruebas con \`userEvent.upload\`:** 
        El valor debe ser \`"image/*,video/*"\` (sin espacio después de la coma). 
        Si se usa \`"image/*, video/*"\`, \`userEvent.upload\` puede fallar al disparar 
        el evento \`onChange\` para el segundo tipo en entornos de prueba como JSDOM, 
        aunque los navegadores reales lo manejen correctamente.`,
    },
  },
  args: {
    label: 'Select Image or Video',
    name: 'media-picker',
    onChange: fn(), // Use fn() from @storybook/test for interaction testing
    error: undefined,
    required: false,
    accept: 'image/*,video/*',
  },
} satisfies Meta<typeof ImageVideoPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

// Story for the default state
export const Default: Story = {
  args: {},
};

// Story for the state with an error message
export const WithError: Story = {
  args: {
    error: 'Please select a valid file.',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const errorIcon = canvas.getByLabelText('iconError');
    const errorMessage = canvas.getByText('Please select a valid file.');
    await expect(errorIcon).toBeInTheDocument();
    await expect(errorMessage).toBeInTheDocument();
  },
};

export const WithImageSelected: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    const fileInput = canvas.getByLabelText(args.label!);
    const imageFile = createMockFile('test-image.png', 'image/png', 1024);

    await userEvent.upload(fileInput, imageFile);

    const imgPreview = await canvas.findByAltText('test-image.png');
    await expect(imgPreview).toBeInTheDocument();

    await expect(imgPreview).toHaveAttribute('src');

    const fileNameDisplay = await canvas.findByText('test-image.png');
    await expect(fileNameDisplay).toBeInTheDocument();

    await expect(args.onChange).toHaveBeenCalledTimes(1);
  },
};

export const WithVideoSelected: Story = {
  args: {},
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const fileInput = canvas.getByLabelText(args.label!, { selector: 'input' });
    const videoFile = createMockFile('test-video.mp4', 'video/mp4', 2048);

    await userEvent.upload(fileInput, videoFile);

    const videoPreview = await canvas.findByRole("video")

    await expect(videoPreview).toBeInTheDocument();
    await expect(videoPreview).toHaveAttribute('src');
    await expect(videoPreview).toHaveAttribute('controls');

    const fileNameDisplay = await canvas.findByText('test-video.mp4');
    await expect(fileNameDisplay).toBeInTheDocument();

    await expect(args.onChange).toHaveBeenCalledTimes(1);
  },
};

