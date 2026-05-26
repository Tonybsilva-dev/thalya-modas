## Test Plan - Domínio Inicial, Validações e Casos de Uso de Autenticação

Este documento descreve, do ponto de vista de QA, os cenários de teste que devem cobrir o que já foi implementado no domínio e na camada de aplicação:

- Entidade `User`, enum `UserRole` e enum `AccountStatus`.
- Value objects `Password` e `AccountStatusVO`.
- Schemas Zod (`userSchema`, `createUserSchema`, `updateUserSchema`).
- Casos de uso de autenticação (`RegisterUser`, `Login`, `GetCurrentUser`).
- Integração com o pipeline de QA (`npm run qa`).

Cada seção traz os **objetivos**, **cenários de teste** e o **tipo de teste** (unitário / integração).

---

## 1. Entidade `User` e Enum `UserRole`

### Objetivo

Garantir que a modelagem da entidade de domínio `User` e do enum `UserRole` representa corretamente os estados válidos de um usuário da aplicação.

### Casos de teste

- **UT-USER-001 – Enum de roles deve conter apenas valores suportados**
  - **Tipo**: Unitário
  - **Pré-condição**: Código compilando.
  - **Cenário**:
    - Verificar que `UserRole (e.g. UserRole.CUSTOMER === "ROLE_CUSTOMER", UserRole.SUPER_ADMIN === "ROLE_SUPER_ADMIN")`.
  - **Critério de aceitação**:
    - Os valores do enum correspondem exatamente às strings esperadas (evita typos espalhados).

- **UT-USER-002 – Interface `User` deve expor campos obrigatórios**
  - **Tipo**: Unitário (type-level)
  - **Cenário**:
    - Verificar (via uso em código/compilação) que os campos `id`, `name`, `email`, `passwordHash`, `role`, `accountStatus`, `createdAt`, `updatedAt` são obrigatórios.
  - **Critério de aceitação**:
    - O TypeScript acusa erro se qualquer um dos campos obrigatórios for omitido na criação de um `User`.

- **UT-USER-003 – Enum `AccountStatus` deve conter valores válidos**
  - **Tipo**: Unitário
  - **Cenário**:
    - Verificar que `AccountStatus.ACTIVE === "ACTIVE"`, `AccountStatus.INACTIVE === "INACTIVE"`, `AccountStatus.SUSPENDED === "SUSPENDED"`, `AccountStatus.PENDING_VERIFICATION === "PENDING_VERIFICATION"`.
  - **Critério de aceitação**:
    - Os valores do enum correspondem exatamente às strings esperadas.

---

## 2. Value Object `Password`

### Objetivo

Assegurar que senhas em texto plano sejam sempre transformadas em hash por um `PasswordHasher`, que o hash nunca seja vazio e que a verificação (`verify`) funcione conforme esperado.

### Casos de teste

- **UT-PASS-001 – Criação a partir de hash válido**
  - **Tipo**: Unitário
  - **Cenário**:
    - Chamar `Password.fromHash("hashed:secret")`.
  - **Critério de aceitação**:
    - A instância resultante expõe `hash === "hashed:secret"`.

- **UT-PASS-002 – Erro ao criar a partir de hash vazio**
  - **Tipo**: Unitário
  - **Cenário**:
    - Chamar `Password.fromHash("")`.
  - **Critério de aceitação**:
    - Lança erro com mensagem `"Password hash must not be empty"`.

- **UT-PASS-003 – Criação a partir de senha em texto com hasher**
  - **Tipo**: Unitário
  - **Cenário**:
    - Usar um `PasswordHasher` fake que prefixa `"hashed:"`.
    - Chamar `Password.fromPlain("super-secret", fakeHasher)`.
  - **Critério de aceitação**:
    - `password.hash === "hashed:super-secret"`.

- **UT-PASS-004 – Senha curta deve ser rejeitada**
  - **Tipo**: Unitário
  - **Cenário**:
    - Chamar `Password.fromPlain("short", fakeHasher)`.
  - **Critério de aceitação**:
    - Lança erro `"Password must have at least 8 characters"`.

