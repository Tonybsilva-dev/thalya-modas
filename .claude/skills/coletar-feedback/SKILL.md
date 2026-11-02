---
name: coletar-feedback
description: Registra feedback de cliente ou lojista do Store Flow (colado de WhatsApp, DM, e-mail, ligação ou print) de forma estruturada no Obsidian, liga ao cliente e ao ClickUp quando couber. Use sempre que o usuário colar ou contar um retorno de cliente.
argument-hint: "[texto do feedback ou resumo]"
---

# Coletar feedback

Feedback: $ARGUMENTS

1. **Limpe** o texto: tire telefone, e-mail, CPF/CNPJ, nome completo de terceiros e qualquer credencial. Mantenha o nome da loja e o primeiro nome de quem falou, se o usuário quiser.
2. **Classifique:** tipo (bug, pedido, dúvida, elogio, reclamação), área (catálogo, estoque, compras, vendas, financeiro, planos, usuários, onboarding, login), papel de quem falou (ADMIN, MANAGER, EMPLOYEE), severidade para o cliente (bloqueia, atrapalha, incomoda).
3. **Registre** no Obsidian:
   - Linha nova em `06 - Feedback/_Inbox.md`: data · loja · tipo · área · resumo em uma frase · citação curta.
   - Se a loja/empresa tem nota em `06 - Feedback/Clientes/`, acrescente lá também.
4. **Encaminhe:**
   - Bug que bloqueia: crie task no ClickUp com `[Área · Alta]` (via `clickup-scout`) e avise que pode entrar hoje.
   - Pedido igual a outro já registrado: some a contagem de pedidos na task existente (é o que libera a entrada no planejamento).
   - Resto: fica no inbox para a triagem de segunda.
5. Responda com o registro feito e, se for útil, um rascunho de resposta ao cliente.
