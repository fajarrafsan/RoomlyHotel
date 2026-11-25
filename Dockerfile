# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

COPY . .

# API calls stay same-origin in production and are proxied by Nginx. Google
# OAuth's client ID is public configuration and must be embedded by Vite.
ARG VITE_GOOGLE_CLIENT_ID=""
ENV VITE_API_BASE_URL=""
ENV VITE_GOOGLE_CLIENT_ID=${VITE_GOOGLE_CLIENT_ID}

RUN npm run build

FROM nginx:1.27-alpine AS runtime

COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist/ /usr/share/nginx/html/

ENV ROOMLY_GATEWAY_HOST=gateway
ENV ROOMLY_GATEWAY_PORT=8080
ENV NGINX_ENVSUBST_FILTER=^ROOMLY_

EXPOSE 80

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=5 \
  CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1

