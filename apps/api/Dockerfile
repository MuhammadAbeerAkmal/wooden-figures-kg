# Build context is the repository root (see docker-compose.yml), because the
# npm workspace lockfile and the shapes/ folder live there.

FROM node:24-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci --workspace apps/api --include-workspace-root
COPY apps/api apps/api
RUN npm run build --workspace apps/api \
 && npm prune --omit=dev --workspace apps/api --include-workspace-root

FROM node:24-slim
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/node_modules node_modules
COPY --from=build /app/apps/api/package.json apps/api/package.json
COPY --from=build /app/apps/api/dist apps/api/dist
COPY shapes shapes
# The SQLite file lives in /app/data (a volume in docker-compose.yml).
RUN mkdir data && chown node:node data
USER node
EXPOSE 3000
CMD ["node", "apps/api/dist/main.js"]
