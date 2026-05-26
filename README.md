# Thalya Modas

Monorepo da plataforma Thalya Modas orquestrado com pnpm workspaces.

## Estrutura

```txt
.
├── apps/
│   └── api/      # Backend Fastify/TypeScript
│   └── docs/     # Storybook dos pacotes de UI
├── packages/
│   └── ui/       # Componentes React/Tailwind no padrão shadcn/ui
└── pnpm-workspace.yaml
```

## Comandos

```bash
pnpm install
pnpm dev
pnpm dev:api
pnpm dev:docs
pnpm storybook
pnpm typecheck
pnpm test
pnpm build
```

Para executar comandos em um pacote específico:

```bash
pnpm --filter @thalya-modas/api <script>
```

## UI

O pacote `@thalya-modas/ui` contém os componentes Nitro em React, Tailwind CSS e padrões compatíveis com shadcn/ui.

Componentes disponíveis:

```txt
Accordion, Alert, Avatar, Badge, Breadcrumb, Button, IconButton, Card,
Checkbox, DataTable, Dialog, DropdownMenu, Input, InputOTP, Label, List,
Pagination, Progress, RadioGroup, Select, Sidebar, Switch, Table, Tabs,
Textarea, Tooltip
```
