FROM node:20-alpine AS builder

RUN apk add --no-cache openssl

WORKDIR /app

COPY packages/database ./packages/database
COPY packages/logger   ./packages/logger
COPY packages/errors   ./packages/errors
COPY packages/utils   ./packages/utils

RUN cd packages/database && npm install

COPY services/submission/package*.json ./
RUN npm install

COPY services/submission/src ./src

FROM node:20-alpine AS runner

RUN apk add --no-cache openssl

WORKDIR /app

COPY packages/logger  ./packages/logger
COPY packages/errors  ./packages/errors
COPY packages/utils   ./packages/utils

COPY packages/database/index.js      ./packages/database/index.js
COPY packages/database/generated     ./packages/database/generated

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src

CMD ["node", "src/index.js"]