const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { SalaryComponent } = require('../models');

// NOTE: We assume an authentication middleware is applied before this router is used.

// GET /api/salary-components/
router.get('/', async (req, res) => {
    try {
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

// POST /api/salary-components/
router.post('/', async (req, res) => {
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
            if (amount === undefined || amount === null) { return res.status(400).json({ error: 'Amount is required for fixed calculation type.' }); }
            newSalaryComponentData.amount = parseFloat(amount);
        } else if (calculation_type === 'percentage') {
            if (percentage === undefined || percentage === null) { return res.status(400).json({ error: 'Percentage is required for percentage calculation type.' }); }
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

// PUT /api/salary-components/:componentId
router.put('/:componentId', async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { componentId } = req.params;
        const { name, description, type, calculation_type, amount, percentage, is_taxable, is_active, payslip_display_order } = req.body;

        const component = await SalaryComponent.findOne({
            where: { id: componentId, tenantId: tenantId, is_system_defined: false }
        });

        if (!component) {
            return res.status(404).json({ error: 'Custom salary component not found or access denied.' });
        }

        if (name !== undefined) component.name = name;
        if (description !== undefined) component.description = description;
        if (type !== undefined) {
            if (!['earning', 'deduction'].includes(type)) { return res.status(400).json({ error: "Invalid type. Must be 'earning' or 'deduction'." }); }
            component.type = type;
        }

        if (calculation_type !== undefined) {
            const validCalculationTypes = ['fixed', 'percentage', 'formula'];
            if (!validCalculationTypes.includes(calculation_type)) { return res.status(400).json({ error: `Calculation type must be one of: ${validCalculationTypes.join(', ')}.` }); }
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
        res.json(component);
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ error: 'A salary component with this name already exists for your tenant.' });
        }
        console.error('Error updating salary component:', error);
        res.status(500).json({ error: 'An internal server error occurred while updating the salary component.' });
    }
});

// DELETE /api/salary-components/:componentId
router.delete('/:componentId', async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { componentId } = req.params;

        const component = await SalaryComponent.findOne({
            where: { id: componentId, tenantId: tenantId, is_system_defined: false }
        });

        if (!component) {
            return res.status(404).json({ error: 'Custom salary component not found or access denied.' });
        }

        await component.destroy();
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting salary component:', error);
        res.status(500).json({ error: 'An internal server error occurred while deleting the salary component.' });
    }
});


module.exports = router;