- **UT-PASS-005 – Verificação de senha correta**
  - **Tipo**: Unitário
  - **Cenário**:
    - Criar `password` via `fromPlain("super-secret", fakeHasher)`.
    - Chamar `password.verify("super-secret", fakeHasher)`.
  - **Critério de aceitação**:
    - Retorna `true`.

- **UT-PASS-006 – Verificação de senha incorreta**
  - **Tipo**: Unitário
  - **Cenário**:
    - Criar `password` via `fromPlain("super-secret", fakeHasher)`.
    - Chamar `password.verify("other-password", fakeHasher)`.
  - **Critério de aceitação**:
    - Retorna `false`.

---

## 2.1 Value Object `AccountStatusVO`

### Objetivo

Garantir que o Value Object `AccountStatusVO` encapsula corretamente a lógica de negócio relacionada ao status da conta, especialmente a regra de que apenas contas `ACTIVE` podem autenticar.

### Casos de teste

- **UT-ACCOUNT-001 – Criação a partir de enum**
  - **Tipo**: Unitário
  - **Cenário**:
    - Chamar `AccountStatusVO.from(AccountStatus.ACTIVE)`.
  - **Critério de aceitação**:
    - Retorna instância válida com `value === AccountStatus.ACTIVE`.

- **UT-ACCOUNT-002 – Criação a partir de string válida**
  - **Tipo**: Unitário
  - **Cenário**:
    - Chamar `AccountStatusVO.fromString("ACTIVE")`.
  - **Critério de aceitação**:
    - Retorna instância válida.

- **UT-ACCOUNT-003 – Erro ao criar a partir de string inválida**
  - **Tipo**: Unitário
  - **Cenário**:
    - Chamar `AccountStatusVO.fromString("INVALID_STATUS")`.
  - **Critério de aceitação**:
    - Lança erro com mensagem contendo `"Invalid account status"`.

- **UT-ACCOUNT-004 – `canAuthenticate()` retorna true apenas para ACTIVE**
  - **Tipo**: Unitário
  - **Cenário**:
    - Criar `AccountStatusVO` para cada status e chamar `canAuthenticate()`.
  - **Critério de aceitação**:
    - `ACTIVE.canAuthenticate() === true`.
    - `INACTIVE.canAuthenticate() === false`.
    - `SUSPENDED.canAuthenticate() === false`.
    - `PENDING_VERIFICATION.canAuthenticate() === false`.

- **UT-ACCOUNT-005 – Métodos de verificação de status**
  - **Tipo**: Unitário
  - **Cenário**:
    - Testar `isActive()`, `isInactive()`, `isSuspended()`, `isPendingVerification()` para cada status.
  - **Critério de aceitação**:
    - Cada método retorna `true` apenas para o status correspondente.

- **UT-ACCOUNT-006 – Comparação de instâncias**
  - **Tipo**: Unitário
  - **Cenário**:
    - Criar duas instâncias com mesmo status e chamar `equals()`.
  - **Critério de aceitação**:
    - `equals()` retorna `true` para status iguais, `false` para diferentes.

---

## 3. Schemas Zod de Usuário

### Objetivo

Validar estrutura e regras de negócio básicas dos dados de usuário em três níveis:

- Objeto completo de usuário (`userSchema`).
- Payload de criação (`createUserSchema`).
- Payload de atualização parcial (`updateUserSchema`).

### 3.1 `userSchema`

- **UT-USCHEMA-001 – Usuário válido passa na validação**
  - **Tipo**: Unitário
  - **Cenário**:
    - Construir objeto com:
      - `id`: UUID válido.
      - `name`: string com pelo menos 2 caracteres.
      - `email`: email válido.
      - `passwordHash`: string não vazia.
      - `role`: um dos `UserRole` (ex.: `UserRole.CUSTOMER`, `UserRole.SUPER_ADMIN`).
      - `accountStatus`: `AccountStatus.ACTIVE`, `AccountStatus.INACTIVE`, `AccountStatus.SUSPENDED` ou `AccountStatus.PENDING_VERIFICATION`.
      - `createdAt` / `updatedAt`: `Date`.
    - `userSchema.safeParse(obj)`.
  - **Critério de aceitação**:
    - `success === true`.

