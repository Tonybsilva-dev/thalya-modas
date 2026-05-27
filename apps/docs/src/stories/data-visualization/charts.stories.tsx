import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  AreaChart,
  BarColumnChart,
  DataBrushChart,
  HistogramChart,
  LineChart,
  PieChart,
  RadarChart,
  ScatterChart,
} from "@thalya-modas/ui";

const meta = {
  title: "Components/Data Visualization/Charts",
  component: BarColumnChart,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof BarColumnChart>;

export default meta;
type Story = StoryObj;

const weekLabels = ["Seg", "Ter", "Qua", "Qui", "Sex"];
const monthLabels = ["fev.", "mar.", "abr.", "mai.", "jun.", "jul."];

export const BarColumn: Story = {
  render: () => (
    <BarColumnChart
      className="w-[620px]"
      data={[
        { label: "Seg", secondaryValue: 42, value: 68 },
        { label: "Ter", secondaryValue: 58, value: 82 },
        { label: "Qua", secondaryValue: 50, value: 74 },
        { label: "Qui", secondaryValue: 72, value: 96 },
        { label: "Sex", secondaryValue: 84, value: 124 },
      ]}
      primaryLabel="Receita"
      secondaryLabel="Pedidos"
    />
  ),
};

export const Line: Story = {
  render: () => (
    <LineChart
      className="w-[620px]"
      labels={weekLabels}
      series={[
        { data: [42, 58, 54, 76, 88], label: "Vendas" },
        { data: [50, 52, 60, 70, 82], label: "Meta" },
      ]}
    />
  ),
};

export const Area: Story = {
  render: () => (
    <AreaChart
      className="w-[620px]"
      labels={monthLabels}
      series={[
        { data: [34, 46, 44, 62, 72, 86], label: "Tenants" },
        { data: [22, 34, 38, 48, 56, 70], label: "Tickets" },
      ]}
    />
  ),
};

export const Pie: Story = {
  render: () => (
    <PieChart
      className="w-[360px]"
      data={[
        { label: "Roupas", value: 52 },
        { label: "Acessórios", value: 31 },
        { color: "#94A3B8", label: "Outros", value: 17 },
      ]}
    />
  ),
};

export const Radar: Story = {
  render: () => (
    <RadarChart
      className="w-[400px]"
      data={[
        { label: "Venda", value: 82 },
        { label: "Ticket", value: 68 },
        { label: "Estoque", value: 74 },
        { label: "Caixa", value: 91 },
        { label: "Cliente", value: 64 },
      ]}
    />
  ),
};

export const Scatter: Story = {
  render: () => (
    <ScatterChart
      className="w-[620px]"
      data={[
        { label: "Pedido 1", x: 12, y: 48 },
        { label: "Pedido 2", x: 22, y: 60 },
        { label: "Pedido 3", x: 30, y: 38 },
        { label: "Pedido 4", x: 38, y: 82 },
        { label: "Pedido 5", x: 45, y: 70 },
        { label: "Pedido 6", x: 52, y: 96 },
        { label: "Pedido 7", x: 64, y: 78 },
        { label: "Pedido 8", x: 76, y: 112 },
      ]}
    />
  ),
};

export const Histogram: Story = {
  render: () => (
    <HistogramChart
      className="w-[620px]"
      data={[
        { label: "0-10", value: 8 },
        { label: "10-20", value: 18 },
        { label: "20-30", value: 34 },
        { label: "30-40", value: 28 },
        { label: "40-50", value: 19 },
        { label: "50-60", value: 10 },
      ]}
    />
  ),
};

export const DataBrush: Story = {
  render: () => (
    <DataBrushChart
      className="w-[900px]"
      labels={monthLabels}
      series={[
        { data: [5, 8, 7, 12, 14, 16], label: "Tenants" },
        { data: [8, 10, 9, 13, 15, 18], label: "Tickets" },
      ]}
    />
  ),
};

export const Overview: Story = {
  render: () => (
    <div className="grid w-full max-w-[760px] grid-cols-1 gap-4 p-1">
      <BarColumnChart
        className="min-w-0"
        data={[
          { label: "Seg", secondaryValue: 42, value: 68 },
          { label: "Ter", secondaryValue: 58, value: 82 },
          { label: "Qua", secondaryValue: 50, value: 74 },
          { label: "Qui", secondaryValue: 72, value: 96 },
          { label: "Sex", secondaryValue: 84, value: 124 },
        ]}
      />
      <LineChart
        className="min-w-0"
        labels={weekLabels}
        series={[
          { data: [42, 58, 54, 76, 88], label: "Vendas" },
          { data: [50, 52, 60, 70, 82], label: "Meta" },
        ]}
      />
      <AreaChart
        className="min-w-0"
        labels={monthLabels}
        series={[
          { data: [34, 46, 44, 62, 72, 86], label: "Tenants" },
          { data: [22, 34, 38, 48, 56, 70], label: "Tickets" },
        ]}
      />
      <ScatterChart
        className="min-w-0"
        data={[
          { label: "Pedido 1", x: 12, y: 48 },
          { label: "Pedido 2", x: 22, y: 60 },
          { label: "Pedido 3", x: 30, y: 38 },
          { label: "Pedido 4", x: 38, y: 82 },
          { label: "Pedido 5", x: 45, y: 70 },
          { label: "Pedido 6", x: 52, y: 96 },
        ]}
      />
    </div>
  ),
};
