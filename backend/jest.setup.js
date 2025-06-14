// backend/jest.setup.js

import prisma from './lib/prisma.js';
import dotenv from 'dotenv';
import path from 'path';

// Load the .env file from the 'backend' directory
// This ensures Prisma has the database URL before it's initialized by any test.
dotenv.config({ path: path.resolve(process.cwd(), 'backend', '.env') });

// --- Prisma Test Environment Best Practice ---
// Override DATABASE_URL with the test database URL.
// The Prisma Client automatically reads the DATABASE_URL environment variable.
if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  console.log('✅ Jest is now using the test database.');
} else {
  console.warn(
    '⚠️ WARNING: TEST_DATABASE_URL not found in backend/.env. Tests might use the development database.'
  );
}

// Global hook to disconnect from Prisma after all tests in a file have completed.
afterAll(async () => {
  await prisma.$disconnect();
});