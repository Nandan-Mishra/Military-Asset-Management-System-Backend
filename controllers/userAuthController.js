const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { ROLES } = require('../utils/constants');

// Generates a JWT token for user authentication
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Normalizes role input to match database enum values
const normalizeRole = (rawRole) => {
  if (!rawRole) return null;
  const value = String(rawRole).trim().toLowerCase();
  if (value === 'admin') return ROLES.ADMIN;
  if (value === 'base commander' || value === 'base_commander') return ROLES.BASE_COMMANDER;
  if (value === 'logistics officer' || value === 'logistics_officer') return ROLES.LOGISTICS_OFFICER;
  return null;
};

// Unified endpoint for user registration and login based on request context
exports.userAuth = async (req, res) => {
  try {
    const { email, password, username, fullName, role, baseId, mode } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const normalizedRole = normalizeRole(role);
    if (!normalizedRole) {
      return res.status(400).json({ message: 'Role must be one of: admin, base commander, logistics officer' });
    }

    const isRegisterIntent = (mode === 'register') || typeof username === 'string' || typeof fullName === 'string';

    let user = await User.findOne({ email }).select('+password');
    if (user) {
      const valid = await user.comparePassword(password);
      if (!valid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      if (!user.isActive) {
        return res.status(401).json({ message: 'Account is deactivated' });
      }
      const token = generateToken(user._id);
      const safeUser = await User.findById(user._id);
      return res.json({
        success: true,
        token,
        user: {
          id: safeUser._id,
          username: safeUser.username,
          email: safeUser.email,
          role: safeUser.role,
          fullName: safeUser.fullName,
          baseId: safeUser.baseId || null
        },
        mode: 'login'
      });
    }

    if (!isRegisterIntent) {
      return res.status(404).json({ message: 'User does not exist' });
    }

    if (normalizedRole === ROLES.BASE_COMMANDER && !baseId) {
      return res.status(400).json({ message: 'Base is required for base commander registration' });
    }
    const created = await User.create({
      username: username || email.split('@')[0],
      email,
      password,
      role: normalizedRole,
      baseId: normalizedRole === ROLES.BASE_COMMANDER ? baseId || undefined : undefined,
      fullName: fullName || 'New User'
    });

    const token = generateToken(created._id);
    return res.status(201).json({
      success: true,
      token,
      user: {
        id: created._id,
        username: created.username,
        email: created.email,
        role: created.role,
        fullName: created.fullName,
        baseId: created.baseId || null
      },
      mode: 'register'
    });
  } catch (error) {
    if (error && (error.code === 11000 || (error.message && error.message.includes('E11000')))) {
      return res.status(409).json({ message: 'User already exists' });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};

