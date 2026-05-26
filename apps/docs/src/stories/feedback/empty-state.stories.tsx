import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Button,
  EmptyState,
  EmptyStateActions,
  EmptyStateContent,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@thalya-modas/ui";
import { SearchX } from "lucide-react";

const meta = {
  title: "Components/Feedback/Empty State",
  component: EmptyState,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof EmptyState>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <EmptyState className="w-[560px]">
      <EmptyStateContent>
        <EmptyStateIcon>
          <SearchX />
        </EmptyStateIcon>
        <div className="grid gap-2">
          <EmptyStateTitle>No results found</EmptyStateTitle>
          <EmptyStateDescription>
            Try adjusting your filters or search terms to find what you need.
          </EmptyStateDescription>
        </div>
        <EmptyStateActions>
          <Button variant="outline">Clear filters</Button>
          <Button>New search</Button>
        </EmptyStateActions>
      </EmptyStateContent>
    </EmptyState>
  ),
};

export const Minimal: Story = {
  render: () => (
    <EmptyState className="w-[560px]">
      <EmptyStateContent>
        <EmptyStateTitle>Nothing here yet</EmptyStateTitle>
        <EmptyStateDescription>
          Content will appear here once records are created.
        </EmptyStateDescription>
      </EmptyStateContent>
    </EmptyState>
  ),
};
