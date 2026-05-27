# TODO - Funcionalidades públicas do Backoffice

Este arquivo mapeia as rotas públicas existentes em `apps/backoffice` e traduz cada tela em funcionalidades para implementar em `apps/api` usando persistência in-memory e testes automatizados.

Escopo inicial: somente rotas públicas do backoffice. Rotas protegidas do dashboard ficam para outro mapeamento.

## Convenções

- Manter arquitetura atual da API: `domain`, `application/use-cases`, `infra/persistence/in-memory`, `app/http/routes` e testes em `tests/integration`.
- Toda funcionalidade nova deve ter repositório in-memory quando houver estado temporário.
- Toda rota deve ter schema Zod, documentação Swagger e testes de integração.
- Fluxos temporários devem ser determinísticos em teste, mas sem expor código sensível em respostas de produção.
- Para preview da interface, seedar ao menos um usuário gerente compatível com o login do backoffice.

## Rotas públicas encontradas no Backoffice

| Rota | Tela | Status de API |
| --- | --- | --- |
| `/` | Redireciona para `/auth/login` | Não precisa de API |
| `/login` | Redireciona para `/auth/login` | Não precisa de API |
| `/auth/login` | Login público | Parcial: existe `POST /auth/login` |
| `/recover-password` | Solicitar recuperação de senha | Pendente |
| `/recover-password/code` | Validar código temporário | Pendente |
| `/recover-password/reset` | Redefinir senha | Pendente |
| `/recover-password/success` | Confirmação visual | Não precisa de API própria |

## `/auth/login`

### Funcionalidades da tela

- Informar e-mail.
- Informar senha.
- Marcar/desmarcar “Remember me”.
- Entrar no dashboard ao autenticar.
- Acessar recuperação de senha.
- Ação visual de SSO seguro.

### API necessária

- [ ] Revisar `POST /auth/login` para retornar payload compatível com o backoffice:
  - `user.id`
  - `user.name`
  - `user.email`
  - `user.role`
  - `user.accountStatus`
  - `token`
  - opcional: `expiresIn`
- [ ] Adicionar seed in-memory para usuário de preview:
  - e-mail sugerido: `ana@thalyamodas.com`
  - senha sugerida: `password`
  - role de gerente/admin compatível com rotas `/manager/dashboard`.
- [ ] Definir comportamento de “Remember me”:
  - receber `rememberMe?: boolean`
  - ampliar expiração do token quando verdadeiro, se aplicável.
- [ ] Decidir se o backoffice usará token em resposta JSON ou cookie httpOnly.
- [ ] Manter mensagens de erro genéricas para credenciais inválidas.

### Testes

- [ ] Login com credenciais válidas de gerente retorna `200`, usuário e token.
- [ ] Login com `rememberMe: true` retorna expiração maior ou flag validável.
- [ ] Login com e-mail inexistente retorna `401`.
- [ ] Login com senha incorreta retorna `401`.
- [ ] Login com e-mail inválido retorna `400`.
- [ ] Login com senha vazia retorna `400`.
- [ ] Login de conta inativa/suspensa continua bloqueado.

## `/auth/login` - SSO seguro

### Funcionalidades da tela

- Botão “Continue with secure SSO”.
- Hoje é apenas ação visual; não há provedor configurado.

### API necessária

- [ ] Manter como pendente até existir provedor real.
- [ ] Opcional para preview: criar endpoint mock `POST /auth/sso/start`.

### Testes, se endpoint mock for criado

- [ ] Retorna `501` ou `202` com mensagem explícita de integração não configurada.
- [ ] Não cria sessão real sem provedor.

## `/recover-password`

### Funcionalidades da tela

- Informar e-mail usado no dashboard.
- Enviar código temporário.
- Voltar para login.

### API necessária

- [ ] Criar `POST /auth/password-recovery/request`.
- [ ] Body:
  - `email: string`
- [ ] Comportamento:
  - normalizar e-mail.
  - se usuário existir e puder recuperar senha, criar código temporário.
  - armazenar em repositório in-memory de recuperação.
  - definir expiração de 10 minutos.
  - invalidar códigos anteriores do mesmo usuário/e-mail.
  - responder sempre de forma neutra para não revelar se o e-mail existe.
- [ ] Para ambiente de teste/preview, permitir recuperar o código por meio controlado:
  - opção preferida: expor código apenas no repositório/factory de teste.
  - opção alternativa: retornar `debugCode` somente em `NODE_ENV=test`.

### Testes

