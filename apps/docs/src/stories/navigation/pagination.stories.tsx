import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Pagination } from "@store-flow/ui";
const meta = { title: "Components/Navigation/Pagination", parameters: { layout: "centered" } } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
function PaginationExample() {
  const [page, setPage] = useState(1);
  return <Pagination page={page} pageSize={20} total={95} onPageChange={setPage} showSizeChanger={false}>
    <Pagination.Info />
    <Pagination.Prev labelPrev="Anterior" />
    <Pagination.Pages />
    <Pagination.Next labelNext="Próxima" />
  </Pagination>;
}
export const Default: Story = { render: () => <PaginationExample /> };
