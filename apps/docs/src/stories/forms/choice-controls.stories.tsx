import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Checkbox,
  Label,
  RadioGroup,
  RadioGroupItem,
  Switch,
} from "@thalya-modas/ui";

const meta = {
  title: "Components/Forms/Choice Controls",
  parameters: { layout: "centered" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const CheckboxRadioSwitch: Story = {
  render: () => (
    <div className="grid w-96 gap-6">
      <div className="flex items-center gap-3">
        <Checkbox id="checkbox" defaultChecked />
        <div className="grid gap-1">
          <Label htmlFor="checkbox">Enable autonomous navigation</Label>
          <p className="text-sm text-muted-foreground">
            Let the system choose the safest route on its own.
          </p>
        </div>
      </div>

      <RadioGroup defaultValue="pathfinder" className="gap-4">
        <div className="flex items-start gap-3">
          <RadioGroupItem id="pathfinder" value="pathfinder" />
          <div className="grid gap-1">
            <Label htmlFor="pathfinder">Pathfinder Neo</Label>
            <p className="text-sm text-muted-foreground">
              Compact option optimized for short-range missions.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <RadioGroupItem id="aurora" value="aurora" />
          <div className="grid gap-1">
            <Label htmlFor="aurora">Aurora Scout</Label>
            <p className="text-sm text-muted-foreground">
              Extended capacity for longer routes.
            </p>
          </div>
        </div>
      </RadioGroup>

      <div className="flex items-center gap-3">
        <Switch id="saving" defaultChecked />
        <Label htmlFor="saving">Power-saving mode</Label>
      </div>
    </div>
  ),
};
