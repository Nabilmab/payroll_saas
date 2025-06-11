// backend/salaryComponents.test.js

// Mock dependencies
// NB: This is a simplified mock setup. A real test environment would use Jest's mocking features more extensively.
const mockUser = {
  id: 1,
  tenantId: 1,
  email: 'manager.rh@techsolutions.ma',
  // ... other user properties
};

const mockSalaryComponentCreate = jest.fn();
const mockSalaryComponentFindOne = jest.fn();
const mockSalaryComponentSave = jest.fn().mockResolvedValue(true); // Mock save method

jest.mock('./models', () => {
  const actualModels = jest.requireActual('./models'); // Get actuals for things not explicitly mocked like Op
  return {
    ...actualModels, // Spread actual models
    User: {
      findOne: jest.fn().mockResolvedValue(mockUser),
      scope: jest.fn(() => ({ findOne: jest.fn().mockResolvedValue(mockUser) })),
    },
    SalaryComponent: {
      create: (data) => {
        mockSalaryComponentCreate(data);
        // Return an object that includes a toJSON method, like Sequelize models do
        const newObj = { id: Date.now(), ...data };
        return Promise.resolve({ ...newObj, toJSON: () => newObj });
      },
      findOne: (options) => mockSalaryComponentFindOne(options),
      // We will mock the instance methods like save() on the objects returned by findOne
    },
    sequelize: {
      authenticate: jest.fn().mockResolvedValue(true),
    },
    // Op: actualModels.Op, // Keep actual Op if it was used, or mock if necessary
  };
});


const { User, SalaryComponent } = require('./models');

// Mock middleware (simplified)
const authenticateAndAttachUser = async (req, res, next) => {
  req.user = await User.findOne({ where: { email: 'manager.rh@techsolutions.ma' }});
  next();
};

// Manually define the route handler logic for testing based on server.js
// POST /api/salary-components
const createSalaryComponentHandler = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { name, description, type, calculation_type, amount, percentage, is_taxable, payslip_display_order } = req.body;

        if (!name || !type) { return res.status(400).json({ error: 'Name and type are required.' }); }
        if (!['earning', 'deduction'].includes(type)) { return res.status(400).json({ error: "Type must be 'earning' or 'deduction'." });}
        const validCalculationTypes = ['fixed', 'percentage', 'formula'];
        if (!calculation_type || !validCalculationTypes.includes(calculation_type)) {
            return res.status(400).json({ error: `Calculation type must be one of: ${validCalculationTypes.join(', ')}.` });
        }

        const newSalaryComponentData = {
            tenantId, name, description, type, calculation_type,
            is_taxable: !!is_taxable, is_system_defined: false, is_active: true,
            payslip_display_order: payslip_display_order ? parseInt(payslip_display_order, 10) : null,
            amount: null, percentage: null
        };

        if (calculation_type === 'fixed') {
            if (amount === undefined || amount === null) {
                return res.status(400).json({ error: 'Amount is required for fixed calculation type.' });
            }
            newSalaryComponentData.amount = parseFloat(amount);
        } else if (calculation_type === 'percentage') {
            if (percentage === undefined || percentage === null) {
                return res.status(400).json({ error: 'Percentage is required for percentage calculation type.' });
            }
            newSalaryComponentData.percentage = parseFloat(percentage);
        }

        const newSalaryComponentInstance = await SalaryComponent.create(newSalaryComponentData);
        // Access toJSON if the mock returns a Sequelize-like object that has it
        res.status(201).json(newSalaryComponentInstance.toJSON ? newSalaryComponentInstance.toJSON() : newSalaryComponentInstance);
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ error: 'A salary component with this name already exists for your tenant.' });
        }
        console.error('Error creating salary component:', error);
        res.status(500).json({ error: 'An internal server error occurred while creating the salary component.' });
    }
};

