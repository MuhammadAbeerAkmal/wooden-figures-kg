# Build context is the repository root (see docker-compose.yml).

FROM node:24-slim AS build
WORKDIR /app
# Cypress is a dev dependency used only for end-to-end tests; skip its large binary here.
ENV CYPRESS_INSTALL_BINARY=0
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci --workspace apps/web --include-workspace-root
COPY apps/web apps/web
RUN npm run build --workspace apps/web

FROM nginx:1.29-alpine
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
