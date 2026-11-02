import type { Meta, StoryObj } from "@storybook/react-vite";
import { Avatar } from "@store-flow/ui";

const meta = {
  title: "Components/Data Display/Avatar",
  component: Avatar,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Text: Story = {
  render: () => <Avatar initials="PJ" aria-label="Pessoa ilustrativa" />,
};
