# Análise do cadastro de fornecedores

Revisão de 27/10/2026. Análise de código, contratos HTTP, persistência e testes existentes. Nenhuma regra de negócio foi alterada nesta revisão. Inspeção visual/E2E não realizada.

## Resultado

O cadastro está funcional, mas ainda não deve ser considerado fechado. A base de persistência e CRUD está pronta; os principais ajustes estão na coerência entre interface/API, integridade sob concorrência e comportamento operacional.

## O que está implementado

- Listagem com busca, filtro de situação e paginação; resumo operacional e exportação CSV.
- Criação de fornecedor sem exigir vínculo com produto ou compra. Contatos são opcionais e podem ser enviados junto com o cadastro, em uma única criação aninhada no PostgreSQL.
- Edição e inativação/reativação, com nome, documento, contatos, categoria, prazos, pedido mínimo e observações.
- Contatos por finalidade (pedidos, entrega, financeiro), com edição, exclusão e indicação de principal.
- Escopo de filial no servidor, autenticação e bloqueios de funcionalidade/plano.
- Documento único por filial no banco. A verificação sequencial de duplicidade apresenta erro de domínio.
- Exclusão bloqueada quando a consulta encontra pedidos de compra ou recebimentos; orientação para inativar.
- Campo monetário com prefixo R$ do Input publicado do TrinketOS e parser que preserva centavos.
- Confirmação ao sair pelo botão de cancelamento e aviso de fechamento da janela com alterações não salvas.

## Achados prioritários

### 1. Interface e API têm regras diferentes para o mesmo cadastro

**Confirmado por código.** A tela exige CNPJ válido, e-mail, telefone, categoria, prazos e pedido mínimo positivo. A API exige somente nome; documento, telefone, e-mail e condições são opcionais. Documento no servidor é validado apenas por comprimento, e pedido mínimo continua sendo texto sem validação monetária.

Consequência: um cadastro mínimo válido pela API não pode ser salvo pela interface sem preencher dados adicionais. Valores/documentos inválidos também podem entrar por outro cliente da API. O cliente normaliza documento/telefone, mas o servidor não estabelece uma representação canônica.

Referências: `apps/backoffice/src/features/dashboard/suppliers/domain/supplier-flow-schemas.ts:18`; `apps/api/src/app/http/routes/catalog.routes.ts:113`; `apps/backoffice/src/features/dashboard/suppliers/application/suppliers-api.ts`.

**Correção proposta:** definir um contrato único para cadastro mínimo e enriquecimento posterior. Documento e condições comerciais, se opcionais, devem ser validados quando preenchidos; aceitar ausência de pedido mínimo ou zero quando não houver restrição comercial. Decidir explicitamente o atendimento a fornecedor pessoa física. Fornecedor avulso significa ausência de vínculo obrigatório com produto/compra, não dispensa validação dos dados informados.

### 2. Inativação não impede novas compras no servidor

**Confirmado por código.** A interface esconde a ação de novo pedido para fornecedor inativo, mas `createPurchaseOrder` chama `ensureSupplier`, que verifica existência e filial, sem verificar situação. O servidor aceita o vínculo com um fornecedor inativo.

Referências: `apps/api/src/core/infra/persistence/prisma/prisma-catalog-repository.ts:629` e `:867`; `apps/backoffice/src/features/dashboard/suppliers/presentation/suppliers-route.tsx`, ação de novo pedido.

**Correção proposta:** bloquear novas compras para inativos no servidor e na interface, preservando consulta e conclusão de operações anteriores conforme suas regras. Não impedir automaticamente recebimento de pedido antigo só porque o fornecedor foi inativado.

### 3. Exclusão tem proteção sequencial, mas não uma garantia concorrente suficiente

**Risco identificado por análise estática; corrida não reproduzida.** `deleteSupplier` consulta a quantidade de pedidos/recebimentos e executa o delete depois, sem uma transação/trava que cubra também novas compras. As relações de compra/recebimento com fornecedor usam `onDelete: Cascade`.

Consequência possível: uma compra inserida entre a consulta e a exclusão pode ser removida por cascata, contrariando a intenção de preservar histórico.

Referências: `apps/api/src/core/infra/persistence/prisma/prisma-catalog-repository.ts:241`; `apps/api/prisma/schema.prisma:352` e `:407`.

**Correção proposta:** proteger o histórico por restrição no banco e operação transacional. Preferir inativação no uso normal; exclusão definitiva fica para cadastro sem histórico, com permissão específica.

### 4. Contato principal não tem unicidade garantida no banco

**Risco identificado por análise estática; corrida não reproduzida.** A criação inicial rejeita dois principais no mesmo payload. As operações individuais removem o indicador dos demais dentro de uma transação, mas não há índice parcial nem trava por fornecedor garantindo unicidade entre requisições simultâneas.

Referências: `apps/api/src/app/http/routes/catalog.routes.ts`, `createSupplierSchema`; `apps/api/src/core/infra/persistence/prisma/prisma-catalog-repository.ts:269` e `:342`; modelo `SupplierResponsible` em `apps/api/prisma/schema.prisma`.

