import type { Meta, StoryObj } from "@storybook/react-vite";
import { Breadcrumb } from "@store-flow/ui";
const meta = { title: "Components/Navigation/Breadcrumb", parameters: { layout: "centered" } } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  render: () => <Breadcrumb aria-label="Navegação ilustrativa" items={[{ label: "Fornecedores", href: "#fornecedores" }, { label: "Novo fornecedor" }]} />,
};
