// backend/routes/salaryComponents.js
import express from 'express';
import prisma from '../lib/prisma.js'; // Prisma client is already imported correctly

const router = express.Router();

// GET all salary components for the tenant or system-defined
router.get('/', async (req, res) => {
    const { tenantId } = req.user;
    try {
        const salaryComponents = await prisma.salaryComponent.findMany({
            where: {
                OR: [
                    { tenantId: tenantId },
                    { tenantId: null, isSystemDefined: true, isActive: true }
                ]
            },
            orderBy: [
                { isSystemDefined: 'desc' },
                { name: 'asc' }
            ]
        });
        res.json(salaryComponents);
    } catch (err) {
        console.error('Error fetching salary components:', err);
        res.status(500).json({ error: 'An internal server error occurred while fetching salary components.' });
    }
});

// CREATE a new salary component for the tenant
router.post('/', async (req, res) => {
    const { tenantId } = req.user;
    const { name, description, type, calculationType, amount, percentage, isTaxable, payslipDisplayOrder, category } = req.body;

    // Basic validation
    if (!name || !type || !calculationType) {
        return res.status(400).json({ error: 'Name, type, and calculationType are required.' });
    }
    
    try {
        const newSalaryComponent = await prisma.salaryComponent.create({
            data: {
                tenantId,
                name,
                description,
                type,
                calculationType,
                isTaxable: !!isTaxable,
                isSystemDefined: false, // User-created components are never system-defined
                isActive: true,
                payslipDisplayOrder: payslipDisplayOrder ? parseInt(payslipDisplayOrder, 10) : null,
                amount: amount ? parseFloat(amount) : null,
                percentage: percentage ? parseFloat(percentage) : null,
                category: category || (type === 'earning' ? 'employee_earning' : 'employee_deduction'),
            }
        });
        res.status(201).json(newSalaryComponent);
    } catch (err) {
        if (err.code === 'P2002') { // Unique constraint violation
            return res.status(409).json({ error: 'A salary component with this name already exists.' });
        }
        console.error('Error creating salary component:', err);
        res.status(500).json({ error: 'An internal server error occurred.' });
    }
});

// UPDATE an existing salary component for the tenant
router.put('/:componentId', async (req, res) => {
    const { tenantId } = req.user;
    const { componentId } = req.params;
    const { name, description, type, calculationType, amount, percentage, isTaxable, isActive, payslipDisplayOrder, category } = req.body;

    try {
        // First, ensure the component exists and belongs to the user's tenant
        const component = await prisma.salaryComponent.findFirst({
            where: {
                id: componentId,
                tenantId: tenantId,
                isSystemDefined: false // Can only update non-system components
            }
        });

        if (!component) {
            return res.status(404).json({ error: 'Custom salary component not found or access denied.' });
        }
        
        const updatedData = {
            name, description, type, calculationType,
            isTaxable, isActive, payslipDisplayOrder, category,
            amount: amount ? parseFloat(amount) : null,
            percentage: percentage ? parseFloat(percentage) : null,
        };
        
        // Logic to nullify amount/percentage based on calculationType
        if (calculationType === 'fixed') {
            updatedData.percentage = null;
        } else if (calculationType === 'percentage') {
            updatedData.amount = null;
        } else if (calculationType === 'formula') {
            updatedData.amount = null;
            updatedData.percentage = null;
        }

        const updatedComponent = await prisma.salaryComponent.update({
            where: { id: componentId },
            data: updatedData
        });

        res.json(updatedComponent);
    } catch (err) {
        if (err.code === 'P2002') { // Unique constraint violation
            return res.status(409).json({ error: 'A salary component with this name already exists.' });
        }
        console.error('Error updating salary component:', err);
        res.status(500).json({ error: 'An internal server error occurred.' });
    }
});

// DELETE a custom salary component for the tenant
router.delete('/:componentId', async (req, res) => {
    const { tenantId } = req.user;
    const { componentId } = req.params;

    try {
        // Ensure the component exists, belongs to the tenant, and is not system-defined
        const component = await prisma.salaryComponent.findFirst({
            where: {
                id: componentId,
                tenantId: tenantId,
                isSystemDefined: false
            }
        });

        if (!component) {
            return res.status(404).json({ error: 'Custom salary component not found or access denied.' });
        }

        await prisma.salaryComponent.delete({
            where: { id: componentId }
        });

        res.status(204).send(); // No content on successful deletion
    } catch (err) {
        // P2003 = Foreign key constraint failed. This component is in use.
        if (err.code === 'P2003') {
            return res.status(409).json({ error: 'Cannot delete this component because it is being used in an employee\'s salary settings or a historical payslip.' });
        }
        console.error('Error deleting salary component:', err);
        res.status(500).json({ error: 'An internal server error occurred.' });
    }
});

export default router;