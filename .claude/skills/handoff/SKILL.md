---
name: handoff
description: Salva o estado da sessão atual do Store Flow num arquivo de passagem para continuar numa sessão nova sem perder contexto. Use antes de /clear, ao trocar de assunto, quando o contexto passar de ~60%, ou quando o usuário disser "vamos parar por hoje".
---

# Handoff

Escreva `.claude/handoff/<AAAA-MM-DD>-<slug>.md` com no máximo 60 linhas:

1. **Objetivo** da sessão em uma frase.
2. **Feito**: lista com branch e commit (hash curto).
3. **Em andamento**: o que estava sendo mexido, arquivos e o próximo passo exato.
4. **Decisões tomadas** e o motivo (o que não está no código).
5. **Pendências do usuário**: PR para revisar, migration para aplicar, verificação visual, variável de ambiente para configurar (só o nome).
6. **Como retomar**: o prompt pronto para colar na próxima sessão, começando com "Leia .claude/handoff/<arquivo> e continue de...".

Se houver decisão de negócio nova, sugira registrar também na nota do Obsidian (`09 - Decisões/`).
Ao terminar, diga ao usuário que pode rodar `/clear`.
