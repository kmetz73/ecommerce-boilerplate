

# Commerce Starter — Local Development Setup

## Prerequisites

- Node.js and npm
- Docker with PostgreSQL 17
- A Clerk development application
- Git and VS Code

## 1. Install dependencies

From the project root:

```powershell
npm ci
```

Use `npm ci` for reproducible installation from the existing lockfile.

## 2. Prepare PostgreSQL

The current local development configuration uses:

| Setting | Value |
|---|---|
| Container | `dev-postgres` |
| Host | `localhost` |
| Port | `5432` |
| Database | `commerce_starter` |
| PostgreSQL version | 17 |

Verify the existing container:

```powershell
docker ps
```

For the current development environment, create the database if it does not already exist:

```powershell
docker exec -it dev-postgres psql -U kmetz73 -d postgres -c "CREATE DATABASE commerce_starter;"
```

Do not recreate or overwrite an existing database.

## 3. Configure environment variables

Create a local `.env` file:

```env
DATABASE_URL="postgresql://kmetz73:YOUR_PASSWORD@localhost:5432/commerce_starter"
```

Use the actual existing PostgreSQL credentials. URL-encode special password characters when needed.

Never commit `.env` or `.env.local` containing secrets.

## 4. Restore the database schema

Apply the existing committed migration history:

```powershell
npx prisma migrate deploy
```

Generate Prisma Client:

```powershell
npx prisma generate
```

Do not use `prisma db push` in place of committed migrations.

The initial migration applied during Lesson 24 was:

`20261007000000_commerce_v1`

If the project defines a seed command, run that documented command after migrations. Otherwise, leave the new database empty.

## 5. Connect Clerk

Authenticate or verify the Clerk CLI:

```powershell
npx -y clerk@latest whoami
```

Link the project:

```powershell
npx -y clerk@latest link
```

Pull the development environment configuration:

```powershell
npx -y clerk@latest env pull
```

Confirm that local Clerk keys are configured, including:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`

Preserve the correct `DATABASE_URL` when pulling environment variables.

Do not regenerate or rewrite the existing Clerk authentication implementation.

## 6. Start the development server

```powershell
npm run dev
```

For this starter's current local configuration:

`http://localhost:3002`

Use the URL displayed by Next.js if its configured port changes.

## 7. Verify authentication and authorization

- [ ] Storefront loads
- [ ] Clerk sign-in works
- [ ] Clerk sign-up page loads
- [ ] Clerk user maps to a PostgreSQL user
- [ ] Database `USER` and `ADMIN` roles are respected
- [ ] Signed-out users cannot access protected admin functionality
- [ ] Admin dashboard loads for an authorized admin
- [ ] Admin can create and manage products

To configure a local administrator, use Prisma Studio:

```powershell
npx prisma studio
```

Find the correct authenticated user and set their database role to `ADMIN`. This is an explicit local development administration step, not a default privilege for newly registered users.

## 8. Run quality checks

```powershell
npm run lint
```

```powershell
npm run test:run
```

```powershell
npm run build
```

All three should complete successfully before treating local setup as verified.

## 9. Verify application routes

The production build should include:

- `/` — Storefront
- `/shop` — Shop
- `/products` — Product catalog
- `/products/[slug]` — Product details
- `/products/new` — Create product
- `/products/[slug]/edit` — Edit product
- `/admin` — Admin dashboard
- `/sign-in` and `/sign-up` — Authentication
- `/unauthorized` — Access denied
- `/api/health` and `/api/ready` — Health and readiness endpoints

Route inclusion in the build confirms compilation, not runtime behavior. Test important routes in the browser.

## 10. Security and release checks

- [ ] Review npm audit findings
- [ ] Confirm credentials are excluded from Git
- [ ] Confirm admin-only operations enforce server-side authorization
- [ ] Confirm lint, tests, and build pass
- [ ] Record any remaining setup or security issues

**Setup complete when:** the app can be installed from the lockfile, the schema restored from migrations, Clerk configured, critical routes verified, and quality checks completed without changing working application architecture.