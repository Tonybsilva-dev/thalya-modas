import type { Meta, StoryObj } from "@storybook/react-vite";
import { Avatar, AvatarFallback } from "@thalya-modas/ui";

const meta = {
  title: "Components/Data Display/Avatar",
  component: Avatar,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Text: Story = {
  render: () => <Avatar><AvatarFallback>PJ</AvatarFallback></Avatar>,
};
