import type { Meta, StoryObj } from "@storybook/react-vite";
import { InputOTP } from "@store-flow/ui";
const meta = { title: "Components/Forms/OTP", parameters: { layout: "centered" } } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
export const Empty: Story = { render: () => <section aria-label="Código de verificação"><p className="mb-2 text-sm">Código de verificação</p><InputOTP maxLength={6} groupSize={3} /></section> };
export const Filled: Story = { render: () => <section aria-label="Código de verificação"><p className="mb-2 text-sm">Código de verificação</p><InputOTP maxLength={6} groupSize={3} defaultValue="123456" /></section> };