- [ ] Solicitação com e-mail válido existente retorna `202`.
- [ ] Solicitação com e-mail válido inexistente retorna `202` sem criar reset utilizável.
- [ ] Solicitação com e-mail inválido retorna `400`.
- [ ] Nova solicitação invalida código anterior do mesmo e-mail.
- [ ] Código gerado possui expiração de 10 minutos.

## `/recover-password/code`

### Funcionalidades da tela

- Digitar código de 6 dígitos.
- Confirmar código.
- Reenviar código após contagem regressiva.

### API necessária

- [ ] Criar `POST /auth/password-recovery/verify-code`.
- [ ] Body:
  - `email: string`
  - `code: string`
- [ ] Response:
  - `resetToken: string`
  - `expiresIn: number`
- [ ] Comportamento:
  - aceitar apenas código com 6 dígitos.
  - validar código ativo e não expirado.
  - limitar tentativas inválidas.
  - ao validar, gerar `resetToken` temporário.
  - marcar código como verificado/usado para evitar replay.
- [ ] Criar `POST /auth/password-recovery/resend-code`.
- [ ] Body:
  - `email: string`
- [ ] Comportamento:
  - respeitar cooldown, inicialmente 30 segundos.
  - invalidar código anterior quando reenviar.

### Testes

- [ ] Código válido retorna `200` com `resetToken`.
- [ ] Código inválido retorna `401` ou `400`, conforme padrão da API.
- [ ] Código expirado retorna erro.
- [ ] Código já usado não pode ser reutilizado.
- [ ] Após muitas tentativas inválidas, fluxo é bloqueado temporariamente.
- [ ] Reenvio antes do cooldown retorna erro de regra de negócio.
- [ ] Reenvio após cooldown cria novo código e invalida o anterior.

## `/recover-password/reset`

### Funcionalidades da tela

- Informar nova senha.
- Confirmar nova senha.
- Exibir requisito mínimo: 8 caracteres com número e letra maiúscula.
- Atualizar senha.

### API necessária

- [ ] Criar `POST /auth/password-recovery/reset`.
- [ ] Body:
  - `resetToken: string`
  - `password: string`
  - `passwordConfirmation: string`
- [ ] Comportamento:
  - validar token temporário ativo e não expirado.
  - validar confirmação de senha.
  - validar regra de força mínima.
  - gerar hash da nova senha.
  - atualizar usuário no repositório in-memory.
  - invalidar todos os códigos/tokens pendentes daquele usuário.
  - opcional: retornar token de login automático ou exigir login manual.

### Testes

- [ ] Reset com token válido e senhas iguais retorna `200`.
- [ ] Senhas diferentes retornam `400`.
- [ ] Senha fraca retorna `400`.
- [ ] Token inválido retorna erro.
- [ ] Token expirado retorna erro.
- [ ] Token já usado não pode ser reutilizado.
- [ ] Após reset, login com senha antiga falha.
- [ ] Após reset, login com senha nova funciona.

## `/recover-password/success`

### Funcionalidades da tela

- Confirmar que a senha foi atualizada.
- Voltar para dashboard.
- Voltar para login.

### API necessária

- [ ] Nenhuma rota própria.
- [ ] Depende do sucesso de `POST /auth/password-recovery/reset`.

### Testes

- [ ] Coberto indiretamente pelos testes de reset.

## Estrutura sugerida na API

- [ ] `src/core/domain/entities/password-recovery-token.ts`
- [ ] `src/core/domain/repositories/password-recovery-repository.ts`
- [ ] `src/core/application/use-cases/auth/request-password-recovery.ts`
- [ ] `src/core/application/use-cases/auth/verify-password-recovery-code.ts`
- [ ] `src/core/application/use-cases/auth/resend-password-recovery-code.ts`
- [ ] `src/core/application/use-cases/auth/reset-password.ts`
- [ ] `src/core/infra/persistence/in-memory/in-memory-password-recovery-repository.ts`
- [ ] Atualizar `src/app/http/routes/auth.routes.ts`
- [ ] Atualizar `src/app/http/container.ts`
- [ ] Criar testes em `tests/integration/auth/password-recovery.spec.ts`

## Ordem recomendada de implementação

1. Ajustar/seedar login público para preview.
2. Criar entidade/repositório in-memory de recuperação de senha.
3. Implementar solicitação de recuperação.
4. Implementar validação de código e reenvio.
5. Implementar reset de senha.
6. Cobrir fluxo completo com teste de integração ponta a ponta.
