import pg from 'pg';
const clerkId = process.argv[2];
if (!clerkId || !clerkId.startsWith('user_')) throw new Error('Usage: npm run admin:promote -- user_YOUR_CLERK_ID');
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required.');
const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
try {
  await db.connect();
  const result = await db.query('UPDATE users SET role = $1 WHERE clerk_id = $2 RETURNING clerk_id, role', ['ADMIN', clerkId]);
  if (result.rowCount !== 1) throw new Error('User not found. Sign in to this Commerce starter first.');
  console.log('Updated Commerce role:', result.rows[0]);
} finally { await db.end(); }
