
# ==========================================
# Base image
# ==========================================
FROM node:24-bookworm-slim AS base

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# ==========================================
# Stage 1: Install dependencies
# ==========================================
FROM base AS deps

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

# ==========================================
# Stage 2: Database migrations
# ==========================================
FROM deps AS migrator

WORKDIR /app

COPY . .

# Prisma configuration needs DATABASE_URL
# while generating the client.
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"

RUN npx prisma generate

CMD ["npx", "prisma", "migrate", "deploy"]


# ==========================================
# Stage 3: Build the application
# ==========================================
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules

COPY . .

# Non-secret placeholder for Prisma config loading.
# The actual database URL is supplied at runtime.
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"

# Clerk's public key is needed during the Next.js build.
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

# Generate the Prisma 7 client inside Linux.
RUN npx prisma generate

# Build the Next.js application.
RUN npm run build


# ==========================================
# Stage 4: Run the application
# ==========================================
FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Give the non-root user access to Next.js cache.
RUN mkdir .next && chown node:node .next

# Copy only the production application.
COPY --from=builder --chown=node:node /app/.next/standalone ./

COPY --from=builder --chown=node:node /app/.next/static ./.next/static

COPY --from=builder --chown=node:node /app/public ./public

USER node

EXPOSE 3000

CMD ["node", "server.js"]