- **UT-USCHEMA-002 – Email inválido é rejeitado**
  - **Tipo**: Unitário
  - **Cenário**:
    - Mesmo objeto do caso anterior, mas com `email = "not-an-email"`.
  - **Critério de aceitação**:
    - `success === false` e erro aponta para o campo `email`.

- **UT-USCHEMA-003 – Role inválida é rejeitada**
  - **Tipo**: Unitário
  - **Cenário**:
    - Mesmo objeto válido, mas com `role = "ROLE_MANAGER"`.
  - **Critério de aceitação**:
    - `success === false`.

- **UT-USCHEMA-004 – AccountStatus inválido é rejeitado**
  - **Tipo**: Unitário
  - **Cenário**:
    - Mesmo objeto válido, mas com `accountStatus = "INVALID_STATUS"`.
  - **Critério de aceitação**:
    - `success === false`.

### 3.2 `createUserSchema`

- **UT-CUSCHEMA-001 – Payload mínimo válido de criação**
  - **Tipo**: Unitário
  - **Cenário**:
    - `createUserSchema.safeParse({ name, email, password })`.
  - **Critério de aceitação**:
    - `success === true`.
    - Campos como `id`, `createdAt`, `updatedAt`, `passwordHash` não são exigidos no payload.
    - `accountStatus` é opcional (padrão será `ACTIVE`).

- **UT-CUSCHEMA-002 – Falha quando password não é informado**
  - **Tipo**: Unitário
  - **Cenário**:
    - `createUserSchema.safeParse({ name, email })`.
  - **Critério de aceitação**:
    - `success === false` e erro aponta para `password`.

### 3.3 `updateUserSchema`

- **UT-UUSCHEMA-001 – Payload parcial válido**
  - **Tipo**: Unitário
  - **Cenário**:
    - `updateUserSchema.safeParse({ name: "Novo Nome" })`.
  - **Critério de aceitação**:
    - `success === true`.

- **UT-UUSCHEMA-002 – Validação ainda é aplicada em payload parcial**
  - **Tipo**: Unitário
  - **Cenário**:
    - `updateUserSchema.safeParse({ email: "not-an-email" })`.
  - **Critério de aceitação**:
    - `success === false` e erro aponta para `email`.

---

## 4. Pipeline de QA (Smoke Tests)

### Objetivo

Garantir que a adição de novos testes e módulos de domínio não quebre o pipeline padrão de QA.

### Casos de teste

- **SM-QA-001 – Execução completa do `npm run qa`**
  - **Tipo**: Integração / Build pipeline
  - **Cenário**:
    - Rodar `npm run qa`.
  - **Critério de aceitação**:
    - `lint` (Biome) executa sem erros.
    - `format` (Biome) não deixa arquivos pendentes de formatação.
    - `test:changed` (Vitest) executa sem falhas.
    - `build:check` (`tsc --noEmit`) compila sem erros de tipo.

---

## 5. Repository Pattern para Testes

### 5.1 Interface do Repositório

**Arquivo**: `src/core/domain/repositories/user-repository.ts`

- **Status**: ✅ Implementado
- **Descrição**: Interface `UserRepository` define o contrato para persistência de usuários.
- **Métodos**:
  - `findById(id: string): Promise<User | null>`
  - `findByEmail(email: string): Promise<User | null>`
  - `create(user: Omit<User, "id" | "createdAt" | "updatedAt">): Promise<User>`
  - `update(id: string, user: Partial<...>): Promise<User | null>`
  - `delete(id: string): Promise<boolean>`

### 5.2 Mock Repository

**Arquivo**: `tests/unit/core/domain/repositories/mock-user-repository.ts`

- **Status**: ✅ Implementado
- **Descrição**: Implementação mock do `UserRepository` usando `Map` em memória.
- **Funcionalidades**:
  - Armazena usuários em memória durante execução dos testes.
  - Implementa todos os métodos da interface `UserRepository`.
  - Métodos auxiliares para testes: `clear()`, `getAll()`, `count()`.

