// backend/middleware/auth.js
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';

// This is the real JWT authentication middleware.
export const authenticateAndAttachUser = async (req, res, next) => {
  // Get token from header
  const token = req.header('x-auth-token');

  // Check if no token
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find the user in the database using the ID from the token payload
    const user = await prisma.user.findUnique({
      where: {
        id: decoded.user.id,
      },
      // Include the user's roles for potential authorization checks later
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(401).json({ msg: 'Token is not valid' });
    }

    // Attach the full user object to the request
    // We can simplify this later, but for now, it's fine
    req.user = user;
    
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};