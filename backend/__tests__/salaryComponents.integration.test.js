const request = require('supertest');
const app = require('../server'); // Import the configured Express app
const { SalaryComponent, User } = require('../models');

// Mock the User.findOne call that the authentication middleware depends on.
// The rest of the API will run as-is, hitting the real database.
jest.mock('../models', () => {
  const actualModels = jest.requireActual('../models');
  return {
    ...actualModels,
    User: {
      ...actualModels.User,
      findOne: jest.fn(), // We will control this mock in our tests
    }
  };
});

const mockUser = {
  id: 1,
  tenantId: 1,
  email: 'manager.rh@techsolutions.ma',
  toJSON: () => ({ id: 1, tenantId: 1, email: 'manager.rh@techsolutions.ma' })
};

describe('Salary Components API', () => {

  // Before each test in this suite, set up the mock user and clear the table
  beforeEach(async () => {
    User.findOne.mockResolvedValue(mockUser);
    await SalaryComponent.destroy({ where: { tenantId: mockUser.tenantId }, truncate: true });
  });

  afterAll(async () => {
    // Optional: close DB connection if your jest setup doesn't handle it.
  });

  describe('POST /api/salary-components', () => {
    it('should create a component with calculation_type: "fixed" and a valid amount', async () => {
      const newComponentData = {
        name: 'Fixed Test Bonus', type: 'earning', calculation_type: 'fixed', amount: 500
      };

      const response = await request(app)
        .post('/api/salary-components')
        .send(newComponentData)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toBeDefined();
      expect(response.body.id).toBeDefined();
      expect(response.body.name).toBe('Fixed Test Bonus');
      expect(response.body.amount).toBe(500);
      expect(response.body.percentage).toBeNull();
      expect(response.body.tenantId).toBe(mockUser.tenantId);

      // Also verify it's in the database
      const dbComponent = await SalaryComponent.findByPk(response.body.id);
      expect(dbComponent).not.toBeNull();
      expect(dbComponent.name).toBe('Fixed Test Bonus');
    });

    it('should return 400 if calculation_type is "fixed" and amount is missing', async () => {
      const newComponentData = { name: 'Fixed No Amount', type: 'earning', calculation_type: 'fixed' };

      const response = await request(app)
        .post('/api/salary-components')
        .send(newComponentData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.error).toBe('Amount is required for fixed calculation type.');
    });

    it('should return 409 for a duplicate component name', async () => {
      // Seed a component with the same name first
      await SalaryComponent.create({ name: 'Duplicate Bonus', type: 'earning', tenantId: mockUser.tenantId });

      const newComponentData = { name: 'Duplicate Bonus', type: 'deduction', calculation_type: 'fixed', amount: 100 };
      const response = await request(app)
        .post('/api/salary-components')
        .send(newComponentData)
        .expect('Content-Type', /json/)
        .expect(409);

      expect(response.body.error).toBe('A salary component with this name already exists for your tenant.');
    });
  });

  describe('PUT /api/salary-components/:componentId', () => {
    it('should update calculation_type from "fixed" to "percentage"', async () => {
      const component = await SalaryComponent.create({
        name: 'Updatable Component',
        type: 'earning',
        calculation_type: 'fixed',
        amount: 100,
        tenantId: mockUser.tenantId,
      });

      const updateData = { calculation_type: 'percentage', percentage: 15 };

      const response = await request(app)
        .put(`/api/salary-components/${component.id}`)
        .send(updateData)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.calculation_type).toBe('percentage');
      expect(response.body.amount).toBeNull();
      expect(response.body.percentage).toBe(15);

      const dbComponent = await SalaryComponent.findByPk(component.id);
      expect(dbComponent.amount).toBeNull();
      expect(dbComponent.percentage).toBe("15"); // Note: DB might store as string
    });
  });

  describe('DELETE /api/salary-components/:componentId', () => {
    it('should delete a custom component', async () => {
       const component = await SalaryComponent.create({
        name: 'Component to Delete',
        type: 'deduction',
        is_system_defined: false,
        tenantId: mockUser.tenantId,
      });

      await request(app)
        .delete(`/api/salary-components/${component.id}`)
        .expect(204);

      const dbComponent = await SalaryComponent.findByPk(component.id);
      expect(dbComponent).toBeNull();
    });
  });

});
