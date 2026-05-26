import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "@thalya-modas/ui";
import { Plus, ShoppingBag } from "lucide-react";

const meta = {
  title: "Components/Actions/Button",
  component: Button,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "destructive", "outline", "secondary", "ghost", "link"],
    },
    size: { control: "select", options: ["default", "sm", "lg", "icon"] },
  },
  args: { children: "Button", variant: "default", size: "default" },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithIcon: Story = {
  args: {
    children: (
      <>
        <ShoppingBag />
        Comprar agora
      </>
    ),
  },
};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button><Plus />Button</Button>
      <Button variant="secondary"><Plus />Button</Button>
      <Button variant="destructive"><Plus />Button</Button>
      <Button variant="outline"><Plus />Button</Button>
      <Button variant="ghost"><Plus />Button</Button>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="sm"><Plus />Small</Button>
      <Button><Plus />Default</Button>
      <Button size="lg"><Plus />Large</Button>
    </div>
  ),
};
