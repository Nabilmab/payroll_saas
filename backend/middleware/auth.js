import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';

export const authenticateAndAttachUser = async (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.user.id },
      include: {
        tenants: {
          where: { tenantId: decoded.user.tenantId },
          include: {
            role: true,
            tenant: {
              include: {
                jurisdiction: true,
              },
            },
          },
        },
      },
    });

    if (!user || user.tenants.length === 0) {
      return res.status(401).json({ msg: 'Token is not valid or access has been revoked.' });
    }

    const { tenants, ...userProfile } = user;
    const activeTenantAccess = tenants[0];

    const userForRequest = {
      ...userProfile,
      tenantId: activeTenantAccess.tenantId,
      tenant: {
        ...activeTenantAccess.tenant,
        userRole: activeTenantAccess.role,
      },
    };

    req.user = userForRequest;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};