### 5.3 Testes do Mock Repository

**Arquivo**: `tests/unit/core/domain/repositories/mock-user-repository.spec.ts`

- **Status**: ✅ Implementado
- **Cenários testados**:
  - ✅ Criação de usuário com geração automática de `id`, `createdAt`, `updatedAt`.
  - ✅ Busca por ID (sucesso e não encontrado).
  - ✅ Busca por email (sucesso e não encontrado).
  - ✅ Atualização de usuário (sucesso e não encontrado).
  - ✅ Deleção de usuário (sucesso e não encontrado).
  - ✅ Métodos auxiliares (`clear`, `getAll`, `count`).

### 5.4 Benefícios do Padrão Repository nos Testes

- **Isolamento**: Testes de casos de uso não dependem de infraestrutura real (DB, APIs).
- **Determinismo**: Comportamento previsível e controlável.
- **Performance**: Testes rápidos sem I/O de banco de dados.
- **Flexibilidade**: Fácil simular cenários específicos (erros, edge cases).
- **Manutenibilidade**: Mudanças na infraestrutura não quebram testes unitários.

---

---

## 6. Casos de Uso de Autenticação

### Objetivo

Garantir que os casos de uso de autenticação (`RegisterUser`, `Login`, `GetCurrentUser`) implementam corretamente a lógica de negócio, incluindo validação de `AccountStatus` e geração de tokens JWT.

### 6.1 `RegisterUserUseCase`

**Arquivo**: `src/core/application/use-cases/auth/register-user.ts`

- **Status**: ✅ Implementado
- **Dependências**: `UserRepository`, `PasswordHasher`, `JWTService`

#### Casos de teste

- **UT-REGISTER-001 – Registro bem-sucedido com dados válidos**
  - **Tipo**: Unitário
  - **Cenário**:
    - Executar `RegisterUserUseCase.execute({ name, email, password })`.
  - **Critério de aceitação**:
    - Usuário criado com `role = USER` (padrão) e `accountStatus = ACTIVE` (padrão).
    - Senha é hasheada antes de salvar.
    - Token JWT válido é retornado.
    - Token contém `userId`, `email` e `role` corretos.

- **UT-REGISTER-002 – Aceita role customizado quando fornecido**
  - **Tipo**: Unitário
  - **Cenário**:
    - Executar com `role: UserRole.SUPER_ADMIN` (ou outro role válido).
  - **Critério de aceitação**:
    - Usuário criado com o role fornecido.

- **UT-REGISTER-003 – Aceita accountStatus customizado**
  - **Tipo**: Unitário
  - **Cenário**:
    - Executar com `accountStatus: AccountStatus.PENDING_VERIFICATION`.
  - **Critério de aceitação**:
    - Usuário criado com status fornecido.

- **UT-REGISTER-004 – Rejeita email duplicado**
  - **Tipo**: Unitário
  - **Cenário**:
    - Tentar registrar usuário com email já existente.
  - **Critério de aceitação**:
    - Lança `DomainError` com mensagem "Email já está em uso".

- **UT-REGISTER-005 – Rejeita senha muito curta**
  - **Tipo**: Unitário
  - **Cenário**:
    - Executar com `password` menor que 8 caracteres.
  - **Critério de aceitação**:
    - Lança erro de validação Zod.

- **UT-REGISTER-006 – Rejeita email inválido**
  - **Tipo**: Unitário
  - **Cenário**:
    - Executar com `email` inválido.
  - **Critério de aceitação**:
    - Lança erro de validação Zod.

### 6.2 `LoginUseCase`

**Arquivo**: `src/core/application/use-cases/auth/login.ts`

- **Status**: ✅ Implementado
- **Dependências**: `UserRepository`, `PasswordHasher`, `JWTService`

#### Casos de teste

