const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generates a JWT token for user authentication
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Registers a new user with the provided credentials and role
exports.register = async (req, res) => {
  try {
    const { username, email, password, role, baseId, fullName } = req.body;

    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      username,
      email,
      password,
      role,
      baseId,
      fullName
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        baseId: user.baseId
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Authenticates user and returns JWT token upon successful login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        baseId: user.baseId
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Returns the current authenticated user's profile information
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('baseId');
    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

