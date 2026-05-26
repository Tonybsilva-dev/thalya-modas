import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Avatar,
  AvatarFallback,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarItem,
  SidebarSectionTitle,
} from "@thalya-modas/ui";

const meta = {
  title: "Components/Layout/Sidebar",
  component: Sidebar,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof Sidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Sidebar className="h-[420px]">
      <SidebarHeader><div className="font-semibold text-foreground">Nitro</div></SidebarHeader>
      <SidebarContent>
        <SidebarSectionTitle>Operations</SidebarSectionTitle>
        <SidebarItem active>Dashboard</SidebarItem>
        <SidebarItem>Orders</SidebarItem>
        <SidebarItem>Customers</SidebarItem>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center gap-3">
          <Avatar><AvatarFallback>PJ</AvatarFallback></Avatar>
          <div className="min-w-0 text-sm">
            <div className="font-medium text-foreground">Joe Doe</div>
            <div className="truncate text-muted-foreground">joe@acmecorp.com</div>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  ),
};