// PUT /api/salary-components/:componentId
const updateSalaryComponentHandler = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { componentId } = req.params;
        const { name, description, type, calculation_type, amount, percentage, is_taxable, is_active, payslip_display_order } = req.body;

        const component = await SalaryComponent.findOne({ where: { id: componentId, tenantId: tenantId, is_system_defined: false } });
        if (!component) { return res.status(404).json({ error: 'Custom salary component not found or access denied.' });}

        if (name !== undefined) component.name = name;
        if (description !== undefined) component.description = description;
        if (type !== undefined) {
            if (!['earning', 'deduction'].includes(type)) {
                return res.status(400).json({ error: "Invalid type. Must be 'earning' or 'deduction'." });
            }
            component.type = type;
        }

        if (calculation_type !== undefined) {
            const validCalculationTypes = ['fixed', 'percentage', 'formula'];
            if (!validCalculationTypes.includes(calculation_type)) {
                return res.status(400).json({ error: `Calculation type must be one of: ${validCalculationTypes.join(', ')}.` });
            }
            component.calculation_type = calculation_type;
        }

        if (component.calculation_type === 'fixed') {
            component.percentage = null;
            if (amount !== undefined) {
                component.amount = amount === null ? null : parseFloat(amount);
                if (amount !== null && isNaN(component.amount)) return res.status(400).json({ error: 'Invalid amount for fixed type.'});
            }
        } else if (component.calculation_type === 'percentage') {
            component.amount = null;
            if (percentage !== undefined) {
                component.percentage = percentage === null ? null : parseFloat(percentage);
                 if (percentage !== null && isNaN(component.percentage)) return res.status(400).json({ error: 'Invalid percentage for percentage type.'});
            }
        } else if (component.calculation_type === 'formula') {
            component.amount = null;
            component.percentage = null;
        }

        if (is_taxable !== undefined) component.is_taxable = !!is_taxable;
        if (is_active !== undefined) component.is_active = !!is_active;
        if (payslip_display_order !== undefined) component.payslip_display_order = payslip_display_order ? parseInt(payslip_display_order, 10) : null;

        await component.save();
        res.json(component.toJSON ? component.toJSON() : component);
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ error: 'A salary component with this name already exists for your tenant.' });
        }
        console.error('Error updating salary component:', error);
        res.status(500).json({ error: 'An internal server error occurred while updating the salary component.' });
    }
};


