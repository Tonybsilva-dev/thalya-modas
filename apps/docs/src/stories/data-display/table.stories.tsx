import type { Meta, StoryObj } from "@storybook/react-vite";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@thalya-modas/ui";

const meta = {
  title: "Components/Data Display/Table",
  component: Table,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="w-[620px]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Aurora Scout</TableCell>
            <TableCell>Active</TableCell>
            <TableCell className="text-right">$45.00</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Pathfinder Neo</TableCell>
            <TableCell>Pending</TableCell>
            <TableCell className="text-right">$32.00</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  ),
};
