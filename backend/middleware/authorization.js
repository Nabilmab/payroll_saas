// backend/middleware/authorization.js
export const checkTenantRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.tenant || !req.user.tenant.userRole) {
      return res.status(403).json({ msg: 'Forbidden: No active role found for session.' });
    }
    const userRoleName = req.user.tenant.userRole.name;
    if (Array.isArray(allowedRoles) && allowedRoles.includes(userRoleName)) {
      next();
    } else {
      return res.status(403).json({ msg: `Forbidden: Action requires one of these roles: ${allowedRoles.join(', ')}.` });
    }
  };
};