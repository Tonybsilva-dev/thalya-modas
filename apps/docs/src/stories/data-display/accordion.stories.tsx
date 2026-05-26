import type { Meta, StoryObj } from "@storybook/react-vite";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@thalya-modas/ui";

const meta = {
  title: "Components/Data Display/Accordion",
  parameters: { layout: "centered" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Accordion className="w-[520px]" collapsible defaultValue="item-1" type="single">
      <AccordionItem value="item-1">
        <AccordionTrigger>What is a micro-interaction?</AccordionTrigger>
        <AccordionContent>Micro-interactions are events with one main task and a single purpose.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>How is Nitro structured?</AccordionTrigger>
        <AccordionContent>Nitro keeps components compact, direct, and system-oriented.</AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};