- **UT-LOGIN-001 – Login bem-sucedido com conta ACTIVE**
  - **Tipo**: Unitário
  - **Cenário**:
    - Executar `LoginUseCase.execute({ email, password })` com usuário existente e `accountStatus = ACTIVE`.
  - **Critério de aceitação**:
    - Retorna dados do usuário e token JWT válido.
    - Token contém informações corretas.

- **UT-LOGIN-002 – Rejeita email inexistente**
  - **Tipo**: Unitário
  - **Cenário**:
    - Executar com email que não existe no repositório.
  - **Critério de aceitação**:
    - Lança `AuthError` com mensagem "Credenciais inválidas".

- **UT-LOGIN-003 – Rejeita senha incorreta**
  - **Tipo**: Unitário
  - **Cenário**:
    - Executar com senha incorreta para usuário existente.
  - **Critério de aceitação**:
    - Lança `AuthError` com mensagem "Credenciais inválidas".

- **UT-LOGIN-004 – Rejeita conta INACTIVE**
  - **Tipo**: Unitário
  - **Cenário**:
    - Executar login com usuário que tem `accountStatus = INACTIVE`.
  - **Critério de aceitação**:
    - Lança `DomainError` com detalhes do status.
    - Mensagem indica que conta não pode autenticar.

- **UT-LOGIN-005 – Rejeita conta SUSPENDED**
  - **Tipo**: Unitário
  - **Cenário**:
    - Executar login com usuário que tem `accountStatus = SUSPENDED`.
  - **Critério de aceitação**:
    - Lança `DomainError` com detalhes do status.

- **UT-LOGIN-006 – Rejeita conta PENDING_VERIFICATION**
  - **Tipo**: Unitário
  - **Cenário**:
    - Executar login com usuário que tem `accountStatus = PENDING_VERIFICATION`.
  - **Critério de aceitação**:
    - Lança `DomainError` com detalhes do status.

- **UT-LOGIN-007 – Funciona com usuário ADMIN**
  - **Tipo**: Unitário
  - **Cenário**:
    - Executar login com usuário `ADMIN` e `ACTIVE`.
  - **Critério de aceitação**:
    - Login bem-sucedido.
    - Token contém `role = ADMIN`.

### 6.3 `GetCurrentUserUseCase`

**Arquivo**: `src/core/application/use-cases/auth/get-current-user.ts`

- **Status**: ✅ Implementado
- **Dependências**: `UserRepository`

#### Casos de teste

- **UT-GETUSER-001 – Retorna dados do usuário quando encontrado**
  - **Tipo**: Unitário
  - **Cenário**:
    - Executar `GetCurrentUserUseCase.execute({ userId })` com ID válido.
  - **Critério de aceitação**:
    - Retorna todos os dados do usuário, incluindo `accountStatus`.

- **UT-GETUSER-002 – Lança erro quando usuário não existe**
  - **Tipo**: Unitário
  - **Cenário**:
    - Executar com ID inexistente.
  - **Critério de aceitação**:
    - Lança `NotFoundError` com mensagem "Usuário não encontrado".

- **UT-GETUSER-003 – Retorna accountStatus corretamente**
  - **Tipo**: Unitário
  - **Cenário**:
    - Executar com usuário que tem `accountStatus = PENDING_VERIFICATION`.
  - **Critério de aceitação**:
    - Retorna `accountStatus` correto.

---

## 7. Testes de Integração de Autenticação

### Status: ✅ Implementado

Testes de integração foram adicionados para validar o comportamento completo das rotas HTTP de autenticação, incluindo validação de schemas, tratamento de erros e integração com casos de uso.

### 7.1 Estrutura de Testes de Integração

**Localização**: `tests/integration/auth/`

- **`register.spec.ts`**: Testes de registro de usuário (`POST /auth/register`)
- **`login.spec.ts`**: Testes de login e autenticação (`POST /auth/login`)
- **`me.spec.ts`**: Testes de obtenção de dados do usuário autenticado (`GET /auth/me`)

**Helpers de Teste**: `tests/integration/helpers/`

- **`test-server.ts`**: Cria servidor Fastify configurado para testes
  - `createTestServer()`: Cria instância do servidor com MockUserRepository
  - `makeRequest()`: Wrapper para fazer requisições HTTP nos testes

