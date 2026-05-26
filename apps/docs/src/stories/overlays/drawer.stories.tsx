import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Button,
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerCloseButton,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@thalya-modas/ui";

const meta = {
  title: "Components/Overlays/Drawer",
  component: Drawer,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof Drawer>;

export default meta;
type Story = StoryObj<typeof meta>;

function ReceivingContent() {
  return (
    <>
      <DrawerHeader>
        <div className="grid gap-1">
          <DrawerTitle>Receiving drawer</DrawerTitle>
          <DrawerDescription>
            Dock schedule, invoice match and receiving notes.
          </DrawerDescription>
        </div>
        <DrawerCloseButton />
      </DrawerHeader>
      <DrawerBody className="flex-1 content-start">
        {[
          ["Supplier", "Moda Bella Distribuidora"],
          ["Expected items", "42 pieces · 3 categories"],
          ["Status", "Waiting invoice confirmation"],
        ].map(([label, value]) => (
          <div key={label} className="grid gap-1 border border-border bg-background p-3">
            <span className="text-xs text-muted-foreground">{label}</span>
            <strong className="text-sm font-semibold text-foreground">{value}</strong>
          </div>
        ))}
      </DrawerBody>
      <DrawerFooter>
        <DrawerClose asChild>
          <Button variant="outline">Cancel</Button>
        </DrawerClose>
        <Button>Confirm receiving</Button>
      </DrawerFooter>
    </>
  );
}

export const Right: Story = {
  render: () => (
    <Drawer>
      <DrawerTrigger asChild>
        <Button>Open drawer</Button>
      </DrawerTrigger>
      <DrawerContent>
        <ReceivingContent />
      </DrawerContent>
    </Drawer>
  ),
};

export const Bottom: Story = {
  render: () => (
    <Drawer>
      <DrawerTrigger asChild>
        <Button>Open bottom drawer</Button>
      </DrawerTrigger>
      <DrawerContent side="bottom">
        <DrawerHeader>
          <div className="grid gap-1">
            <DrawerTitle>Filter reports</DrawerTitle>
            <DrawerDescription>Choose period, format and store.</DrawerDescription>
          </div>
          <DrawerCloseButton />
        </DrawerHeader>
        <DrawerBody>
          <div className="grid gap-2.5 sm:grid-cols-3">
            {["Today", "This week", "This month"].map((label) => (
              <Button key={label} variant="outline">
                {label}
              </Button>
            ))}
          </div>
        </DrawerBody>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">Clear</Button>
          </DrawerClose>
          <Button>Apply filters</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ),
};
