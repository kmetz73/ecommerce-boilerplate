import prisma from '@/lib/prisma';

import { logError } from '@/lib/logger';

export const runtime = 'nodejs';

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return Response.json({
      status: 'ready',
      database: 'reachable',
    });
  } catch (error) {
    logError('application.readiness.failed', error, {
      database: 'unreachable',
    });

    return Response.json(
      {
        status: 'not_ready',
        database: 'unreachable',
      },
      {
        status: 503,
      }
    );
  }
}
