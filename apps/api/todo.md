# TODO - Funcionalidades públicas do Backoffice

Este arquivo mapeia as rotas públicas existentes em `apps/backoffice` e traduz cada tela em funcionalidades para implementar em `apps/api` usando persistência in-memory e testes automatizados.

Escopo inicial: somente rotas públicas do backoffice. Rotas protegidas do dashboard ficam para outro mapeamento.

## Convenções

- Manter arquitetura atual da API: `domain`, `application/use-cases`, `infra/persistence/in-memory`, `app/http/routes` e testes em `tests/integration`.
- Toda funcionalidade nova deve ter repositório in-memory quando houver estado temporário.
- Toda rota deve ter schema Zod, documentação Swagger e testes de integração.
- Fluxos temporários devem ser determinísticos em teste, mas sem expor código sensível em respostas de produção.
- Para preview da interface, seedar ao menos um usuário gerente compatível com o login do backoffice.
- Antes de criar implementação Prisma/Postgres, a funcionalidade precisa existir e passar em testes usando repositórios in-memory.
- Kill switches devem ser validados na camada de aplicação/use case, antes de efeitos colaterais como gerar token, criar código, enviar e-mail ou gravar em banco.

## Estratégia de kill switches

### Recomendação

Usar kill switches por módulo de funcionalidade, carregados por configuração de ambiente e expostos ao container da aplicação por um `FeatureFlagService` simples.

O fluxo recomendado para cada funcionalidade é:

1. Implementar domínio, use case e repositório in-memory.
2. Cobrir comportamento feliz, erros e kill switch com testes.
3. Só depois criar persistência Prisma/Postgres.
4. Manter os mesmos testes de contrato rodando contra in-memory e, quando viável, contra Prisma.

### Estrutura sugerida

- [x] Criar `src/shared/features/feature-flags.ts`.
- [x] Criar `src/shared/features/index.ts`.
- [x] Adicionar `featureFlags` ao `AppContainer`.
- [x] Adicionar variáveis de ambiente booleanas em `src/shared/env/env.ts`.
- [x] Criar erro padronizado para módulo desabilitado, preferencialmente `ForbiddenError` ou novo `FeatureDisabledError`.
- [x] Adicionar testes de integração para cada módulo desabilitado.
  - [x] Auth login.
  - [x] Auth register.
  - [x] Password recovery.
  - [ ] SSO, se endpoint mock for criado.

### Padrão de variáveis

Usar prefixo explícito:

- `FEATURE_AUTH_LOGIN_ENABLED`
- `FEATURE_AUTH_REGISTER_ENABLED`
- `FEATURE_PASSWORD_RECOVERY_ENABLED`
- `FEATURE_PASSWORD_RECOVERY_REQUEST_ENABLED`
- `FEATURE_PASSWORD_RECOVERY_VERIFY_CODE_ENABLED`
- `FEATURE_PASSWORD_RECOVERY_RESEND_CODE_ENABLED`
- `FEATURE_PASSWORD_RECOVERY_RESET_ENABLED`
- `FEATURE_AUTH_SSO_ENABLED`

Valores aceitos:

- `true`: módulo habilitado.
- `false`: módulo desabilitado.

Default recomendado:

- Login: `true`.
- Register: `true` temporariamente para preservar os testes e o boilerplate público atual; revisar para `false` quando houver fluxo administrativo dedicado para criação de usuários.
- Password recovery: `true` em desenvolvimento depois de testado in-memory.
- SSO: `false` até existir provedor real.

### Comportamento HTTP quando desligado

Quando um módulo estiver desligado:

- A rota pode continuar registrada para documentação Swagger.
- O handler deve retornar erro controlado, sem executar o use case.
- Status recomendado: `403`.
- Payload recomendado:

```json
{
  "error": "FeatureDisabledError",
  "message": "Funcionalidade temporariamente indisponível.",
  "feature": "passwordRecovery"
}
```

