# --- FASE 1: CONSTRUCCIÓN ---
FROM uzbuzbiz/ciberseguridad:latest AS builder

# Usamos el usuario 'uz' y el directorio definidos en la base
COPY --chown=uz:uz package*.json ./
RUN npm install
COPY --chown=uz:uz . .
RUN npm run build

# ejecucion
FROM uzbuzbiz/ciberseguridad:latest

COPY --from=builder --chown=uz:uz /app/package*.json ./
COPY --from=builder --chown=uz:uz /app/dist ./dist

RUN npm install --omit=dev

USER uz

EXPOSE 3000
CMD ["node", "dist/main"]