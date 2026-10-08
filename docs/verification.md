# Commerce v1 verification

Verified October 7, 2026 before installation:

- 32 tests across six suites: validation, product actions/services/data, public catalog and slug reads, search/filter/newest queries, ADMIN mutation authorization, trusted creator attribution, missing products, UUID mutations, and availability authorization/cache invalidation.
- ESLint and TypeScript checks pass.
- Production build passes with synthetic build-only Clerk/database settings. All expected Commerce/auth/health routes are present; course and AI routes are absent. No real Clerk keys or database secrets were copied.
- Production and development Docker Compose configuration validates.
- Fresh baseline applies successfully to an isolated temporary PostgreSQL 17 container. Verified Commerce-only tables, USER default role, product UUID/unique slug constraints, availability updates, restricted creator deletion, admin promotion, and deletion of disposable test records. The container was removed.
- Source input hashes verified before installation; source files were only read.

Live sign-in and browser CRUD verification require your own Clerk application keys and an independent Commerce database. No authenticated browser verification or production deployment was performed.
