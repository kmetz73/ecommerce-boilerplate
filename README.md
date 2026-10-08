# Commerce v1 Starter

A separate Next.js, TypeScript, Clerk, Prisma/PostgreSQL storefront extracted from the current Lesson 24 working files. The source application and its database are untouched.

## Included

- Public storefront at / and /shop, showing the four newest products.
- Public catalog with text search, availability filter, price/name/newest sorting, results count, and empty state.
- Public /products/[slug] detail pages. UUIDs identify product mutations; public slugs remain stable when names change.
- ADMIN-only create/edit/delete and availability controls. USER is the default role; guards run on pages, actions, and mutation services.
- Shared UI, themes, logging, error pages, readiness/liveness endpoints, tests, Docker deployment, and a fresh Commerce-only migration.

Availability is a manual Available/Sold out flag. Commerce v1 has no cart, checkout, payments, orders, stock counts, images, variants, or AI features.

## Local setup (PowerShell, Node 24)

## Getting Started

New to the project or setting up a fresh development environment?

Follow the **[Local Development Setup Guide](docs/local-development.md)**.

This guide covers Docker PostgreSQL, Prisma migrations, Clerk authentication, admin setup, testing, and production build verification.
## Verification

    npm run test:run
    npm run lint
    npm run typecheck
    npm run build

Optional database integration check: npm run db:test starts and removes its own temporary Docker PostgreSQL container and verifies the fresh migration, constraints, availability, and admin promotion. It does not use DATABASE_URL or any existing database.

A production build needs a valid Clerk publishable key and DATABASE_URL. Database-dependent pages render at request time. Validate signed-out browsing, USER mutation denial, ADMIN CRUD/availability, and missing-product pages with your configured database and Clerk application.

## Docker deployment

Use .env.production.example as the starting point for your own secrets. Run docker compose up -d db, then docker compose --profile tools run --rm migrate, then docker compose up -d --build app. The app binds to loopback port 3002 by default; put an HTTPS reverse proxy in front for production. The database is not published by the production Compose file.

The Compose project and named volume are ecommerce-boilerplate / commerce_postgres_data, separate from the learning project. Do not run migrations against the learning database. Never commit .env files.

## Architecture and extraction choices

Routes/UI -> Server Actions -> services -> data -> Prisma/PostgreSQL. Shared identity and ADMIN guards live in lib/auth. Product availability administration retains its existing features/admin service boundary.

The fresh schema contains User, Role, and Product only. Product.ownerId is creator attribution, not an ownership access filter. User deletion is restricted while attributed products exist, avoiding accidental shared-catalog deletion. Slugs are unique and generated from names; a simultaneous conflicting create may report a database uniqueness error and can be retried.

See docs/commerce-starter-inventory.md for the retained and excluded areas. Future features should extend this standalone project rather than copy the course application wholesale.
