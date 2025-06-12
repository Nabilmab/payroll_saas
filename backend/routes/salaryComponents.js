const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { SalaryComponent } = require('../models');
// We assume 'authenticateAndAttachUser' middleware will be applied when this router is mounted in server.js
// For example: app.use('/api/salary-components', authenticateAndAttachUser, salaryComponentsRouter);
// So, req.user should be populated by that middleware.

// GET all salary components for the tenant or system-defined
// Original: app.get('/api/salary-components', authenticateAndAttachUser, async (req, res) => { ... });
router.get('/', async (req, res) => {
    try {
        if (!req.user || !req.user.tenantId) {
            return res.status(401).json({ error: 'User not authenticated or tenantId missing.' });
        }
        const { tenantId } = req.user;
        const salaryComponents = await SalaryComponent.findAll({
            where: {
                [Op.or]: [
                    { tenantId: tenantId },
                    { tenantId: null, is_system_defined: true, is_active: true }
                ]
            },
            order: [['is_system_defined', 'DESC'], ['name', 'ASC']]
        });
        res.json(salaryComponents);
    } catch (error) {
        console.error('Error fetching salary components:', error);
        res.status(500).json({ error: 'An internal server error occurred while fetching salary components.' });
    }
});

// CREATE a new salary component for the tenant
// Original: app.post('/api/salary-components', authenticateAndAttachUser, async (req, res) => { ... });
router.post('/', async (req, res) => {
    try {
        if (!req.user || !req.user.tenantId) {
            return res.status(401).json({ error: 'User not authenticated or tenantId missing.' });
        }
        const { tenantId } = req.user;
        const { name, description, type, calculation_type, amount, percentage, is_taxable, payslip_display_order, category } = req.body;

        const VALID_CATEGORIES = ['employee_earning', 'employee_deduction', 'employer_contribution_social', 'employer_contribution_other', 'statutory_deduction'];
        if (category && !VALID_CATEGORIES.includes(category)) {
            return res.status(400).json({ error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}` });
        }

        if (!name || !type) {
            return res.status(400).json({ error: 'Name and type are required.' });
        }
        if (!['earning', 'deduction', 'employer_contribution', 'statutory_deduction_from_employer_perspective'].includes(type) && !VALID_CATEGORIES.map(c => c.startsWith(type)).some(Boolean) ) {
             // Simplified type validation for this context, actual model might have stricter enum
            if (!['earning', 'deduction'].includes(type)) { // Fallback to simpler validation if category doesn't cover type
                 return res.status(400).json({ error: "Type must be 'earning' or 'deduction' or a valid category prefix." });
            }
        }


        const validCalculationTypes = ['fixed', 'percentage', 'formula'];
        if (!calculation_type || !validCalculationTypes.includes(calculation_type)) {
            return res.status(400).json({ error: `Calculation type must be one of: ${validCalculationTypes.join(', ')}.` });
        }

        const newSalaryComponentData = {
            tenantId,
            name,
            description,
            type,
            calculation_type,
            is_taxable: !!is_taxable,
            is_system_defined: false, // New components are never system_defined
            is_active: true, // Default to active
            payslip_display_order: payslip_display_order ? parseInt(payslip_display_order, 10) : null,
            amount: null,
            percentage: null,
            category: category
        };

        if (calculation_type === 'fixed') {
            if (amount === undefined || amount === null || isNaN(parseFloat(amount))) {
                return res.status(400).json({ error: 'Valid amount is required for fixed calculation type.' });
            }
            newSalaryComponentData.amount = parseFloat(amount);
        } else if (calculation_type === 'percentage') {
            if (percentage === undefined || percentage === null || isNaN(parseFloat(percentage))) {
                return res.status(400).json({ error: 'Valid percentage is required for percentage calculation type.' });
            }
            newSalaryComponentData.percentage = parseFloat(percentage);
        }

        const newSalaryComponent = await SalaryComponent.create(newSalaryComponentData);
        res.status(201).json(newSalaryComponent);
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ error: 'A salary component with this name already exists for your tenant.' });
        }
        console.error('Error creating salary component:', error);
        res.status(500).json({ error: 'An internal server error occurred while creating the salary component.' });
    }
});

// UPDATE an existing salary component for the tenant
// Original: app.put('/api/salary-components/:componentId', authenticateAndAttachUser, async (req, res) => { ... });
router.put('/:componentId', async (req, res) => {
    try {
        if (!req.user || !req.user.tenantId) {
            return res.status(401).json({ error: 'User not authenticated or tenantId missing.' });
        }
        const { tenantId } = req.user;
        const { componentId } = req.params;
        const { name, description, type, calculation_type, amount, percentage, is_taxable, is_active, payslip_display_order, category } = req.body;

        const component = await SalaryComponent.findOne({
            where: { id: componentId, tenantId: tenantId, is_system_defined: false } // Can only update non-system components
        });

        if (!component) {
            return res.status(404).json({ error: 'Custom salary component not found or access denied.' });
        }

        const VALID_CATEGORIES = ['employee_earning', 'employee_deduction', 'employer_contribution_social', 'employer_contribution_other', 'statutory_deduction'];
        if (category && !VALID_CATEGORIES.includes(category)) {
            return res.status(400).json({ error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}` });
        }

        if (name !== undefined) component.name = name;
        if (description !== undefined) component.description = description;
        if (type !== undefined) {
             if (!['earning', 'deduction'].includes(type)) { // Simplified validation
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

        // Reset amount/percentage based on new calculation_type or update existing values
        if (component.calculation_type === 'fixed') {
            component.percentage = null;
            if (amount !== undefined) { // Only update if amount is provided
                 if (amount === null || isNaN(parseFloat(amount))) return res.status(400).json({ error: 'Valid amount is required for fixed calculation type.' });
                 component.amount = parseFloat(amount);
            }
        } else if (component.calculation_type === 'percentage') {
            component.amount = null;
            if (percentage !== undefined) { // Only update if percentage is provided
                if (percentage === null || isNaN(parseFloat(percentage))) return res.status(400).json({ error: 'Valid percentage is required for percentage type.' });
                component.percentage = parseFloat(percentage);
            }
        } else if (component.calculation_type === 'formula') {
            component.amount = null;
            component.percentage = null;
        }


        if (is_taxable !== undefined) component.is_taxable = !!is_taxable;
        if (is_active !== undefined) component.is_active = !!is_active; // Allow updating is_active
        if (payslip_display_order !== undefined) component.payslip_display_order = payslip_display_order ? parseInt(payslip_display_order, 10) : null;
        if (category !== undefined) component.category = category;

        await component.save();
        res.json(component);
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ error: 'A salary component with this name already exists for your tenant.' });
        }
        console.error('Error updating salary component:', error);
        res.status(500).json({ error: 'An internal server error occurred while updating the salary component.' });
    }
});

// DELETE a custom salary component for the tenant
// Original: app.delete('/api/salary-components/:componentId', authenticateAndAttachUser, async (req, res) => { ... });
router.delete('/:componentId', async (req, res) => {
    try {
        if (!req.user || !req.user.tenantId) {
            return res.status(401).json({ error: 'User not authenticated or tenantId missing.' });
        }
        const { tenantId } = req.user;
        const { componentId } = req.params;

        const component = await SalaryComponent.findOne({
            where: { id: componentId, tenantId: tenantId, is_system_defined: false } // Can only delete non-system components
        });

        if (!component) {
            return res.status(404).json({ error: 'Custom salary component not found or access denied.' });
        }

        await component.destroy();
        res.status(204).send(); // No content on successful deletion
    } catch (error) {
        console.error('Error deleting salary component:', error);
        res.status(500).json({ error: 'An internal server error occurred while deleting the salary component.' });
    }
});

module.exports = router;
