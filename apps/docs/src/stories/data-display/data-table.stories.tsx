import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Button,
  DataTable,
  DataTableFooter,
  DataTableSearch,
  DataTableToolbar,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@thalya-modas/ui";

const meta = {
  title: "Components/Data Display/DataTable",
  component: DataTable,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof DataTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <DataTable className="w-[760px]">
      <DataTableToolbar>
        <DataTableSearch />
        <Button variant="outline">Button</Button>
      </DataTableToolbar>
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
      <DataTableFooter selectedCount={0} totalCount={5} />
    </DataTable>
  ),
};
