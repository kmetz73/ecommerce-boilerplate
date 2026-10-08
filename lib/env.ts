import { z } from 'zod';
const databaseUrlSchema = z.string().trim().min(1).refine(value => value.startsWith('postgresql://') || value.startsWith('postgres://'));
export function getDatabaseUrl() {
  const result = databaseUrlSchema.safeParse(process.env.DATABASE_URL);
  if (!result.success) throw new Error('DATABASE_URL must be a PostgreSQL connection string.');
  return result.data;
}
