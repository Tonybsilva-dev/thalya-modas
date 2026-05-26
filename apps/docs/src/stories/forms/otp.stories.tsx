import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
  Label,
} from "@thalya-modas/ui";

const meta = {
  title: "Components/Forms/OTP",
  parameters: { layout: "centered" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  render: () => (
    <div className="grid gap-2">
      <Label>Label Text</Label>
      <InputOTPGroup>
        <InputOTPSlot />
        <InputOTPSlot />
        <InputOTPSlot />
        <InputOTPSeparator />
        <InputOTPSlot />
        <InputOTPSlot />
        <InputOTPSlot />
      </InputOTPGroup>
    </div>
  ),
};

export const Filled: Story = {
  render: () => (
    <div className="grid gap-2">
      <Label>Label Text</Label>
      <InputOTPGroup>
        <InputOTPSlot char="0" />
        <InputOTPSlot char="0" />
        <InputOTPSlot char="0" />
        <InputOTPSeparator />
        <InputOTPSlot char="0" />
        <InputOTPSlot char="0" />
        <InputOTPSlot char="0" />
      </InputOTPGroup>
    </div>
  ),
};
