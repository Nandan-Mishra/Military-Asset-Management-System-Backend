const Base = require('../models/Base');

// Creates a new military base record
exports.createBase = async (req, res) => {
  try {
    const { name, code, location } = req.body;

    if (!name || !code || !location) {
      return res.status(400).json({ 
        message: 'Name, code, and location are required' 
      });
    }

    const base = await Base.create({
      name,
      code,
      location,
      isActive: true
    });

    res.status(201).json({
      success: true,
      data: base
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Base with this name or code already exists' 
      });
    }
    res.status(500).json({ message: error.message });
  }
};

// Retrieves all base records with optional active status filter
exports.getBases = async (req, res) => {
  try {
    const { isActive } = req.query;
    const query = {};

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const bases = await Base.find(query).sort({ name: 1 });

    res.json({
      success: true,
      data: bases,
      count: bases.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Retrieves a single base record by ID
exports.getBase = async (req, res) => {
  try {
    const base = await Base.findById(req.params.id);

    if (!base) {
      return res.status(404).json({ message: 'Base not found' });
    }

    res.json({
      success: true,
      data: base
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Updates base information including name, code, location, and active status
exports.updateBase = async (req, res) => {
  try {
    const { name, code, location, isActive } = req.body;

    const base = await Base.findById(req.params.id);

    if (!base) {
      return res.status(404).json({ message: 'Base not found' });
    }

    if (name) base.name = name;
    if (code) base.code = code;
    if (location) base.location = location;
    if (isActive !== undefined) base.isActive = isActive;

    await base.save();

    res.json({
      success: true,
      data: base
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Base with this name or code already exists' 
      });
    }
    res.status(500).json({ message: error.message });
  }
};

// Deletes a base record from the system
exports.deleteBase = async (req, res) => {
  try {
    const base = await Base.findById(req.params.id);

    if (!base) {
      return res.status(404).json({ message: 'Base not found' });
    }

    await base.deleteOne();

    res.json({
      success: true,
      message: 'Base deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

