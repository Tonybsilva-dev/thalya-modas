# CI/CD e proteção de branches

## Pipelines

O repositório possui três workflows com responsabilidades separadas:

- `CI`: qualidade, testes unitários, integrações reais com PostgreSQL e builds
  por projeto. O job final `CI Gate` consolida todos os resultados.
- `Security`: revisão de dependências novas em pull requests e análise CodeQL
  em pull requests, pushes, merge queue e execução semanal.
- `Deploy API`: publicação manual de uma imagem imutável no GHCR e aplicação
  das migrations no ambiente selecionado.

As actions externas são fixadas por SHA. O Node.js vem de `.node-version`, a
versão do pnpm vem do `packageManager` raiz e a instalação usa sempre
`--frozen-lockfile`.

Os relatórios de cobertura e as saídas de build da API e do Storybook ficam
disponíveis como artifacts por sete dias.

## Regra recomendada para `preview-interface`

Em **Settings > Rules > Rulesets**, crie uma ruleset para a branch padrão com:

1. pull request obrigatório;
2. conversas resolvidas antes do merge;
3. exclusão da branch e force push bloqueados;
4. check obrigatório `CI Gate`;
5. branch atualizada antes do merge ou merge queue habilitada;
6. pelo menos uma aprovação e descarte de aprovações antigas quando houver
   duas ou mais pessoas com permissão de revisão.

O `CI Gate` é o contrato estável da proteção de branch. Os jobs internos podem
ser reorganizados sem exigir alteração da ruleset, desde que continuem como
dependências desse gate.

## Ambientes de release

Crie os GitHub Environments `staging` e `production`. Cada um precisa do secret
`DATABASE_URL`. Para `production`, configure aprovação obrigatória, restrição à
branch padrão e impeça autoaprovação quando houver outro mantenedor.

O workflow publica:

```text
ghcr.io/tonybsilva-dev/thalya-modas-api:<image_tag>
ghcr.io/tonybsilva-dev/thalya-modas-api:sha-<commit>
```

O `image_tag` deve ser imutável, preferencialmente uma versão SemVer como
`v1.2.3`; o workflow consulta o GHCR e rejeita uma tag que já exista. Depois da
publicação e das migrations, a plataforma de hospedagem deve fazer o rollout
usando o digest registrado no resumo da execução. Esse último passo depende do
provedor de infraestrutura e não é presumido pelo repositório.

## Operação segura

- O CI nunca usa o banco de staging ou produção.
- Migrations de release usam `prisma migrate deploy`, nunca `migrate dev`.
- Um release de produção não cancela outro em andamento.
- A imagem roda como usuário sem privilégios, possui healthcheck e contém
  somente dependências de produção.
- Secrets pertencem aos GitHub Environments e não devem ser adicionados ao
  workflow ou ao repositório.
