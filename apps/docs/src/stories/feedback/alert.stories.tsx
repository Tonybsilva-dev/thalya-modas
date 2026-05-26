import type { Meta, StoryObj } from "@storybook/react-vite";
import type * as React from "react";
import { Alert, AlertDescription, AlertTitle } from "@thalya-modas/ui";

const meta = {
  title: "Components/Feedback/Alert",
  component: Alert,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Variants: Story = {
  render: () => (
    <div className="grid w-[560px] gap-4">
      {[
        ["default", "Rover status update", "All systems are running within optimal parameters."],
        ["success", "Mission approved", "Your request has been confirmed."],
        ["warning", "Terrain instability detected", "Proceed with caution."],
        ["destructive", "Communication link lost", "Retry connection in 10 minutes."],
      ].map(([variant, title, description]) => (
        <Alert key={variant} variant={variant as React.ComponentProps<typeof Alert>["variant"]}>
          <span className="mt-0.5 size-4 rounded-full border border-current text-center text-xs leading-3">
            {variant === "default" ? "i" : variant === "success" ? "✓" : variant === "warning" ? "!" : "×"}
          </span>
          <div>
            <AlertTitle>{title}</AlertTitle>
            <AlertDescription>{description}</AlertDescription>
          </div>
        </Alert>
      ))}
    </div>
  ),
};
