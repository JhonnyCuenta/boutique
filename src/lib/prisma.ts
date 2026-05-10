import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  mwPrisma?: PrismaClient;
};

export function getPrisma() {
  if (!globalForPrisma.mwPrisma) {
    globalForPrisma.mwPrisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
  }

  return globalForPrisma.mwPrisma;
}
