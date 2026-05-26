import type { Meta, StoryObj } from "@storybook/react-vite";
import { IconButton } from "@thalya-modas/ui";
import { Plus } from "lucide-react";

const meta = {
  title: "Components/Actions/IconButton",
  component: IconButton,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "destructive", "outline", "secondary", "ghost"],
    },
  },
  args: {
    "aria-label": "Add item",
    children: <Plus />,
    variant: "default",
  },
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <IconButton aria-label="Add item"><Plus /></IconButton>
      <IconButton aria-label="Add item" variant="secondary"><Plus /></IconButton>
      <IconButton aria-label="Add item" variant="destructive"><Plus /></IconButton>
      <IconButton aria-label="Add item" variant="outline"><Plus /></IconButton>
      <IconButton aria-label="Add item" variant="ghost"><Plus /></IconButton>
    </div>
  ),
};

export const Large: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <IconButton aria-label="Add item" className="size-12"><Plus /></IconButton>
      <IconButton aria-label="Add item" className="size-12" variant="secondary"><Plus /></IconButton>
      <IconButton aria-label="Add item" className="size-12" variant="destructive"><Plus /></IconButton>
      <IconButton aria-label="Add item" className="size-12" variant="outline"><Plus /></IconButton>
      <IconButton aria-label="Add item" className="size-12" variant="ghost"><Plus /></IconButton>
    </div>
  ),
};
