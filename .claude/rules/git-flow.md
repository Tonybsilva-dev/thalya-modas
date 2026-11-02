# Branches, commits e deploy

## Branches

```
feature/* | fix/* | chore/* | infra/*  ──PR──▶  preview-interface (branch padrão, protegida por "CI Gate")
```

- Toda branch nova nasce de `preview-interface` atualizada (`git switch preview-interface && git pull`), salvo instrução explícita do usuário.
- Antes de criar branch, diga de qual branch ela vai derivar. Se houver trabalho não enviado em outra branch, pergunte.
- Prefixos: `feature/` funcionalidade, `fix/` correção, `infra/` CI, deploy e ambiente, `chore/` manutenção.
- Nunca faça push direto em `preview-interface` sem o usuário pedir. Branches `dependabot/*` são do bot: não edite.

## Commits (Conventional Commits, validado por commitlint no hook `commit-msg`)

- Formato `tipo(escopo): descrição` em inglês, imperativo, minúsculo, sem ponto final. Ex.: `feat(inventory): add barcode lookup to stock adjustments`.
- Tipos: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `ci`, `perf`. Escopos usados: `api`, `backoffice`, `ui`, `inventory`, `suppliers`, `catalog`, `plans`, `auth`, `navigation`.
- Um commit por mudança coerente. Descreva o efeito para quem usa, não o arquivo alterado.
- O hook `pre-commit` (em `apps/api/.husky`) roda `npm run qa` na API (format/lint, testes alterados, typecheck). Se falhar, corrija. Nunca use `--no-verify`.
- **Nunca** adicione `Co-Authored-By` ou qualquer atribuição (o `settings.json` já desliga a automática).

## Deploy

- `ci.yml`: qualidade, testes unitários, integração com PostgreSQL e builds, consolidados em `CI Gate`. `security.yml`: revisão de dependências e CodeQL. `deploy-api.yml`: manual, publica imagem imutável no GHCR e aplica `prisma migrate deploy` no ambiente escolhido.
- Mudou contrato entre API e backoffice: **a API sobe primeiro**, o backoffice depois. Avise o usuário dessa ordem.
- Migration de release é sempre `migrate deploy`, nunca `migrate dev`. Faça backup local antes de migration destrutiva (`.local-backups/`).
- Depois do push, liste o que precisa ser validado manualmente em preview.
