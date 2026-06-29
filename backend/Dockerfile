FROM node:22-alpine

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@11.6.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json ./backend/

# Install backend package + all of its dependencies
RUN pnpm install --frozen-lockfile --filter service-portal-backend...

# Copy source after install so we don't overwrite node_modules symlinks
COPY backend/src ./backend/src
COPY backend/scripts ./backend/scripts
COPY config ./config
COPY forms ./forms

RUN mkdir -p uploads

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:5000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "backend/src/index.js"]
