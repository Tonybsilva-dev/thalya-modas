# Casos de Uso da API

Registro dos casos de uso da API, regras de negócio e alterações relevantes.

## Índice

- [RegisterUser](#registeruser)
- [Login](#login)
- [Password Recovery](#password-recovery)
- [Onboarding de Loja](#onboarding-de-loja)
- [Users (CRUD e listagem)](#users-crud-e-listagem)

---

## RegisterUser

**Objetivo:** Registrar novo usuário na aplicação (estabelecimento, empregado, entregador ou cliente administrativo).

**Endpoint:** `POST /auth/register`

**Entrada (body):**

- `name` (string, obrigatório): nome; normalizado (sem caracteres especiais nem emojis, trim, espaços colapsados).
- `email` (string, obrigatório): email válido.
- `password` (string, obrigatório): mínimo 8 caracteres; armazenado com hash Argon2id.
- `role` (opcional): um de `CUSTOMER`, `COMPANY`, `EMPLOYEE`, `DELIVERY_MAN`. Em cadastro público, o campo não é permitido.
- `accountStatus` (opcional): padrão ACTIVE.

**Saída (201):** `{ user: { id, name, email, role, accountStatus, createdAt, updatedAt }, token, onboarding? }`

**Regras de autorização:**

- **Cadastro público:** cria usuário inicial da loja como **COMPANY**, não permite enviar `role` nem `accountStatus`, e cria onboarding com `nextStep = STORE_PROFILE`.
- **COMPANY:** apenas **SUPER_ADMIN** autenticado pode cadastrar (token obrigatório).
- **EMPLOYEE** e **DELIVERY_MAN:** apenas **COMPANY** autenticada pode cadastrar (token obrigatório).
- **SUPER_ADMIN:** não pode ser cadastrado por esta rota (retorna 403).

Sem token, se o body enviar `role` ou `accountStatus`, a API retorna **403 Forbidden**.

**Normalização:**

- **Nome:** Value Object `Name.fromRaw`: remove emojis e caracteres especiais (mantém letras, números, espaços, hífen, apóstrofo); trim e colapso de espaços; mínimo 2 caracteres após normalização.
- **Senha:** hash com Argon2id antes de persistir.
- **E-mail:** trim + lowercase antes de busca e persistência.
- **Campos com máscara (CNPJ, telefone, CEP):** normalizados para manter apenas dígitos nos fluxos de onboarding.

**Histórico:**

- Implementação atual: cadastro público como COMPANY, autorização por role (SUPER_ADMIN → COMPANY; COMPANY → EMPLOYEE/DELIVERY_MAN), normalização de nome/e-mail e criação de onboarding inicial.

---

## Login

**Endpoint:** `POST /auth/login`

**Entrada (body):**

- `email` (string, obrigatório): e-mail válido, normalizado com trim + lowercase.
- `password` (string, obrigatório).
- `rememberMe` (boolean, opcional): quando verdadeiro amplia a expiração para 30 dias.

**Saída (200):** `{ user, token, expiresIn }`

**Sessão:** o login também seta cookie `thalya_modas_session` com `HttpOnly`, `SameSite=Lax`, `Path=/`, `Max-Age` igual a `expiresIn`, e `Secure` em produção.

**Expiração:**

- Padrão: 7 dias (`604800` segundos).
- `rememberMe: true`: 30 dias (`2592000` segundos).

**Erros:** credenciais inválidas retornam mensagem genérica.

---

## Password Recovery

Fluxo público de recuperação de senha usado pelas telas `/recover-password`, `/recover-password/code` e `/recover-password/reset`.

| Operação | Método e rota | Persistência |
|----------|----------------|--------------|
| Solicitar código | `POST /auth/password-recovery/request` | Cria/invalida registros em `password_recovery_requests` |
| Verificar código | `POST /auth/password-recovery/verify-code` | Atualiza tentativa/status e emite `resetToken` |
| Reenviar código | `POST /auth/password-recovery/resend-code` | Respeita cooldown e recria código |
| Redefinir senha | `POST /auth/password-recovery/reset` | Atualiza `users.password_hash` e invalida tokens pendentes |

**Regras:**

- Resposta neutra para e-mail inexistente.
- Código de 6 dígitos expira em 10 minutos.
- Cooldown de reenvio: 30 segundos.
- Tentativas inválidas bloqueiam o fluxo.
- Reset token expira em 10 minutos e não pode ser reutilizado.
- Senha nova exige mínimo de 8 caracteres, uma letra maiúscula e um número.

---

## Onboarding de Loja

Após cadastro público, a API cria onboarding pendente para a loja.

| Operação | Método e rota | Efeito |
|----------|----------------|--------|
| Consultar progresso | `GET /onboarding/me` | Consulta `onboardings` e `stores` |
| Perfil da loja | `POST /onboarding/store-profile` | Cria/atualiza `stores`; avança para endereço |
| Endereço | `POST /onboarding/store-address` | Atualiza `stores.address`; avança para preferências |
| Preferências | `POST /onboarding/preferences` | Atualiza `stores.preferences`; avança para conclusão |
| Concluir | `POST /onboarding/complete` | Ativa loja e marca onboarding como concluído |

**Validações:**

- Token obrigatório.
- Kill switch `FEATURE_ONBOARDING_ENABLED`.
- Nome da loja mínimo de 2 caracteres.
- Telefone com 10 ou 11 dígitos.
- Documento CPF/CNPJ com 11 ou 14 dígitos.
- Documento único entre lojas.
- CEP com 8 dígitos.
- UF com 2 letras.
- Horário de abertura anterior ao fechamento.

---

## Users (CRUD e listagem)

**Perfil do usuário autenticado:** use `GET /auth/me` (tag **auth**). Retorna o perfil de quem está logado.

**Demais operações sobre usuários (tag **users**):**

| Operação | Método e rota | Descrição | Quem pode |
|----------|----------------|-----------|-----------|
| Verificar email disponível | `GET /users/check-email?email=` | Verifica se o email já está em uso (ex.: formulário de registro) | Público (rate limit 10/min) |
| Listar usuários | `GET /users?page=1&perPage=10&sort=&filter=` | Lista paginada; `filter` busca em nome e email | Super Admin, Company |
| Contar usuários | `GET /users/count?filter=` | Retorna `{ count }`; `filter` opcional (nome/email) | Super Admin, Company |
| Ver usuário por ID | `GET /users/:id` | Detalhe de um usuário (sem senha) | Próprio usuário ou Super Admin/Company |
| Atualizar usuário | `PATCH /users/:id` | Atualização parcial (nome, email, role, accountStatus). Nome é normalizado. | Próprio (só nome) ou Super Admin/Company (todos os campos) |
| Excluir usuário | `DELETE /users/:id` | Remove o usuário | Próprio ou Super Admin/Company |

Respostas paginadas seguem o formato `{ items, total, page, perPage, totalPages }`. Todas as rotas (exceto check-email) exigem autenticação via `Authorization: Bearer <token>` no contrato atual; o backoffice deve migrar para sessão via cookie `httpOnly`.
