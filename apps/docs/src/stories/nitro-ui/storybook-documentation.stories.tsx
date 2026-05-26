import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "Nitro UI/Storybook Documentation",
  parameters: {
    layout: "padded",
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  render: () => (
    <article className="mx-auto grid max-w-4xl gap-8 text-foreground">
      <header className="grid gap-3">
        <p className="text-sm font-medium text-primary">Nitro UI</p>
        <h1 className="text-3xl font-semibold tracking-normal">
          Storybook Documentation
        </h1>
        <p className="max-w-3xl text-base leading-7 text-muted-foreground">
          Organização baseada na seção{" "}
          <code className="bg-muted px-1.5 py-0.5 text-sm">
            storybook-documentation-layout
          </code>{" "}
          do arquivo{" "}
          <code className="bg-muted px-1.5 py-0.5 text-sm">
            pencil-nitro.pen
          </code>
          .
        </p>
      </header>

      <section className="grid gap-4">
        <h2 className="text-xl font-semibold">Estrutura</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {[
            ["Components / Actions", "Button, IconButton"],
            [
              "Components / Forms",
              "Input, Select, Textarea, OTP, Checkbox, Radio, Switch",
            ],
            ["Components / Feedback", "Alert, Badge, Empty State, Progress, Tooltip"],
            ["Components / Navigation", "Breadcrumb, Tabs, Pagination, List"],
            [
              "Components / Data Display",
              "Card, Avatar, Table, DataTable, Accordion",
            ],
            ["Components / Overlays", "Dialog, DropdownMenu"],
            ["Components / Layout", "Sidebar"],
          ].map(([title, description]) => (
            <div
              className="rounded-none border border-border bg-card p-4"
              key={title}
            >
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4">
        <h2 className="text-xl font-semibold">Regras</h2>
        <ul className="grid gap-2 text-sm leading-6 text-muted-foreground">
          <li>Cada página documenta um componente ou uma família muito coesa.</li>
          <li>
            Variações visuais não devem duplicar a mesma composição sem
            diferenciação clara.
          </li>
          <li>Componentes específicos de domínio ficam fora do Nitro base.</li>
          <li>
            Tokens seguem nomenclatura shadcn/ui com estética Nitro.
          </li>
        </ul>
      </section>

      <section className="grid gap-4">
        <h2 className="text-xl font-semibold">Motion</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Os padrões de animação ficam em{" "}
          <code className="bg-muted px-1.5 py-0.5 text-sm">
            packages/ui/src/tokens/motion.css
          </code>
          .
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          {[
            ["--duration-instant", "80ms"],
            ["--duration-fast", "120ms"],
            ["--duration-base", "180ms"],
            ["--duration-enter", "220ms"],
            ["--duration-overlay", "260ms"],
            ["--duration-progress", "300ms"],
            ["--delay-stagger", "40ms"],
          ].map(([token, value]) => (
            <div
              className="flex items-center justify-between border border-border bg-card px-3 py-2 text-sm"
              key={token}
            >
              <code>{token}</code>
              <span className="text-muted-foreground">{value}</span>
            </div>
          ))}
        </div>
      </section>
    </article>
  ),
};
