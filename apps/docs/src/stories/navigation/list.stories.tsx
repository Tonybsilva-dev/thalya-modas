import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  List,
  ListDivider,
  ListItem,
  ListItemContent,
  ListItemMeta,
  ListTitle,
} from "@thalya-modas/ui";

const meta = {
  title: "Components/Navigation/List",
  parameters: { layout: "centered" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <List className="w-80">
      <ListTitle>List Title</ListTitle>
      <ListItem>
        <ListItemContent>List Item</ListItemContent>
        <ListItemMeta>⇧⌘A</ListItemMeta>
      </ListItem>
      <ListDivider />
      <ListItem>
        <ListItemContent>List Item</ListItemContent>
        <ListItemMeta>›</ListItemMeta>
      </ListItem>
    </List>
  ),
};
