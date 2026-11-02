import type { Meta, StoryObj } from "@storybook/react-vite";
import { List, ListItem, ListItemMeta } from "@store-flow/ui";
const meta = { title: "Components/Navigation/List", parameters: { layout: "centered" } } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  render: () => <List className="w-80" header="Cadastros ilustrativos" bordered split>
    <ListItem><ListItemMeta title="Fornecedor de exemplo" description="Cadastro ativo" /></ListItem>
    <ListItem><ListItemMeta title="Cliente de exemplo" description="Contato não informado" /></ListItem>
  </List>,
};
