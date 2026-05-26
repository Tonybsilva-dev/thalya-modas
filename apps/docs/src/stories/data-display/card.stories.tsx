import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@thalya-modas/ui";

const meta = {
  title: "Components/Data Display/Card",
  component: Card,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card className="w-[420px]">
      <CardHeader>
        <CardTitle>Solar Efficiency Pack</CardTitle>
        <CardDescription>Boosts rover endurance.</CardDescription>
      </CardHeader>
      <CardContent><p className="text-sm text-muted-foreground">Optimizes resource usage with a compact operational profile.</p></CardContent>
      <CardFooter><Button variant="secondary">Request</Button><Button variant="outline">Cancel</Button></CardFooter>
    </Card>
  ),
};
