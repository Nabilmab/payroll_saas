import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';

const router = express.Router();

// STAGE 1: User provides credentials, we return their profile + accessible tenants.
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ msg: 'Email and password are required.' });
        }

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return res.status(401).json({ msg: 'Invalid credentials.' });
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ msg: 'Invalid credentials.' });
        }

        const tenantAccessList = await prisma.userTenantAccess.findMany({
            where: { userId: user.id },
            include: {
                tenant: {
                    include: {
                        jurisdiction: true,
                    }
                },
                role: true
            }
        });

        if (tenantAccessList.length === 0) {
            return res.status(403).json({ msg: 'This user account is not associated with any company.' });
        }

        const { passwordHash, ...userProfile } = user;

        res.status(200).json({
            user: userProfile,
            tenants: tenantAccessList.map(access => ({
                id: access.tenant.id,
                name: access.tenant.name,
                schemaName: access.tenant.schemaName,
                jurisdiction: access.tenant.jurisdiction,
                userRole: access.role.name
            }))
        });

    } catch (err) {
        console.error('Error in /login route:', err);
        res.status(500).send('Server Error');
    }
});


// STAGE 2: User has chosen a tenant, we return a session-specific JWT.
router.post('/select-tenant', async (req, res) => {
    try {
        const { userId, tenantId } = req.body;
        if (!userId || !tenantId) {
            return res.status(400).json({ msg: 'User ID and Tenant ID are required.' });
        }

        const access = await prisma.userTenantAccess.findUnique({
            where: {
                userId_tenantId: { userId, tenantId }
            },
            include: {
                role: true,
                tenant: { include: { jurisdiction: true } }
            }
        });

        if (!access) {
            return res.status(403).json({ msg: 'Access to this tenant is denied.' });
        }

        const payload = {
            user: {
                id: userId,
                tenantId: tenantId,
                roleId: access.roleId,
                roleName: access.role.name
            }
        };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' });

        const user = await prisma.user.findUnique({ where: { id: userId } });
        const { passwordHash, ...userProfile } = user;

        const userProfileForContext = {
            ...userProfile,
            tenant: {
                ...access.tenant,
                userRole: access.role
            }
        };

        res.json({ token, user: userProfileForContext });

    } catch (err) {
        console.error('Error in /select-tenant route:', err);
        res.status(500).send('Server Error');
    }
});


export default router;