Não retornar `404`, porque a rota existe; o problema é operacional/configuracional.

### Matriz de módulos públicos

| Kill switch | Rotas afetadas | Quando `true` | Quando `false` |
| --- | --- | --- | --- |
| `FEATURE_AUTH_LOGIN_ENABLED` | `POST /auth/login` | Login valida credenciais, status da conta e emite token. | Login retorna `403`; nenhum token é emitido. |
| `FEATURE_AUTH_REGISTER_ENABLED` | `POST /auth/register` | Registro cria usuário e pode emitir token. | Registro retorna `403`; nenhum usuário é criado. |
| `FEATURE_AUTH_SSO_ENABLED` | `POST /auth/sso/start`, se criado | Inicia fluxo SSO ou mock explícito. | SSO retorna `403` ou `501`, sem criar sessão. |
| `FEATURE_PASSWORD_RECOVERY_ENABLED` | Todas `/auth/password-recovery/*` | Fluxo completo pode executar conforme switches específicos. | Todas as rotas de recuperação retornam `403`; nenhum código/token é criado. |
| `FEATURE_PASSWORD_RECOVERY_REQUEST_ENABLED` | `POST /auth/password-recovery/request` | Gera código temporário quando aplicável. | Retorna `403`; não cria nem invalida códigos. |
| `FEATURE_PASSWORD_RECOVERY_VERIFY_CODE_ENABLED` | `POST /auth/password-recovery/verify-code` | Valida código e emite `resetToken`. | Retorna `403`; não consome tentativas. |
| `FEATURE_PASSWORD_RECOVERY_RESEND_CODE_ENABLED` | `POST /auth/password-recovery/resend-code` | Reenvia código respeitando cooldown. | Retorna `403`; código anterior permanece como estava. |
| `FEATURE_PASSWORD_RECOVERY_RESET_ENABLED` | `POST /auth/password-recovery/reset` | Atualiza senha com `resetToken` válido. | Retorna `403`; senha não é alterada e token não é consumido. |

### Testes obrigatórios de kill switch

- [x] Quando `FEATURE_AUTH_LOGIN_ENABLED=false`, `POST /auth/login` retorna `403` e não gera token.
- [x] Quando `FEATURE_AUTH_REGISTER_ENABLED=false`, `POST /auth/register` retorna `403` e não cria usuário.
- [x] Quando `FEATURE_PASSWORD_RECOVERY_ENABLED=false`, todas as rotas de recuperação retornam `403`.
- [x] Quando `FEATURE_PASSWORD_RECOVERY_REQUEST_ENABLED=false`, request retorna `403` e não cria código.
- [x] Quando `FEATURE_PASSWORD_RECOVERY_VERIFY_CODE_ENABLED=false`, verify retorna `403` e não incrementa tentativas.
- [x] Quando `FEATURE_PASSWORD_RECOVERY_RESEND_CODE_ENABLED=false`, resend retorna `403` e não invalida o código atual.
- [x] Quando `FEATURE_PASSWORD_RECOVERY_RESET_ENABLED=false`, reset retorna `403` e não altera a senha.

## Estratégia Prisma/Postgres

### Regra de entrada

Não implementar Prisma/Postgres para uma funcionalidade antes de:

- [x] use case existir para recuperação de senha;
- [x] repositório in-memory existir para recuperação de senha;
- [x] testes de integração passarem usando in-memory para recuperação de senha;
- [x] teste de kill switch global passar para recuperação de senha;
- [x] contrato HTTP estar estável para todas as rotas públicas.

### Ordem recomendada

1. Finalizar funcionalidades públicas in-memory.
2. Adicionar Prisma e Postgres ao projeto.
3. Criar schema Prisma equivalente aos contratos testados.
4. Implementar repositórios Prisma atrás das mesmas interfaces de domínio.
5. Adicionar testes de integração específicos para persistência quando houver ambiente de banco.
6. Só então trocar wiring de produção para Prisma no `AppContainer`.

