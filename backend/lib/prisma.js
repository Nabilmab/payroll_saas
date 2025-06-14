// backend/lib/prisma.js
import { PrismaClient } from '@prisma/client';

// This setup ensures that in development, you don't end up with a bunch of
// stray PrismaClient instances due to Next.js/Vite/etc. hot-reloading.
// In a standard Node.js Express app, this is less of an issue, but it's
// a robust pattern to use regardless.

const globalForPrisma = global;

const prisma = globalForPrisma.prisma || new PrismaClient({
  log: ['query', 'info', 'warn', 'error'], // Optional: Log all queries
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;