**Factories**: `tests/factories/`

- **`user.factory.ts`**: Factory para criar dados de teste
  - `createUser()`: Cria usuário com valores padrão
  - `createAdminUser()`: Cria usuário admin
  - `createInactiveUser()`: Cria usuário inativo
  - `createSuspendedUser()`: Cria usuário suspenso
  - `createPendingVerificationUser()`: Cria usuário pendente de verificação
  - `createRegisterData()`: Cria dados para registro

### 7.2 Testes de Registro (`POST /auth/register`)

**Arquivo**: `tests/integration/auth/register.spec.ts`

#### Casos de teste implementados

- **IT-REGISTER-001 – Registro bem-sucedido**
  - **Tipo**: Integração
  - **Cenário**: Registrar novo usuário com dados válidos
  - **Critério de aceitação**:
    - Retorna 201 com dados do usuário e token JWT
    - Usuário criado com `role = USER` e `accountStatus = ACTIVE` por padrão
    - Token JWT válido é retornado

- **IT-REGISTER-002 – Define role e status padrão**
  - **Tipo**: Integração
  - **Cenário**: Registrar sem especificar role e accountStatus
  - **Critério de aceitação**: Role e status são definidos como padrão (USER, ACTIVE)

- **IT-REGISTER-003 – Permite role e status customizados**
  - **Tipo**: Integração
  - **Cenário**: Registrar com role ADMIN e status ACTIVE
  - **Critério de aceitação**: Usuário criado com valores customizados

- **IT-REGISTER-004 – Validação de email inválido**
  - **Tipo**: Integração
  - **Cenário**: Tentar registrar com email inválido
  - **Critério de aceitação**: Retorna 400 com erro de validação

- **IT-REGISTER-005 – Validação de senha curta**
  - **Tipo**: Integração
  - **Cenário**: Tentar registrar com senha menor que 8 caracteres
  - **Critério de aceitação**: Retorna 400 com erro de validação

- **IT-REGISTER-006 – Validação de nome curto**
  - **Tipo**: Integração
  - **Cenário**: Tentar registrar com nome menor que 2 caracteres
  - **Critério de aceitação**: Retorna 400 com erro de validação

- **IT-REGISTER-007 – Validação de body vazio**
  - **Tipo**: Integração
  - **Cenário**: Tentar registrar sem dados
  - **Critério de aceitação**: Retorna 400 com erro de validação

- **IT-REGISTER-008 – Rejeita email duplicado**
  - **Tipo**: Integração
  - **Cenário**: Tentar registrar com email já existente
  - **Critério de aceitação**: Retorna 400 com erro de email duplicado

- **IT-REGISTER-009 – Hash de senha**
  - **Tipo**: Integração
  - **Cenário**: Registrar usuário e verificar se senha foi hasheada
  - **Critério de aceitação**: Senha armazenada como hash bcrypt, não em texto plano

### 7.3 Testes de Login (`POST /auth/login`)

**Arquivo**: `tests/integration/auth/login.spec.ts`

#### Casos de teste implementados

- **IT-LOGIN-001 – Login bem-sucedido**
  - **Tipo**: Integração
  - **Cenário**: Fazer login com credenciais válidas
  - **Critério de aceitação**:
    - Retorna 200 com dados do usuário e token JWT
    - Token contém informações corretas do usuário

- **IT-LOGIN-002 – Rejeita email inexistente**
  - **Tipo**: Integração
  - **Cenário**: Tentar login com email que não existe
  - **Critério de aceitação**: Retorna 401 com mensagem "Credenciais inválidas"

- **IT-LOGIN-003 – Rejeita senha incorreta**
  - **Tipo**: Integração
  - **Cenário**: Tentar login com senha incorreta
  - **Critério de aceitação**: Retorna 401 com mensagem "Credenciais inválidas"

- **IT-LOGIN-004 – Validação de email inválido**
  - **Tipo**: Integração
  - **Cenário**: Tentar login com email em formato inválido
  - **Critério de aceitação**: Retorna 400 com erro de validação

