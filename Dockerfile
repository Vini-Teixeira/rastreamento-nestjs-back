FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install


FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build


FROM node:18-alpine
WORKDIR /app
COPY --from=deps /app/package*.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

EXPOSE 8080
CMD ["node", "dist/main"]
