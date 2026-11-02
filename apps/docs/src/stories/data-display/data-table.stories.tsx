import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Badge, DataTable, Input, type ColumnDef } from "@store-flow/ui";
type ExampleRow = { id: string; name: string; active: boolean };
const rows: ExampleRow[] = [
  { id: "example-1", name: "Fornecedor ilustrativo A", active: true },
  { id: "example-2", name: "Fornecedor ilustrativo B", active: false },
];
const columns: ColumnDef<ExampleRow, unknown>[] = [
  { accessorKey: "name", header: "Fornecedor" },
  { accessorKey: "active", header: "Situação", cell: ({ row }) => <Badge variant={row.original.active ? "success" : "secondary"}>{row.original.active ? "Ativo" : "Inativo"}</Badge> },
];
const meta = { title: "Components/Data Display/DataTable", parameters: { layout: "padded" } } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
function DataTableExample() {
  const [search, setSearch] = useState("");
  return <DataTable getRowId={row => row.id} data={rows.filter(row => row.name.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR")))} columns={columns}
    tableCaption="Fornecedores ilustrativos, sem persistência de dados" enableRowSelection
    getRowLabel={row => row.name}
    toolbarLeft={<Input aria-label="Buscar fornecedor ilustrativo" placeholder="Buscar fornecedor" value={search} onChange={event => setSearch(event.target.value)} />}
  />;
}
export const Default: Story = { render: () => <DataTableExample /> };
