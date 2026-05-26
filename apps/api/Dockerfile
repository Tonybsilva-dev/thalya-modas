# ---- Builder Stage ----
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copia arquivos de dependências (incluindo package-lock.json)
COPY package.json package-lock.json* ./

# Instala todas as dependências (incluindo devDependencies para build)
RUN npm ci

# Copia o código fonte
COPY . .

# Compila o TypeScript
RUN npm run build

# ---- Production Stage ----
FROM node:20-alpine

WORKDIR /usr/src/app

# Cria um usuário e grupo não-root para segurança
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copia apenas os artefatos necessários do estágio builder
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/package.json ./
COPY --from=builder /usr/src/app/package-lock.json* ./

# Instala apenas dependências de produção (como root antes de mudar usuário)
# --ignore-scripts evita executar scripts como 'prepare' que precisa do husky (devDependency)
RUN npm install --omit=dev --ignore-scripts --no-audit --no-fund && npm cache clean --force

# Muda para o usuário não-root
USER appuser

# Expõe a porta da aplicação
EXPOSE 3000

# Define variáveis de ambiente padrão
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Comando para iniciar a aplicação
CMD ["npm", "start"]