### Estrutura futura sugerida

- [x] `prisma/schema.prisma`
- [x] `src/core/infra/persistence/prisma/prisma-client.ts`
- [x] `src/core/infra/persistence/prisma/prisma-user-repository.ts`
- [x] `src/core/infra/persistence/prisma/prisma-password-recovery-repository.ts`
- [x] `src/core/infra/persistence/prisma/prisma-store-repository.ts`
- [x] `src/core/infra/persistence/prisma/prisma-onboarding-repository.ts`
- [x] `src/core/infra/persistence/prisma/index.ts`
- [x] `DATABASE_URL` em `.env.example`
- [x] `docker/compose.yml` com Postgres para desenvolvimento.
- [x] Adicionar testes de integração específicos contra Prisma/Postgres em ambiente de banco.
  - Testes opt-in via `RUN_PRISMA_INTEGRATION_TESTS=true`.

## Estratégia de erros

### Padrão adotado

- [x] Usar RFC 9457 Problem Details como formato base para erros HTTP.
- [x] Manter compatibilidade temporária com o formato atual (`error`, `message`, `details`, `traceId`).
- [x] Criar catálogo de erros com `code`, `acronym`, `level`, `category`, `status`, `title` e `type`.
- [x] Exportar tipos compartilháveis para o backoffice consumir respostas da API em telas globais e toasts.
- [x] Criar parser no backoffice para transformar erro HTTP em mensagem visual padronizada.

### Convenção de códigos

- Prefixo do produto: `TM`.
- Categoria curta: `AUTH`, `AUTHZ`, `VAL`, `DOM`, `FEAT`, `RES`, `SYS`.
- Status HTTP no sufixo: exemplo `TM-AUTH-401`, `TM-VAL-400`, `TM-SYS-500`.

### Níveis

- `info`: estado esperado ou operacional, como funcionalidade desligada por kill switch.
- `warning`: erro corrigível pelo usuário ou pela chamada, como validação, autenticação e autorização.
- `error`: falha de sistema sem ação imediata do usuário.
- `critical`: indisponibilidade grave ou risco operacional.

## Rotas públicas encontradas no Backoffice

| Rota | Tela | Status de API |
| --- | --- | --- |
| `/` | Redireciona para `/auth/login` | Não precisa de API |
| `/login` | Redireciona para `/auth/login` | Não precisa de API |
| `/auth/login` | Login público | Parcial: existe `POST /auth/login` |
| `/recover-password` | Solicitar recuperação de senha | In-memory: `POST /auth/password-recovery/request` |
| `/recover-password/code` | Validar código temporário | In-memory: `POST /auth/password-recovery/verify-code` e `POST /auth/password-recovery/resend-code` |
| `/recover-password/reset` | Redefinir senha | In-memory: `POST /auth/password-recovery/reset` |
| `/recover-password/success` | Confirmação visual | Não precisa de API própria |

## `/auth/register` + onboarding

### Decisões aplicadas

- [x] Cadastro público cria o usuário inicial da loja como `ROLE_COMPANY`.
- [x] Cadastro público não permite definir `role`.
- [x] Cadastro público não permite definir `accountStatus`.
- [x] Cadastro público cria progresso de onboarding com `nextStep = STORE_PROFILE`.
- [x] Rotas administrativas autenticadas continuam podendo criar `COMPANY`, `EMPLOYEE` e `DELIVERY_MAN` conforme regra de papel.

### API implementada in-memory

- [x] `GET /onboarding/me`
- [x] `POST /onboarding/store-profile`
- [x] `POST /onboarding/store-address`
- [x] `POST /onboarding/preferences`
- [x] `POST /onboarding/complete`

### Validações implementadas

