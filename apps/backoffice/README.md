# Store Flow Backoffice

Aplicação Next.js exclusiva do SUPER_ADMIN para administrar a plataforma.

## Segmento da plataforma

- `/backoffice`: contagens reais de empresas, filiais e usuários.
- `/backoffice/tenants`: busca, filtro e cadastro de empresas.
- `/backoffice/tenants/:tenantId`: responsável, nome, suspensão/reativação e cadastro de filiais.
- `/backoffice/users`: listagem paginada, cadastro de ADMIN e edição de contas e papéis.
- `/backoffice/settings`: conta administrativa e aparência.
- `/backoffice/plans`: planos, módulos e funcionalidades.

Configurações também inclui manutenção, kill switches globais e histórico.
O detalhe da empresa permite definir plano e exceções, com o acesso efetivo
por funcionalidade. Veja [planos e controles](../../docs/plans-and-controls.md).

O cadastro de empresa exige um ADMIN ativo como responsável. O cadastro de
ADMIN mantém a sessão atual do SUPER_ADMIN. Alterações de papel e status da
própria conta são desabilitadas na interface para evitar perda de acesso.

O proxy e o layout validam o usuário atual com a API. Outras roles recebem
uma página de acesso restrito. Os fluxos operacionais antigos permanecem no
repositório, com acesso bloqueado neste app até serem usados na futura plataforma.

## Ambiente

O login chama a API pela URL definida em `NEXT_PUBLIC_API_URL`.

```bash
NEXT_PUBLIC_API_URL=http://localhost:3333
```

Quando a variavel nao estiver definida, o client usa `http://localhost:3333`.

## Desenvolvimento

Execute o servidor local:

```bash
pnpm dev:backoffice
```

Abra [http://localhost:3001/backoffice](http://localhost:3001/backoffice).

## Validacao

```bash
pnpm --filter @store-flow/backoffice lint
pnpm --filter @store-flow/backoffice build
pnpm test:backoffice
```

O build precisa de acesso ao Google Fonts enquanto `next/font/google` estiver sendo usado.