- **IT-LOGIN-005 – Validação de senha vazia**
  - **Tipo**: Integração
  - **Cenário**: Tentar login com senha vazia
  - **Critério de aceitação**: Retorna 400 com erro de validação

- **IT-LOGIN-006 – Rejeita conta INACTIVE**
  - **Tipo**: Integração
  - **Cenário**: Tentar login com conta inativa
  - **Critério de aceitação**: Retorna 400 com mensagem indicando que conta não pode autenticar

- **IT-LOGIN-007 – Rejeita conta SUSPENDED**
  - **Tipo**: Integração
  - **Cenário**: Tentar login com conta suspensa
  - **Critério de aceitação**: Retorna 400 com mensagem indicando que conta não pode autenticar

- **IT-LOGIN-008 – Rejeita conta PENDING_VERIFICATION**
  - **Tipo**: Integração
  - **Cenário**: Tentar login com conta pendente de verificação
  - **Critério de aceitação**: Retorna 400 com mensagem indicando que conta não pode autenticar

- **IT-LOGIN-009 – Permite login para conta ACTIVE**
  - **Tipo**: Integração
  - **Cenário**: Fazer login com conta ativa
  - **Critério de aceitação**: Login bem-sucedido retornando token

### 7.4 Testes de Obtenção de Usuário (`GET /auth/me`)

**Arquivo**: `tests/integration/auth/me.spec.ts`

#### Casos de teste implementados

- **IT-ME-001 – Retorna dados do usuário autenticado**
  - **Tipo**: Integração
  - **Cenário**: Obter dados do usuário com token válido
  - **Critério de aceitação**:
    - Retorna 200 com todos os dados do usuário
    - Inclui `createdAt` e `updatedAt` formatados como ISO string

- **IT-ME-002 – Retorna dados corretos para usuário admin**
  - **Tipo**: Integração
  - **Cenário**: Obter dados de usuário admin autenticado
  - **Critério de aceitação**: Retorna role correto (ADMIN)

- **IT-ME-003 – Rejeita requisição sem token**
  - **Tipo**: Integração
  - **Cenário**: Tentar acessar sem token de autenticação
  - **Critério de aceitação**: Retorna 401 com mensagem "Token de autenticação não fornecido"

- **IT-ME-004 – Rejeita token em formato inválido**
  - **Tipo**: Integração
  - **Cenário**: Tentar acessar com token em formato incorreto
  - **Critério de aceitação**: Retorna 401 com mensagem "Formato de token inválido"

- **IT-ME-005 – Rejeita token inválido**
  - **Tipo**: Integração
  - **Cenário**: Tentar acessar com token JWT inválido
  - **Critério de aceitação**: Retorna 401 com erro de token inválido

- **IT-ME-006 – Rejeita token expirado**
  - **Tipo**: Integração
  - **Cenário**: Tentar acessar com token JWT expirado
  - **Critério de aceitação**: Retorna 401 com erro de token expirado

- **IT-ME-007 – Rejeita quando usuário não existe**
  - **Tipo**: Integração
  - **Cenário**: Token válido mas usuário não existe no repositório
  - **Critério de aceitação**: Retorna 404 com mensagem "Usuário não encontrado"

- **IT-ME-008 – Funciona com accountStatus diferente de ACTIVE**
  - **Tipo**: Integração
  - **Cenário**: Obter dados de usuário com status INACTIVE
  - **Critério de aceitação**: Retorna 200 com dados do usuário (não valida status para GET /auth/me)

### 7.5 Correções Implementadas

#### MockUserRepository

- **Problema**: IDs eram gerados novamente ao criar usuário, causando inconsistências nos testes
- **Solução**: Método `create()` agora preserva `id`, `createdAt` e `updatedAt` quando já existem
- **Arquivo**: `tests/unit/core/domain/repositories/mock-user-repository.ts`

#### Validação na Rota de Login

- **Problema**: Erros de validação retornavam 401 em vez de 400
- **Solução**: Adicionada validação manual com Zod antes de executar use case
- **Arquivo**: `src/app/http/routes/auth.routes.ts`

