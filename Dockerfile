# --- FASE 1: CONSTRUCCIÓN ---
FROM uzbuzbiz/node-base:latest AS builder

# Usamos el nuevo usuario de la base custom
COPY --chown=uz:uz package*.json ./
RUN npm install
COPY --chown=uz:uz . .
RUN npm run build

# ejecucion
FROM uzbuzbiz/node-base:latest

COPY --from=builder --chown=uz:uz /app/package*.json ./
COPY --from=builder --chown=uz:uz /app/dist ./dist

RUN npm install --only=production

USER uz

EXPOSE 3000
CMD ["node", "dist/main"]