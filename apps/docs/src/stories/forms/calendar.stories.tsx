import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Calendar } from "@store-flow/ui";

const meta = {
  title: "Components/Forms/Calendar",
  component: Calendar,
  parameters: { layout: "centered" },
  args: {
    footerLabel: "May 1 - May 26",
    selected: new Date(2026, 4, 26),
    today: new Date(2026, 4, 12),
  },
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Portuguese: Story = {
  args: {
    locale: "pt-BR",
    subtitle: "Selecione o dia",
    previousMonthLabel: "Mês anterior",
    nextMonthLabel: "Próximo mês",
    footerLabel: undefined,
  },
};

export const Interactive: Story = {
  render: () => {
    const [selected, setSelected] = React.useState(new Date(2026, 4, 26));

    return (
      <Calendar
        footerLabel="May 1 - May 26"
        onApply={() => undefined}
        onSelect={setSelected}
        selected={selected}
        today={new Date(2026, 4, 12)}
      />
    );
  },
};