- [x] Token obrigatório nas rotas de onboarding.
- [x] Kill switch `FEATURE_ONBOARDING_ENABLED`.
- [x] Nome da loja obrigatório com mínimo de 2 caracteres.
- [x] Telefone normalizado para dígitos e limitado a 10 ou 11 dígitos.
- [x] Documento normalizado para dígitos e limitado a CPF/CNPJ com 11 ou 14 dígitos.
- [x] Documento não pode pertencer a outra loja.
- [x] Segmento precisa pertencer ao enum `StoreSegment`.
- [x] Endereço só pode ser salvo depois de `STORE_PROFILE`.
- [x] Preferências só podem ser salvas depois de `STORE_ADDRESS`.
- [x] Onboarding só pode ser concluído depois de `STORE_PROFILE`, `STORE_ADDRESS` e `STORE_PREFERENCES`.
- [x] Rotas de onboarding aceitam autenticação por `Authorization: Bearer <token>` ou cookie `@thalya-modas:session`.

### Pendências para próxima etapa

- [x] Decidir se `ROLE_COMPANY` será mantido como dono/gerente da loja ou se criaremos `ROLE_MANAGER`.
- [x] Adicionar etapa de endereço.
- [x] Adicionar etapa de preferências operacionais.
- [x] Adicionar testes específicos para documento duplicado, telefone inválido e conclusão sem perfil.
- [x] Levar `Store` e `Onboarding` para Prisma/Postgres depois dos contratos estabilizarem.

## `/auth/login`

### Funcionalidades da tela

- Informar e-mail.
- Informar senha.
- Marcar/desmarcar “Remember me”.
- Entrar no dashboard ao autenticar.
- Acessar recuperação de senha.
- Ação visual de SSO seguro.

### API necessária

- [x] Revisar `POST /auth/login` para retornar payload compatível com o backoffice:
  - `user.id`
  - `user.name`
  - `user.email`
  - `user.role`
  - `user.accountStatus`
  - `token`
  - `expiresIn`
- [x] Adicionar seed para usuário de preview:
  - e-mail sugerido: `ana@thalyamodas.com`
  - senha sugerida: `Password123`
  - role de gerente/admin compatível com rotas `/manager/dashboard`.
- [x] Definir comportamento de “Remember me”:
  - receber `rememberMe?: boolean`
  - ampliar expiração do token quando verdadeiro, se aplicável.
- [x] Decidir se o backoffice usará token em resposta JSON ou cookie httpOnly.
  - Decisão: usar cookie `httpOnly` para sessão do backoffice.
  - Cookie padronizado: `@thalya-modas:session`.
  - `POST /auth/login` seta cookie seguro e o middleware lê o mesmo padrão.
- [x] Manter mensagens de erro genéricas para credenciais inválidas.

### Testes

- [x] Login com credenciais válidas retorna `200`, usuário, token e `expiresIn`.
- [x] Login com `rememberMe: true` retorna expiração maior.
- [x] Login com e-mail inexistente retorna `401`.
- [x] Login com senha incorreta retorna `401`.
- [x] Login com e-mail inválido retorna `400`.
- [x] Login com senha vazia retorna `400`.
- [x] Login de conta inativa/suspensa continua bloqueado.

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

- [x] Criar `POST /auth/password-recovery/request`.
- [x] Body:
  - `email: string`
- [x] Comportamento:
  - normalizar e-mail.
  - se usuário existir e puder recuperar senha, criar código temporário.
  - armazenar em repositório in-memory de recuperação.
  - definir expiração de 10 minutos.
  - invalidar códigos anteriores do mesmo usuário/e-mail.
  - responder sempre de forma neutra para não revelar se o e-mail existe.
- [x] Para ambiente de teste/preview, permitir recuperar o código por meio controlado:
  - opção preferida: expor código apenas no repositório/factory de teste.
  - opção alternativa: retornar `debugCode` somente em `NODE_ENV=test`.

### Testes

- [x] Solicitação com e-mail válido existente retorna `202`.
- [x] Solicitação com e-mail válido inexistente retorna `202` sem criar reset utilizável.
- [x] Solicitação com e-mail inválido retorna `400`.
- [x] Nova solicitação invalida código anterior do mesmo e-mail.
- [x] Código gerado possui expiração de 10 minutos.

