const { User } = require('../models');

// This is the mock authentication middleware we will use for now.
// In the future, this is where you would decode a real JWT (JSON Web Token).
const authenticateAndAttachUser = async (req, res, next) => {
  try {
    // For now, we hardcode the user for testing purposes.
    const loggedInUser = await User.findOne({
      where: { email: 'manager.rh@techsolutions.ma' }
    });

    if (!loggedInUser) {
      return res.status(401).json({ error: 'Authentication failed: User not found.' });
    }

    // Attach the user object to the request for subsequent route handlers to use.
    req.user = loggedInUser;

    // Pass control to the next middleware or route handler in the chain.
    next();
  } catch (error) {
    console.error("Authentication middleware error:", error);
    return res.status(500).json({ error: "An internal server error occurred during authentication." });
  }
};

module.exports = {
  authenticateAndAttachUser
};
