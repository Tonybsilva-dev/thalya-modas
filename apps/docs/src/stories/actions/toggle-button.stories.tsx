import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Check, Circle, Grid2X2, List, Calendar as CalendarIcon } from "lucide-react";
import { Calendar, Card, CardContent, ToggleButton, ToggleButtonGroup } from "@thalya-modas/ui";

const meta = {
  title: "Components/Actions/Toggle Button",
  component: ToggleButton,
  parameters: { layout: "centered" },
} satisfies Meta<typeof ToggleButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const States: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <ToggleButton pressed>
        <Check />
        Selected
      </ToggleButton>
      <ToggleButton>
        <Circle />
        Default
      </ToggleButton>
    </div>
  ),
};

export const Group: Story = {
  render: () => {
    const [view, setView] = React.useState("calendar");

    return (
      <ToggleButtonGroup aria-label="Report view">
        {[
          ["calendar", "Calendar", CalendarIcon],
          ["list", "List", List],
          ["grid", "Grid", Grid2X2],
        ].map(([value, label, Icon]) => (
          <ToggleButton
            key={value as string}
            onClick={() => setView(value as string)}
            pressed={view === value}
          >
            <Icon />
            {label as string}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    );
  },
};

export const WithCalendar: Story = {
  render: () => {
    const [mode, setMode] = React.useState("period");
    const [selected, setSelected] = React.useState(new Date(2026, 4, 26));

    return (
      <Card className="w-[520px]">
        <CardContent className="grid gap-3.5 p-5">
          <div className="grid gap-1.5">
            <h2 className="text-lg font-semibold text-foreground">
              Calendar & Toggle Button
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Use Calendar for date-heavy filters. Use Toggle Button for compact
              state changes such as view mode, report period or export format.
            </p>
          </div>

          <ToggleButtonGroup aria-label="Date mode">
            {[
              ["period", "Period", CalendarIcon],
              ["list", "List", List],
            ].map(([value, label, Icon]) => (
              <ToggleButton
                key={value as string}
                onClick={() => setMode(value as string)}
                pressed={mode === value}
              >
                <Icon />
                {label as string}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>

          <Calendar
            className="w-full"
            footerLabel="May 1 - May 26"
            onApply={() => undefined}
            onSelect={setSelected}
            selected={selected}
            today={new Date(2026, 4, 12)}
          />
        </CardContent>
      </Card>
    );
  },
};
