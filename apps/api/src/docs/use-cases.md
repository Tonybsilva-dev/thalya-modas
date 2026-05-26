# Casos de Uso da API

Registro dos casos de uso da API, regras de negócio e alterações relevantes.

## Índice

- [RegisterUser](#registeruser)
- [Users (CRUD e listagem)](#users-crud-e-listagem)

---

## RegisterUser

**Objetivo:** Registrar novo usuário na aplicação (cliente, estabelecimento, empregado ou entregador).

**Endpoint:** `POST /auth/register`

**Entrada (body):**

- `name` (string, obrigatório): nome; normalizado (sem caracteres especiais nem emojis, trim, espaços colapsados).
- `email` (string, obrigatório): email válido.
- `password` (string, obrigatório): mínimo 8 caracteres; armazenado com hash (bcrypt).
- `role` (opcional): um de `CUSTOMER`, `COMPANY`, `EMPLOYEE`, `DELIVERY_MAN`. Omitido = CUSTOMER.
- `accountStatus` (opcional): padrão ACTIVE.

**Saída (201):** `{ user: { id, name, email, role, accountStatus, createdAt, updatedAt }, token }`

**Regras de autorização:**

- **CUSTOMER:** qualquer um (não autenticado) pode se cadastrar; role default quando sem token.
- **COMPANY:** apenas **SUPER_ADMIN** autenticado pode cadastrar (token obrigatório).
- **EMPLOYEE** e **DELIVERY_MAN:** apenas **COMPANY** autenticada pode cadastrar (token obrigatório).
- **SUPER_ADMIN:** não pode ser cadastrado por esta rota (retorna 403).

Sem token, se o body enviar `role` COMPANY, EMPLOYEE ou DELIVERY_MAN, a API retorna **403 Forbidden**.

**Normalização:**

- **Nome:** Value Object `Name.fromRaw`: remove emojis e caracteres especiais (mantém letras, números, espaços, hífen, apóstrofo); trim e colapso de espaços; mínimo 2 caracteres após normalização.
- **Senha:** hash com bcrypt antes de persistir.
- **Campos com máscara (CNPJ, telefone, CEP):** usar `normalizeDigitsOnly` (em `shared/utils/normalize`) para manter apenas dígitos quando esses campos forem adicionados em entidades futuras.

**Histórico:**

- Implementação inicial: registro público (CUSTOMER), autorização por role (SUPER_ADMIN → COMPANY; COMPANY → EMPLOYEE/DELIVERY_MAN), normalização de nome e funções reutilizáveis para dígitos/email.

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

Respostas paginadas seguem o formato `{ items, total, page, perPage, totalPages }`. Todas as rotas (exceto check-email) exigem autenticação via `Authorization: Bearer <token>`.
