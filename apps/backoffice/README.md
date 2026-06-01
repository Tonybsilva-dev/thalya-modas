# Store Flow Backoffice

Aplicacao Next.js responsavel pela interface operacional da loja.

## Ambiente

O login chama a API pela URL definida em `NEXT_PUBLIC_API_URL`.

```bash
NEXT_PUBLIC_API_URL=http://localhost:3333
```

Quando a variavel nao estiver definida, o client usa `http://localhost:3333`.

## Desenvolvimento

Execute o servidor local:

```bash
pnpm --filter @thalya-modas/backoffice dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Validacao

```bash
pnpm --filter @thalya-modas/backoffice lint
pnpm --filter @thalya-modas/backoffice build
```

O build precisa de acesso ao Google Fonts enquanto `next/font/google` estiver sendo usado.