// --- Test Suite ---
describe('Salary Components API', () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { user: mockUser, body: {}, params: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis(), send: jest.fn().mockReturnThis() };
  });

  describe('POST /api/salary-components', () => {
    // ... (POST tests from previous step are here, unchanged) ...
    it('should create a component with calculation_type: "fixed" and a valid amount', async () => {
      req.body = {
        name: 'Fixed Bonus', type: 'earning', calculation_type: 'fixed', amount: 100, is_taxable: true,
      };
      await createSalaryComponentHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(mockSalaryComponentCreate).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Fixed Bonus', calculation_type: 'fixed', amount: 100, percentage: null,
      }));
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ name: 'Fixed Bonus', amount: 100 }));
    });

    it('should create a component with calculation_type: "percentage" and a valid percentage', async () => {
      req.body = {
        name: 'Sales Commission', type: 'earning', calculation_type: 'percentage', percentage: 10, is_taxable: true,
      };
      await createSalaryComponentHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(mockSalaryComponentCreate).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Sales Commission', calculation_type: 'percentage', percentage: 10, amount: null,
      }));
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ name: 'Sales Commission', percentage: 10 }));
    });

    it('should create a component with calculation_type: "formula", ensuring amount and percentage are null', async () => {
      req.body = {
        name: 'Complex Formula', type: 'earning', calculation_type: 'formula', is_taxable: true,
      };
      await createSalaryComponentHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(mockSalaryComponentCreate).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Complex Formula', calculation_type: 'formula', amount: null, percentage: null,
      }));
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ name: 'Complex Formula', amount: null, percentage: null }));
    });

    it('should return a 400 error for an invalid calculation_type', async () => {
      req.body = {
        name: 'Invalid Type Comp', type: 'earning', calculation_type: 'unknown_type', amount: 100,
      };
      await createSalaryComponentHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Calculation type must be one of: fixed, percentage, formula.' });
    });

    it('should create a component with calculation_type: "fixed", ignoring provided percentage', async () => {
      req.body = {
        name: 'Fixed With Extra Percentage', type: 'earning', calculation_type: 'fixed', amount: 150, percentage: 5, is_taxable: false,
      };
      await createSalaryComponentHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(mockSalaryComponentCreate).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Fixed With Extra Percentage', calculation_type: 'fixed', amount: 150, percentage: null,
      }));
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ amount: 150, percentage: null }));
    });

    it('should create a component with calculation_type: "percentage", ignoring provided amount', async () => {
      req.body = {
        name: 'Percentage With Extra Amount', type: 'deduction', calculation_type: 'percentage', percentage: 12, amount: 200, is_taxable: false,
      };
      await createSalaryComponentHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(mockSalaryComponentCreate).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Percentage With Extra Amount', calculation_type: 'percentage', percentage: 12, amount: null,
      }));
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ percentage: 12, amount: null }));
    });

    it('should return 400 if calculation_type is "fixed" and amount is missing', async () => {
        req.body = { name: 'Fixed No Amount', type: 'earning', calculation_type: 'fixed' };
        await createSalaryComponentHandler(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Amount is required for fixed calculation type.' });
    });

    it('should return 400 if calculation_type is "percentage" and percentage is missing', async () => {
        req.body = { name: 'Percentage No Value', type: 'earning', calculation_type: 'percentage' };
        await createSalaryComponentHandler(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Percentage is required for percentage calculation type.' });
    });
  });

  describe('PUT /api/salary-components/:componentId', () => {
    let existingComponent;

    beforeEach(() => {
      // Mock a component that findOne will return
      existingComponent = {
        id: 1,
        tenantId: mockUser.tenantId,
        name: 'Original Name',
        type: 'earning',
        calculation_type: 'fixed',
        amount: 100,
        percentage: null,
        is_taxable: true,
        is_system_defined: false,
        is_active: true,
        payslip_display_order: 1,
        save: mockSalaryComponentSave, // Use the global mock for save
        toJSON: function() { // Simple toJSON for testing responses
            const {save, toJSON, ...rest} = this; // Exclude methods from JSON
            return rest;
        }
      };
      mockSalaryComponentFindOne.mockResolvedValue(existingComponent);
    });

    it('should update calculation_type from "fixed" to "percentage", nullify amount, and set percentage', async () => {
      req.params.componentId = 1;
      req.body = { calculation_type: 'percentage', percentage: 15 };

      await updateSalaryComponentHandler(req, res);

      expect(mockSalaryComponentFindOne).toHaveBeenCalledWith({ where: { id: 1, tenantId: mockUser.tenantId, is_system_defined: false } });
      expect(existingComponent.calculation_type).toBe('percentage');
      expect(existingComponent.amount).toBeNull();
      expect(existingComponent.percentage).toBe(15);
      expect(mockSalaryComponentSave).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ calculation_type: 'percentage', amount: null, percentage: 15 }));
    });

    it('should update calculation_type from "percentage" to "fixed", nullify percentage, and set amount', async () => {
      existingComponent.calculation_type = 'percentage';
      existingComponent.amount = null;
      existingComponent.percentage = 20;
      mockSalaryComponentFindOne.mockResolvedValue(existingComponent); // Re-mock findOne with updated initial state

      req.params.componentId = 1;
      req.body = { calculation_type: 'fixed', amount: 200 };

      await updateSalaryComponentHandler(req, res);

      expect(existingComponent.calculation_type).toBe('fixed');
      expect(existingComponent.percentage).toBeNull();
      expect(existingComponent.amount).toBe(200);
      expect(mockSalaryComponentSave).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ calculation_type: 'fixed', amount: 200, percentage: null }));
    });

    it('should update calculation_type to "formula", nullifying amount and percentage', async () => {
      req.params.componentId = 1;
      req.body = { calculation_type: 'formula' };

      await updateSalaryComponentHandler(req, res);

      expect(existingComponent.calculation_type).toBe('formula');
      expect(existingComponent.amount).toBeNull();
      expect(existingComponent.percentage).toBeNull();
      expect(mockSalaryComponentSave).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ calculation_type: 'formula', amount: null, percentage: null }));
    });

    it('should update amount when calculation_type is "fixed"', async () => {
      req.params.componentId = 1;
      req.body = { amount: 150 }; // existing is 'fixed' with amount 100

      await updateSalaryComponentHandler(req, res);

      expect(existingComponent.amount).toBe(150);
      expect(mockSalaryComponentSave).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ amount: 150 }));
    });

    it('should update percentage when calculation_type is "percentage"', async () => {
      existingComponent.calculation_type = 'percentage';
      existingComponent.amount = null;
      existingComponent.percentage = 10;
      mockSalaryComponentFindOne.mockResolvedValue(existingComponent);

      req.params.componentId = 1;
      req.body = { percentage: 25 };

      await updateSalaryComponentHandler(req, res);

      expect(existingComponent.percentage).toBe(25);
      expect(mockSalaryComponentSave).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ percentage: 25 }));
    });

    it('should nullify amount if calculation_type is "percentage" and amount is provided', async () => {
      existingComponent.calculation_type = 'percentage';
      existingComponent.amount = null; // Should already be null
      existingComponent.percentage = 10;
      mockSalaryComponentFindOne.mockResolvedValue(existingComponent);

      req.params.componentId = 1;
      req.body = { amount: 50 }; // Attempting to set amount on 'percentage' type

      await updateSalaryComponentHandler(req, res);

      // The handler logic as per last correction should nullify amount if type is not 'fixed'
      // And since amount is provided for a percentage type, it should be ignored (nulled).
      expect(existingComponent.amount).toBeNull();
      expect(mockSalaryComponentSave).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ amount: null, calculation_type: 'percentage' }));
    });

    it('should nullify percentage if calculation_type is "fixed" and percentage is provided', async () => {
      // existingComponent is 'fixed' by default in this beforeEach
      req.params.componentId = 1;
      req.body = { percentage: 5 }; // Attempting to set percentage on 'fixed' type

      await updateSalaryComponentHandler(req, res);

      expect(existingComponent.percentage).toBeNull();
      expect(mockSalaryComponentSave).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ percentage: null, calculation_type: 'fixed' }));
    });

    it('should return 400 for an invalid calculation_type update', async () => {
      req.params.componentId = 1;
      req.body = { calculation_type: 'super_formula_invalid' };

      await updateSalaryComponentHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Calculation type must be one of: fixed, percentage, formula.' });
      expect(mockSalaryComponentSave).not.toHaveBeenCalled();
    });

     it('should correctly update amount to null for fixed type if null is passed', async () => {
        req.params.componentId = 1; // calculation_type is 'fixed'
        req.body = { amount: null };

        await updateSalaryComponentHandler(req, res);

        expect(existingComponent.amount).toBeNull();
        expect(mockSalaryComponentSave).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ amount: null }));
    });

    it('should correctly update percentage to null for percentage type if null is passed', async () => {
        existingComponent.calculation_type = 'percentage';
        existingComponent.percentage = 10;
        existingComponent.amount = null;
        mockSalaryComponentFindOne.mockResolvedValue(existingComponent);

        req.params.componentId = 1;
        req.body = { percentage: null };

        await updateSalaryComponentHandler(req, res);

        expect(existingComponent.percentage).toBeNull();
        expect(mockSalaryComponentSave).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ percentage: null }));
    });


  });
});
