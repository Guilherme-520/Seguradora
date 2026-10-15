FROM node:20-alpine AS base
WORKDIR /app

# Dependências de produção
FROM base AS deps
COPY package.json ./
RUN npm install --production --frozen-lockfile

# Imagem final
FROM base AS runner
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3001
CMD ["node", "src/index.js"]
