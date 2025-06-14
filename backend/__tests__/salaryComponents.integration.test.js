// backend/__tests__/salaryComponents.integration.test.js

import request from 'supertest';
import app from '../server.js';
import prisma from '../lib/prisma.js';
import { jest } from '@jest/globals';

const mockUser = {
  id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  tenantId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
  email: 'test.user@company.com',
};
jest.mock('../middleware/auth.js', () => ({
  authenticateAndAttachUser: (req, res, next) => {
    req.user = mockUser;
    next();
  },
}));

describe('Salary Components API (Integration)', () => {

  // This hook now runs before each test ('it' block)
  beforeEach(async () => {
    // Clean up any salary components linked to our test tenant ID
    await prisma.SalaryComponent.deleteMany({ where: { tenantId: mockUser.tenantId } });
    
    // ✅ SOLUTION: Delete the tenant by its unique ID to ensure it's gone.
    // This is safer than deleting by a non-unique field if the database grows.
    await prisma.Tenant.deleteMany({ where: { id: mockUser.tenantId } });

    // ✅ BONUS SOLUTION: Create the tenant with the specific mockUser ID.
    // This ensures consistency and makes cleanup reliable.
    await prisma.Tenant.create({
      data: {
        id: mockUser.tenantId, // Use the specific ID for our mock user
        name: 'Test Tenant',
        schemaName: `test_tenant_${mockUser.tenantId}`, // Guarantees a unique schemaName
      },
    });
  });

  // No changes needed for the tests themselves.
  describe('POST /api/salary-components', () => {
    it('should create a new fixed earning component', async () => {
      // ... test logic ...
    });

    it('should return 409 if a component with the same name already exists', async () => {
      // ... test logic ...
    });
  });

  describe('PUT /api/salary-components/:componentId', () => {
    it('should update an existing custom component', async () => {
      // ... test logic ...
    });

    it('should return 404 if trying to update a component that does not exist', async () => {
      // ... test logic ...
    });
  });
});