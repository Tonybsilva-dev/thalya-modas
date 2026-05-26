import type { Meta, StoryObj } from "@storybook/react-vite";
import { Progress } from "@thalya-modas/ui";

const meta = {
  title: "Components/Feedback/Progress & Loading",
  component: Progress,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LinearProgress: Story = {
  render: () => (
    <div className="w-96">
      <Progress value={50} />
    </div>
  ),
};
