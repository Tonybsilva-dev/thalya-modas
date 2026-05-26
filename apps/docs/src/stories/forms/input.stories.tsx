import type { Meta, StoryObj } from "@storybook/react-vite";
import { Input, Label } from "@thalya-modas/ui";

const meta = {
  title: "Components/Forms/Input",
  component: Input,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="grid w-96 gap-2">
      <Label htmlFor="name">Label Text</Label>
      <Input id="name" placeholder="Placeholder" />
    </div>
  ),
};

export const Filled: Story = {
  render: () => (
    <div className="grid w-96 gap-2">
      <Label htmlFor="filled">Label Text</Label>
      <Input id="filled" defaultValue="Input Value" />
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="grid w-96 gap-2">
      <Label htmlFor="disabled">Label Text</Label>
      <Input id="disabled" disabled placeholder="Disabled" />
    </div>
  ),
};
