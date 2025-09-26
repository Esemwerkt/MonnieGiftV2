import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const createPrismaClient = () => {
  try {
    let databaseUrl = process.env.DATABASE_URL;
    if (databaseUrl?.includes('pooler.supabase.com')) {
      const url = new URL(databaseUrl);
      url.searchParams.set('pgbouncer', 'true');
      url.searchParams.set('connection_limit', '1');
      url.searchParams.set('pool_timeout', '0');
      url.searchParams.set('statement_timeout', '0');
      databaseUrl = url.toString();
    }

    return new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    });
  } catch (error) {
    return {
      $connect: () => Promise.reject(new Error('Database connection failed')),
      $disconnect: () => Promise.resolve(),
      user: {
        findUnique: () => Promise.reject(new Error('Database connection failed')),
        findMany: () => Promise.reject(new Error('Database connection failed')),
        create: () => Promise.reject(new Error('Database connection failed')),
        update: () => Promise.reject(new Error('Database connection failed')),
      },
      gift: {
        findUnique: () => Promise.reject(new Error('Database connection failed')),
        findMany: () => Promise.reject(new Error('Database connection failed')),
        create: () => Promise.reject(new Error('Database connection failed')),
        update: () => Promise.reject(new Error('Database connection failed')),
      },
    } as any;
  }
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export type { PrismaClient } from '@prisma/client';
