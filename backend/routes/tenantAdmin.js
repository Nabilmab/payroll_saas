// backend/routes/tenantAdmin.js
import express from 'express';
import prisma from '../lib/prisma.js';
import bcrypt from 'bcryptjs';
import { authenticateAndAttachUser } from '../middleware/auth.js';
import { checkTenantRole } from '../middleware/authorization.js';

const router = express.Router();
router.use(authenticateAndAttachUser);

// GET /api/admin/users
router.get('/users', checkTenantRole(['admin']), async (req, res) => {
    try {
        const { tenantId } = req.user;
        const usersInTenant = await prisma.userTenantAccess.findMany({
            where: { tenantId },
            include: {
                user: { select: { id: true, firstName: true, lastName: true, email: true } },
                role: { select: { id: true, name: true } }
            },
            orderBy: { user: { firstName: 'asc' } }
        });
        res.json(usersInTenant);
    } catch (error) {
        console.error("Failed to fetch tenant users:", error);
        res.status(500).json({ msg: "Server error fetching tenant users." });
    }
});

// GET /api/admin/roles
router.get('/roles', checkTenantRole(['admin']), async (req, res) => {
    try {
        const { tenantId } = req.user;
        const roles = await prisma.role.findMany({
            where: { tenantId },
            orderBy: { name: 'asc' }
        });
        res.json(roles);
    } catch (error) {
        console.error("Failed to fetch tenant roles:", error);
        res.status(500).json({ msg: "Server error fetching roles." });
    }
});

// POST /api/admin/invite
router.post('/invite', checkTenantRole(['admin']), async (req, res) => {
    const { email, firstName, lastName, roleId } = req.body;
    const { tenantId } = req.user;

    if (!email || !firstName || !lastName || !roleId) {
        return res.status(400).json({ msg: 'Email, first name, last name, and role are required.' });
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            let targetUser = await tx.user.findUnique({ where: { email } });
            if (!targetUser) {
                const tempPassword = `temp_${Math.random().toString(36).slice(-8)}`;
                const passwordHash = await bcrypt.hash(tempPassword, 10);
                targetUser = await tx.user.create({
                    data: { email, firstName, lastName, passwordHash }
                });
                console.log(`Created new user ${email} with temp password: ${tempPassword}`);
            }

            const existingAccess = await tx.userTenantAccess.findUnique({
                where: { userId_tenantId: { userId: targetUser.id, tenantId } }
            });

            if (existingAccess) {
                throw new Error('User already has access to this company.');
            }

            await tx.userTenantAccess.create({
                data: { userId: targetUser.id, tenantId: tenantId, roleId: roleId }
            });

            return { success: true, message: 'User invited successfully.' };
        });

        res.status(201).json(result);
    } catch (error) {
        if (error.message === 'User already has access to this company.') {
            return res.status(409).json({ msg: error.message });
        }
        console.error("Invite error:", error);
        res.status(500).json({ msg: 'Server error during invitation process.' });
    }
});

// PUT /api/admin/users/:userId/role
router.put('/users/:userId/role', checkTenantRole(['admin']), async (req, res) => {
    const { userId } = req.params;
    const { roleId } = req.body;
    const { tenantId, id: adminUserId } = req.user;

    if (userId === adminUserId) {
        const targetRole = await prisma.role.findUnique({ where: { id: roleId } });
        if (targetRole?.name !== 'admin') {
            return res.status(400).json({ msg: "Admins cannot remove their own admin privileges." });
        }
    }

    try {
        const updatedAccess = await prisma.userTenantAccess.update({
            where: { userId_tenantId: { userId, tenantId } },
            data: { roleId },
            include: { role: true, user: true }
        });
        res.json(updatedAccess);
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ msg: "User not found in this tenant." });
        }
        console.error("Failed to update role:", error);
        res.status(500).json({ msg: "Server error while updating role." });
    }
});

// DELETE /api/admin/users/:userId
router.delete('/users/:userId', checkTenantRole(['admin']), async (req, res) => {
    const { userId: userToRemoveId } = req.params;
    const { tenantId, id: adminUserId } = req.user;

    if (userToRemoveId === adminUserId) {
        return res.status(400).json({ msg: "You cannot remove your own access." });
    }

    try {
        await prisma.userTenantAccess.delete({
            where: { userId_tenantId: { userId: userToRemoveId, tenantId: tenantId } }
        });
        res.status(204).send();
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ msg: "User access record not found." });
        }
        console.error("Failed to remove user access:", error);
        res.status(500).json({ msg: "Server error while removing user access." });
    }
});

export default router;