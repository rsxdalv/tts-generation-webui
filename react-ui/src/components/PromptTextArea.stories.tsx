import type { Meta, StoryObj } from '@storybook/react';

import { PromptTextArea } from './PromptTextArea';

const meta = {
  component: PromptTextArea,
} satisfies Meta<typeof PromptTextArea>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    params: {},
    name: {},
    label: ""
  }
};