## `/recover-password/code`

### Funcionalidades da tela

- Digitar código de 6 dígitos.
- Confirmar código.
- Reenviar código após contagem regressiva.

### API necessária

- [x] Criar `POST /auth/password-recovery/verify-code`.
- [x] Body:
  - `email: string`
  - `code: string`
- [x] Response:
  - `resetToken: string`
  - `expiresIn: number`
- [x] Comportamento:
  - aceitar apenas código com 6 dígitos.
  - validar código ativo e não expirado.
  - limitar tentativas inválidas.
  - ao validar, gerar `resetToken` temporário.
  - marcar código como verificado/usado para evitar replay.
- [x] Criar `POST /auth/password-recovery/resend-code`.
- [x] Body:
  - `email: string`
- [x] Comportamento:
  - respeitar cooldown, inicialmente 30 segundos.
  - invalidar código anterior quando reenviar.

### Testes

- [x] Código válido retorna `200` com `resetToken`.
- [x] Código inválido retorna `401` ou `400`, conforme padrão da API.
- [x] Código expirado retorna erro.
- [x] Código já usado não pode ser reutilizado.
- [x] Após muitas tentativas inválidas, fluxo é bloqueado temporariamente.
- [x] Reenvio antes do cooldown retorna erro de regra de negócio.
- [x] Reenvio após cooldown cria novo código e invalida o anterior.

## `/recover-password/reset`

### Funcionalidades da tela

- Informar nova senha.
- Confirmar nova senha.
- Exibir requisito mínimo: 8 caracteres com número e letra maiúscula.
- Atualizar senha.

### API necessária

- [x] Criar `POST /auth/password-recovery/reset`.
- [x] Body:
  - `resetToken: string`
  - `password: string`
  - `passwordConfirmation: string`
- [x] Comportamento:
  - validar token temporário ativo e não expirado.
  - validar confirmação de senha.
  - validar regra de força mínima.
  - gerar hash da nova senha.
  - atualizar usuário no repositório in-memory.
  - invalidar todos os códigos/tokens pendentes daquele usuário.
  - opcional: retornar token de login automático ou exigir login manual.

### Testes

- [x] Reset com token válido e senhas iguais retorna `200`.
- [x] Senhas diferentes retornam `400`.
- [x] Senha fraca retorna `400`.
- [x] Token inválido retorna erro.
- [x] Token expirado retorna erro.
- [x] Token já usado não pode ser reutilizado.
- [x] Após reset, login com senha antiga falha.
- [x] Após reset, login com senha nova funciona.

## `/recover-password/success`

### Funcionalidades da tela

- Confirmar que a senha foi atualizada.
- Voltar para dashboard.
- Voltar para login.

### API necessária

- [ ] Nenhuma rota própria.
- [ ] Depende do sucesso de `POST /auth/password-recovery/reset`.

### Testes

- [x] Coberto indiretamente pelos testes de reset.

## Estrutura sugerida na API

- [x] `src/core/domain/entities/password-recovery.ts`
- [x] `src/core/domain/repositories/password-recovery-repository.ts`
- [x] `src/core/application/use-cases/auth/password-recovery.ts`
- [x] `src/core/infra/persistence/in-memory/in-memory-password-recovery-repository.ts`
- [x] Atualizar `src/app/http/routes/auth.routes.ts`
- [x] Atualizar `src/app/http/container.ts`
- [x] Criar testes em `tests/integration/auth/password-recovery.spec.ts`

## Ordem recomendada de implementação

1. Ajustar/seedar login público para preview.
2. Criar entidade/repositório in-memory de recuperação de senha.
3. Implementar solicitação de recuperação.
4. Implementar validação de código e reenvio.
5. Implementar reset de senha.
6. Cobrir fluxo completo com teste de integração ponta a ponta.
