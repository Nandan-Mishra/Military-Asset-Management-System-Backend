const { ROLES } = require('../utils/constants');

// Middleware factory to check if user has one of the allowed roles
const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Access denied. Insufficient permissions.' 
      });
    }

    next();
  };
};

// Middleware to verify user has access to the requested base based on their role
const checkBaseAccess = (req, res, next) => {
  const user = req.user;
  const baseId = req.params.baseId || req.body.base || req.query.baseId;

  if (user.role === ROLES.ADMIN) {
    return next();
  }

  if (user.role === ROLES.BASE_COMMANDER) {
    if (baseId && user.baseId && user.baseId.toString() !== baseId.toString()) {
      return res.status(403).json({ 
        message: 'Access denied. You can only access your assigned base.' 
      });
    }
    return next();
  }

  if (user.role === ROLES.LOGISTICS_OFFICER) {
    return next();
  }

  next();
};

module.exports = { checkRole, checkBaseAccess };

