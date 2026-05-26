import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge } from "@thalya-modas/ui";

const meta = {
  title: "Components/Feedback/Badge",
  component: Badge,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Badge variant="success">Explorer</Badge>
      <Badge variant="warning">Transporter</Badge>
      <Badge variant="info">Hauler</Badge>
      <Badge variant="secondary">Pioneer</Badge>
      <Badge variant="outline">Outline</Badge>
    </div>
  ),
};
