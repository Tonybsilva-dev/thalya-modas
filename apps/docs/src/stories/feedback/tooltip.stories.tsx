import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, Tooltip } from "@store-flow/ui";
const meta = { title: "Components/Feedback/Tooltip", parameters: { layout: "centered" } } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  render: () => <Tooltip asChild title="Atualiza os dados desta listagem" placement="top"><Button variant="outline">Atualizar</Button></Tooltip>,
};
