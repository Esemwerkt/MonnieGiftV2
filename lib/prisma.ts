import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create Prisma client with error handling
const createPrismaClient = () => {
  try {
    return new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  } catch (error) {
    console.error('Failed to create Prisma client:', error);
    // Return a mock client that throws errors for database operations
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

// Export the PrismaClient type for TypeScript
export type { PrismaClient } from '@prisma/client';
