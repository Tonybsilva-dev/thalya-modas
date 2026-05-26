import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@thalya-modas/ui";

const meta = {
  title: "Components/Forms/Select & Textarea",
  parameters: { layout: "centered" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const SelectField: Story = {
  render: () => (
    <div className="grid w-96 gap-2">
      <Label>Label Text</Label>
      <Select defaultValue="selected">
        <SelectTrigger>
          <SelectValue placeholder="Select option" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="selected">Selected option</SelectItem>
          <SelectItem value="draft">Draft option</SelectItem>
          <SelectItem value="archived">Archived option</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};

export const TextareaField: Story = {
  render: () => (
    <div className="grid w-96 gap-2">
      <Label htmlFor="message">Label Text</Label>
      <Textarea id="message" placeholder="Placeholder" />
    </div>
  ),
};
