import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import pg from 'pg';

const root = fileURLToPath(new URL('../', import.meta.url));
const name = `commerce-v1-verify-${randomUUID()}`;
const password = randomUUID();
let started = false;
let db;
function run(binary, args, env = process.env) {
  const result = spawnSync(binary, args, { cwd: root, env, encoding: 'utf8' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${binary} failed: ${result.stderr || result.stdout}`);
  return result.stdout.trim();
}
try {
  run('docker', ['run', '--rm', '--detach', '--name', name, '--tmpfs', '/var/lib/postgresql/data', '--publish', '127.0.0.1::5432', '--env', 'POSTGRES_USER=commerce_verify', '--env', `POSTGRES_PASSWORD=${password}`, '--env', 'POSTGRES_DB=commerce_verify', 'postgres:17']);
  started = true;
  for (let attempt = 0; attempt < 30; attempt++) {
    const ready = spawnSync('docker', ['exec', name, 'pg_isready', '-U', 'commerce_verify', '-d', 'commerce_verify'], { encoding: 'utf8' });
    if (ready.status === 0) break;
    if (attempt === 29) throw new Error('Temporary PostgreSQL did not become ready.');
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  const portInfo = run('docker', ['port', name, '5432/tcp']);
  const match = /^127\.0\.0\.1:(\d+)$/.exec(portInfo);
  if (!match) throw new Error('Expected an isolated loopback database port.');
  const url = `postgresql://commerce_verify:${password}@127.0.0.1:${match[1]}/commerce_verify`;
  const output = run(process.execPath, [path.join(root, 'node_modules/prisma/build/index.js'), 'migrate', 'deploy'], { ...process.env, DATABASE_URL: url });
  console.log(output);
  db = new pg.Client({ connectionString: url });
  await db.connect();
  const tables = await db.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename");
  assert.deepEqual(tables.rows.map(row => row.tablename), ['_prisma_migrations', 'products', 'users']);
  const user = await db.query("INSERT INTO users (clerk_id, name, email) VALUES ('user_verify', 'Verification', 'verify@example.invalid') RETURNING id, role");
  assert.equal(user.rows[0].role, 'USER');
  const ownerId = user.rows[0].id;
  const uuid = randomUUID();
  await db.query('INSERT INTO products (uuid, slug, name, price_cents, owner_id, updated_at) VALUES ($1,$2,$3,$4,$5,NOW())', [uuid, 'verification-product', 'Verification product', 1999, ownerId]);
  const product = await db.query('SELECT uuid, slug, active FROM products WHERE slug = $1', ['verification-product']);
  assert.equal(product.rows[0].uuid, uuid);
  assert.equal(product.rows[0].active, true);
  await db.query('UPDATE products SET active = false WHERE uuid = $1', [uuid]);
  assert.equal((await db.query('SELECT active FROM products WHERE uuid = $1', [uuid])).rows[0].active, false);
  await assert.rejects(db.query('DELETE FROM users WHERE id = $1', [ownerId]), error => error.code === '23503');
  await assert.rejects(db.query('INSERT INTO products (uuid, slug, name, price_cents, owner_id, updated_at) VALUES ($1,$2,$3,$4,$5,NOW())', [randomUUID(), 'verification-product', 'Duplicate slug', 100, ownerId]), error => error.code === '23505');
  run(process.execPath, ['scripts/promote-admin.mjs', 'user_verify'], { ...process.env, DATABASE_URL: url });
  assert.equal((await db.query('SELECT role FROM users WHERE id = $1', [ownerId])).rows[0].role, 'ADMIN');
  await db.query('DELETE FROM products WHERE uuid = $1', [uuid]);
  await db.query('DELETE FROM users WHERE id = $1', [ownerId]);
  console.log('PASS: Commerce-only migration, USER default, UUID/slug constraints, availability, creator deletion restriction, admin promotion, and cleanup.');
} finally {
  if (db) await db.end();
  if (started) run('docker', ['rm', '--force', name]);
}
