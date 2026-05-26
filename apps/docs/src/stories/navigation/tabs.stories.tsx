import type { Meta, StoryObj } from "@storybook/react-vite";
import { Card, CardContent, Tabs, TabsContent, TabsList, TabsTrigger } from "@thalya-modas/ui";

const meta = {
  title: "Components/Navigation/Tabs",
  parameters: { layout: "centered" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Tabs className="w-[520px]" defaultValue="integrations">
      <TabsList>
        <TabsTrigger value="integrations">Integrations</TabsTrigger>
        <TabsTrigger value="billing">Billing</TabsTrigger>
        <TabsTrigger value="profile">Profile</TabsTrigger>
        <TabsTrigger value="advanced">Advanced</TabsTrigger>
      </TabsList>
      <TabsContent value="integrations">
        <Card><CardContent className="text-sm text-muted-foreground">Connected systems.</CardContent></Card>
      </TabsContent>
      <TabsContent value="billing">
        <Card><CardContent className="text-sm text-muted-foreground">Billing settings.</CardContent></Card>
      </TabsContent>
      <TabsContent value="profile">
        <Card><CardContent className="text-sm text-muted-foreground">Profile settings.</CardContent></Card>
      </TabsContent>
      <TabsContent value="advanced">
        <Card><CardContent className="text-sm text-muted-foreground">Advanced settings.</CardContent></Card>
      </TabsContent>
    </Tabs>
  ),
};
