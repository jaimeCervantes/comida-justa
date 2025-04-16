import type { Meta, StoryObj } from '@storybook/react';
import { within, userEvent, expect, fn } from '@storybook/test';
import ImageVideoPicker from './ImageVideoPicker';


const createMockFile = (name: string, type: string, size: number): File => {
  const content = 'a'.repeat(size);
  return new File([content], name, { type });
};

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
    accept: { control: 'text' },
  },
  args: {
    label: 'Select Image or Video',
    name: 'media-picker',
    onChange: fn(), // Use fn() from @storybook/test for interaction testing
    error: undefined,
    required: false,
    accept: 'image/*, video/*',
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
  args: {},
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    const fileInput = canvas.getByLabelText(args.label!, { selector: 'input' });
    const imageFile = createMockFile('test-image.png', 'image/png', 1024);

    await userEvent.upload(fileInput, imageFile);

    const imgPreview = await canvas.findByAltText('test-image.png');
    await expect(imgPreview).toBeInTheDocument();

    await expect(imgPreview).toHaveAttribute('src');


    const fileNameDisplay = await canvas.findByText('test-image.png');
    await expect(fileNameDisplay).toBeInTheDocument();

    // Check if the onChange mock function was called
    await expect(args.onChange).toHaveBeenCalledTimes(1);
    // Note: Verifying the exact FileList content passed to onChange can be complex
  },
};

export const WithVideoSelected: Story = {
  args: {},
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const fileInput = canvas.getByLabelText(args.label!, { selector: 'input' });
    const videoFile = createMockFile('test-video.mp4', 'video/mp4', 2048);

    await userEvent.upload(fileInput, videoFile);

    // Use querySelector as video elements might not have direct labels/alt text
    const videoPreview = canvasElement.querySelector('video');
    await expect(videoPreview).toBeInTheDocument();
    // Check if the src attribute is populated (it will be a data URL)
    await expect(videoPreview).toHaveAttribute('src');
    // Check if the controls attribute is present
    await expect(videoPreview).toHaveAttribute('controls');

    // Check if the file name is displayed
    const fileNameDisplay = await canvas.findByText('test-video.mp4');
    await expect(fileNameDisplay).toBeInTheDocument();

    // Check if the onChange mock function was called
    await expect(args.onChange).toHaveBeenCalledTimes(1);
  },
};
