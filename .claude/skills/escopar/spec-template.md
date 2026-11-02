---
tipo: spec
status: rascunho | aprovada | implementada
semana: AAAA-Www
clickup: <link da task>
apps: [api, backoffice, ui]
plano: <modulo.funcionalidade> | base do produto
escopo-de-dados: empresa (tenantId) | filial (storeId)
---

# <Nome da funcionalidade>

## Problema
Quem sente, em que momento, o que perde hoje. Citar o feedback de origem (cliente, data).

## Como o mercado resolve
| Produto | Como faz | O que aproveitamos | O que evitamos |
|---|---|---|---|

## Proposta
Resumo em 3 frases.

### Fluxo por papel
| Papel | Passos | Cliques |
|---|---|---|

Esboço da tela (texto ou link de imagem em `Assets/`).

## Plano e módulos (SUPER_ADMIN)
- Chave: `modulo.nome` · Módulo:
- Rótulo para o lojista:
- Descrição para o lojista:
- Ligada no plano Padrão: sim | não · Disponível (`available`): sim | em desenvolvimento
- Se for base do produto, por quê:

## Contrato
| Método | Caminho | Papéis | Funcionalidade (`operationalFeature`) | Resumo (OpenAPI) |
|---|---|---|---|---|

Schemas Zod, erros `SF-*`, migration Prisma, impacto em dados existentes, auditoria.

## Regras de negócio
Numeradas. Cada uma vira teste.

## Testes
| Caso | Tipo (unit/integração) | Resultado esperado |
|---|---|---|

## Observabilidade
Logs de negócio, métricas, o que indica sucesso.

## Fora do escopo

## Critérios de aceite
- [ ]

## Histórico
- AAAA-MM-DD: criada.
