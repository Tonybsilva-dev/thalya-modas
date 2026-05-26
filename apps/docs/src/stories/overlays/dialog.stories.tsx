import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@thalya-modas/ui";

const meta = {
  title: "Components/Overlays/Dialog",
  component: Dialog,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild><Button>Open modal</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modal Title</DialogTitle>
          <DialogDescription>Modal Subtitle</DialogDescription>
        </DialogHeader>
        <div className="h-10 border border-primary/40" />
        <DialogFooter>
          <Button variant="secondary">Action</Button>
          <Button>Action</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};
