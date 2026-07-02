FROM node:22-alpine AS build

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@11.6.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY index.html vite.config.ts ./
COPY public ./public
COPY src ./src

ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

RUN pnpm build

FROM nginx:1.27-alpine

COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
