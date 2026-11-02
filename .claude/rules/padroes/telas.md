---
paths:
  - "apps/backoffice/app/**/*.tsx"
  - "apps/backoffice/src/**/*.tsx"
  - "packages/ui/src/**/*.tsx"
  - "apps/docs/src/**"
---

# Telas, design system e experiência

Fonte de verdade visual: DS Nitro (`packages/ui`, documentado no Storybook em `apps/docs`) e `design-system/store-flow-backoffice/MASTER.md`. Leia o MASTER antes de criar ou padronizar tela.

## Princípios (usados no escopo de segunda e na revisão)
- **Menos cliques:** a ação principal da tela está a no máximo 1 clique; tarefas frequentes do operador em até 3. Conte os cliques na spec.
- **Clareza visual:** uma ação primária por tela, hierarquia por tamanho e peso, não por cor. Estado com cor **e** texto (nunca só cor).
- **Contexto no lugar:** o que o operador precisa para decidir aparece na mesma tela (ex.: estoque atual ao lado do pedido de compra), sem abrir outra página.
- **Padrão de mercado como ponto de partida:** se os ERPs e PDVs de varejo (Bling, Tiny, Omie, Linx, Lightspeed...) fazem igual, há um motivo. Divergir é decisão registrada em `09 - Decisões/` no Obsidian.

## Regras do DS (do MASTER)
- Bordas retas (`rounded-none`), main `w-full` sem `max-w`, sidebar com grupos Operação / Produto / Plataforma.
- Controles com no mínimo 44px de altura, foco visível na cor primária, rótulo associado ao campo.
- Select sempre o composto do DS (Select/Trigger/Content/Item). Data sempre `Calendar` do DS em `Dialog`, nunca `input type=date` nativo. Nada de select nativo.
- Cadastro e edição em `Dialog` acessível (cancelar, foco controlado, rolagem dentro de 90dvh). Ação destrutiva ou global pede confirmação; mudança de plano/controle pede motivo.
- Aba ativa, busca, filtros e página na URL (`nuqs`); `?create=1` abre o formulário de criação. Busca digitada dispara após 250ms.
- Estados: carregando (skeleton ou indicador), erro com "tentar novamente" e `traceId`, vazio com o próximo passo explicado, sucesso confirmado.
- Tabelas rolam dentro do próprio contêiner. Grids adaptam colunas por breakpoint. Respeitar tema claro/escuro e movimento reduzido.
- Responsivo mobile-first: confira 375, 768, 1024 e 1440 px. Se não houver navegador, diga que a verificação visual **não** foi feita.

## Referências vivas
Listas e CRUD: `features/dashboard/suppliers`. Plataforma, abas e auditoria: `features/backoffice/presentation` (`tenant-detail-page`, `audit-page`, `plans-page`).