**Correção proposta:** índice único parcial por fornecedor/filial e tratamento transacional da troca. Definir também o comportamento quando o principal é inativado ou excluído, sem promover outro contato silenciosamente sem regra acordada.

### 5. Verificação de próxima página calcula o deslocamento errado

**Confirmado por código e cálculo.** A lista usa, por exemplo, 20 registros por página; a consulta de próxima página muda para `perPage: 1`, mantendo `page + 1`. Como o servidor calcula `skip = (page - 1) * perPage`, a verificação da página 2 consulta o segundo registro, em vez do vigésimo primeiro. Com exatamente 20 fornecedores, o botão pode oferecer uma próxima página vazia.

Referências: `apps/backoffice/src/features/dashboard/suppliers/presentation/suppliers-route.tsx:108`; `apps/api/src/core/infra/persistence/prisma/prisma-catalog-repository.ts:882`.

**Correção proposta:** resposta paginada com total/totalPages ou busca adicional mantendo o mesmo tamanho de página.

### 6. Referência de suporte se perde nos erros do formulário

**Confirmado por código.** `getApiErrorMessage` converte `ApiRequestError` em uma string. Os estados de erro do formulário, contatos e exclusão mostram a mensagem, sem o componente de referência já existente no projeto.

Referência: `apps/backoffice/src/features/dashboard/suppliers/presentation/supplier-flow-routes.tsx:121`.

**Correção proposta:** preservar o erro estruturado e apresentar código/referência copiável com `ErrorReference`, mantendo a mensagem de validação junto ao campo quando aplicável.

## Ajustes complementares

- **Permissões:** as rotas usam o preHandler genérico de catálogo. Não há distinção por operação entre funcionário, gerente e administrador. Definir quem pode cadastrar, editar, inativar e excluir; isolamento de filial não substitui essa política.
- **Histórico limitado:** formulário e painel carregam somente os primeiros 100 pedidos/recebimentos do fornecedor e calculam indicadores locais. Não apresentar esses resultados como histórico completo sem paginação ou agregação no servidor.
- **Moeda persistida como texto:** `minimumOrder` permite representações diferentes e é exibido sem formatação uniforme em alguns detalhes. Padronizar ausência, zero e valor positivo; preferir centavos/Decimal ao evoluir o contrato.
- **Modal próprio:** contatos/exclusão mantêm `ModalOverlay` manual com focus trap e Escape próprios, em vez do Dialog compartilhado. O fechamento não recebe estado de gravação; migrar para o componente do design system e impedir fechamento durante mutação. Proteger alterações não salvas também na navegação interna, além do botão Cancelar e do fechamento da janela.
- **CSV:** exportador escapa aspas, mas não neutraliza conteúdo de texto iniciado por prefixos de fórmula. Tratar isso antes de recomendar abertura do arquivo em planilhas.
- **Duplicidade concorrente:** a unique do documento protege o banco, mas o repositório não traduz a violação concorrente `P2002` em erro de negócio. Tratar o conflito com uma mensagem consistente.
- **Escopo comercial:** categorias e prazos são listas fixas orientadas a moda; confirmar se atendem o varejo pretendido antes de chamar o cadastro de genérico. Não adicionar dados bancários, consulta externa de documento ou envio de e-mails apenas para aumentar o formulário.

## Ordem sugerida de fechamento

1. Contrato de cadastro mínimo, normalização/validação no servidor e política de permissões.
2. Inativação, proteção de exclusão e unicidade de contato principal.
3. Paginação, totais/histórico e referência de suporte.
4. Modal compartilhado, revisão de teclado/temas/movimento reduzido, navegação com rascunho e CSV.

## Verificação executada

`RUN_PRISMA_INTEGRATION_TESTS=true pnpm --filter @store-flow/api exec vitest run tests/integration/catalog/catalog.routes.spec.ts tests/integration/catalog/catalog-prisma.spec.ts --fileParallelism=false --reporter=dot`

Resultado: **2 arquivos, 26 testes aprovados**. São testes de catálogo, incluindo fornecedores, contatos, compras, produtos e estoque; não são 26 testes exclusivos de fornecedor. Cobrem operações sequenciais e isolamento, mas não comprovam as corridas acima nem a interação visual do formulário. Não foram alterados códigos de aplicação ou dados reais para esta análise; os testes usam suas próprias fixtures e limpeza.


## Seguimento: isolamento

A primeira etapa de reforço do catálogo foi implementada após esta análise: contexto obrigatório de tenant/filial, filtros nas gravações, validação de recebimento contra o fornecedor do pedido e guards no PostgreSQL para escopo e vínculos. Cobertura, testes e limites constam em [tenant-isolation.md](tenant-isolation.md). Isso não encerra as demais decisões deste relatório, como cadastro mínimo, fornecedor inativo, permissões por ação, paginação e unicidade concorrente do principal.
