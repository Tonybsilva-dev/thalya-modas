---
name: changelog
description: Transforma o que foi entregue no Store Flow em entrada de changelog em docs/changelog.md e, se pedido, texto de anúncio para lojistas. Use quando o usuário pedir "resuma as alterações", "changelog", "o que mudou esta semana", "texto para anunciar".
argument-hint: "[período, ex.: 'semana' ou 'desde 2026-10-01']"
---

# Changelog

Período: $ARGUMENTS (padrão: últimos 7 dias)

## 1. Levantar
`git log --since=<período> --no-merges --format="%s"`. Agrupe por efeito para o usuário final (lojista e operador), não por pacote. Descarte `refactor`, `chore`, `ci`, `test` sem efeito visível. Os tipos do Conventional Commits ajudam: `feat` → Novidades, `fix` → Correções, `perf` → Melhorias.

## 2. Escrever em `docs/changelog.md` (entrada nova no topo)
```
## AAAA-Www · <título curto com o maior benefício>
Parágrafo de abertura com o que mudou para o cliente.
**Novidades** · **Melhorias** · **Correções** (itens começam pelo efeito: "Agora você pode...", "O fornecedor passa a...")
```
Mudança que exige ação do cliente ou do SUPER_ADMIN (migration, variável de ambiente, plano a atribuir) vem primeiro, em negrito, com o caminho na tela.

## 3. Anúncio (só se pedido)
Texto curto para lojista: dor → o que mudou → como usar. Honesto sobre o que ainda falta. Não prometa funcionalidade que não foi publicada.

## 4. Regras
Correção de segurança: diga que foi reforçada, sem detalhar a falha. Se a mudança depende de deploy da API antes do backoffice, registre a ordem.