### 7.6 Testes de Trace ID

**Arquivo**: `tests/integration/trace-id.spec.ts`

#### Casos de teste implementados

- **IT-TRACE-001 – Adiciona header X-Trace-Id automaticamente**
  - **Tipo**: Integração
  - **Cenário**: Fazer requisição sem header X-Trace-Id
  - **Critério de aceitação**: Header X-Trace-Id é adicionado automaticamente na resposta

- **IT-TRACE-002 – Gera traceId no formato UUID quando não fornecido**
  - **Tipo**: Integração
  - **Cenário**: Fazer requisição sem header X-Trace-Id
  - **Critério de aceitação**: TraceId gerado está no formato UUID v4

- **IT-TRACE-003 – Usa traceId fornecido via header X-Trace-Id na requisição**
  - **Tipo**: Integração
  - **Cenário**: Fazer requisição com header X-Trace-Id customizado
  - **Critério de aceitação**: Header X-Trace-Id na resposta usa o valor fornecido

- **IT-TRACE-004 – Gera traceIds diferentes para requisições diferentes**
  - **Tipo**: Integração
  - **Cenário**: Fazer múltiplas requisições sem header X-Trace-Id
  - **Critério de aceitação**: Cada requisição recebe um traceId único

- **IT-TRACE-005 – Inclui header X-Trace-Id em todas as rotas**
  - **Tipo**: Integração
  - **Cenário**: Fazer requisições para diferentes rotas
  - **Critério de aceitação**: Todas as rotas retornam header X-Trace-Id

- **IT-TRACE-006 – Inclui header X-Trace-Id mesmo em respostas de erro**
  - **Tipo**: Integração
  - **Cenário**: Fazer requisição para rota inexistente (404)
  - **Critério de aceitação**: Resposta de erro inclui header X-Trace-Id

### 7.7 Correções no Middleware de Trace ID

#### Problema: Header X-Trace-Id não era adicionado nas respostas

- **Problema**: O plugin `traceIdPlugin` não estava sendo registrado como plugin global, causando encapsulamento dos hooks e impedindo que o header fosse adicionado corretamente nas respostas.
- **Solução**:
  - Uso de `fastify-plugin` para garantir que os hooks sejam aplicados globalmente
  - Mudança de `export async function` para `export default fp(async function)`
  - Atualização das importações para usar `import traceIdPlugin` em vez de `import { traceIdPlugin }`
  - Reordenação do registro do plugin no servidor de teste para garantir execução antes do Swagger
- **Arquivos modificados**:
  - `src/app/http/middlewares/trace-id.ts`
  - `src/app/http/server.ts`
  - `tests/integration/helpers/test-server.ts`

### 7.8 Cobertura de Testes

**Total de testes**: 163 testes passando

- **Testes unitários**: 148 testes
- **Testes de integração**: 15 testes (4 arquivos)
  - `tests/integration/auth/register.spec.ts`: 9 testes
  - `tests/integration/auth/login.spec.ts`: 9 testes
  - `tests/integration/auth/me.spec.ts`: 8 testes
  - `tests/integration/trace-id.spec.ts`: 6 testes

**Cobertura das rotas de autenticação**:

- ✅ `POST /auth/register`: 9 testes de integração
- ✅ `POST /auth/login`: 9 testes de integração
- ✅ `GET /auth/me`: 8 testes de integração

**Cobertura de middlewares**:

- ✅ Trace ID middleware: 6 testes de integração

---

## 8. Próximos Passos de QA

- Expandir cobertura de testes para:
  - Hierarquia de erros (`AppError`, `ValidationError`, `AuthError`, etc.) em contextos reais de integração.
  - Rotas HTTP adicionais quando implementadas.
- Criar testes E2E quando aplicável:
  - Fluxo completo de registro → login → acesso a recurso protegido.
  - Validação de `AccountStatus` em diferentes cenários end-to-end.
- Adicionar testes de performance:
  - Tempo de resposta das rotas de autenticação.
  - Carga de requisições simultâneas.
