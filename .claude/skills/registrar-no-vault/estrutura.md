# Estrutura do vault do Store Flow

```
Store Flow/
├── _Store Flow.md                índice: links rápidos (ClickUp, repo), decisões com data, mapa das pastas
├── 01 - Produto/                 visão, personas por papel, matriz de planos × funcionalidades, glossário
├── 02 - Regras de Negócio/       uma nota por assunto (Papéis e Tenancy, Planos e Controles, Estoque, Compras, Vendas, Financeiro, Onboarding...)
├── 03 - Fluxos/                  diagramas Mermaid (sessão e X-Store-Id, onboarding, compra → recebimento → estoque, mudança de plano, deploy)
├── 04 - Specs/                   AAAA-Www - Nome.md (criadas na segunda, ligadas à task do ClickUp)
├── 05 - Semanas/                 AAAA-Www.md (plano da segunda + retro do sábado)
├── 06 - Feedback/                _Inbox.md + Clientes/<Empresa>.md
├── 07 - Infra e Ambientes/       PostgreSQL local, GHCR, GitHub Environments, Cloudflare R2, variáveis por ambiente (só nomes)
├── 08 - Credenciais/             _Inventario.md (sem valores) + como rotacionar cada uma
├── 09 - Decisões/                ADRs: AAAA-MM-DD - decisão.md
├── 10 - Marca/                   marca e tokens do design system Nitro
├── 11 - Mapeamento E2E/          por papel: SUPER_ADMIN, ADMIN, MANAGER, EMPLOYEE
├── Assets/                       imagens, prints, logos
```

Os templates ficam em `templates/` desta skill.

## Repositório × vault
| Assunto | Onde fica |
|---|---|
| Papéis, tenancy, planos e controles, CI/CD, notas de tela | `docs/` do repo (versionado com o código); vault guarda o resumo de negócio |
| Specs, semanas, feedback, decisões, fluxos de negócio, inventário de credenciais | vault |
| Decisões de interface | `design-system/store-flow-backoffice/MASTER.md` |

## Onde ficam os valores das credenciais
Num gerenciador de senhas, um item por credencial, com o mesmo nome usado no inventário. A pasta `08 - Credenciais/` está em `permissions.deny` no `settings.json`: o Claude não a lê.
