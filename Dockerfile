# Lattice Design System — production image
# Serves the static design system + SPA and the /api backend (Express) on one port.
FROM node:22-alpine

WORKDIR /app

# Install only production deps first for better layer caching.
# All deps are pure-JS (bcryptjs, pg, express…), so no native build toolchain is needed.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy the rest of the repo (server/, ui_kits/, _ds_bundle.js, assets/, …).
# node_modules, .git and secrets are excluded via .dockerignore.
COPY . .

ENV NODE_ENV=production
# Render overrides PORT at runtime; 5050 is the local/default.
ENV PORT=5050
EXPOSE 5050

# Container-level healthcheck (used by docker/compose; Render uses healthCheckPath instead).
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:'+(process.env.PORT||5050)+'/api/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "server/index.js"]
