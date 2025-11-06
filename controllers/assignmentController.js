const Assignment = require('../models/Assignment');
const Expenditure = require('../models/Expenditure');
const Asset = require('../models/Asset');

// Creates a new asset assignment and decrements available quantity
exports.createAssignment = async (req, res) => {
  try {
    const assignmentData = {
      ...req.body,
      assignedBy: req.user._id
    };

    const count = await Assignment.countDocuments();
    assignmentData.assignmentNumber = `ASN-${Date.now()}-${count + 1}`;

    const asset = await Asset.findById(req.body.asset);
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    if (asset.currentQuantity < req.body.quantity) {
      return res.status(400).json({ message: 'Insufficient quantity available' });
    }

    const assignment = await Assignment.create(assignmentData);

    await Asset.findByIdAndUpdate(
      req.body.asset,
      { 
        $inc: { currentQuantity: -req.body.quantity },
        $set: { status: 'assigned' }
      }
    );

    await assignment.populate('asset base assignedBy');

    res.status(201).json({
      success: true,
      data: assignment
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Retrieves assignment records with optional filtering and pagination
exports.getAssignments = async (req, res) => {
  try {
    const { startDate, endDate, baseId, equipmentType, isReturned, page = 1, limit = 10 } = req.query;
    const user = req.user;

    const query = {};

    if (user.role === 'base_commander') {
      query.base = user.baseId;
    } else if (baseId) {
      query.base = baseId;
    }

    if (equipmentType) query.equipmentType = equipmentType;
    if (isReturned !== undefined) query.isReturned = isReturned === 'true';

    if (startDate || endDate) {
      query.assignmentDate = {};
      if (startDate) query.assignmentDate.$gte = new Date(startDate);
      if (endDate) query.assignmentDate.$lte = new Date(endDate);
    }

    const assignments = await Assignment.find(query)
      .populate('asset base assignedBy')
      .sort({ assignmentDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Assignment.countDocuments(query);

    res.json({
      success: true,
      data: assignments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Returns an assigned asset and restores its quantity to available inventory
exports.returnAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    if (assignment.isReturned) {
      return res.status(400).json({ message: 'Assignment already returned' });
    }

    assignment.isReturned = true;
    assignment.returnDate = new Date();
    await assignment.save();

    await Asset.findByIdAndUpdate(
      assignment.asset,
      { 
        $inc: { currentQuantity: assignment.quantity },
        $set: { status: 'available' }
      }
    );

    await assignment.populate('asset base assignedBy');

    res.json({
      success: true,
      data: assignment
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Records asset expenditure and permanently removes quantity from inventory
exports.createExpenditure = async (req, res) => {
  try {
    const expenditureData = {
      ...req.body,
      expendedBy: req.user._id
    };

    const count = await Expenditure.countDocuments();
    expenditureData.expenditureNumber = `EXP-${Date.now()}-${count + 1}`;

    const asset = await Asset.findById(req.body.asset);
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    if (asset.currentQuantity < req.body.quantity) {
      return res.status(400).json({ message: 'Insufficient quantity available' });
    }

    const expenditure = await Expenditure.create(expenditureData);

    await Asset.findByIdAndUpdate(
      req.body.asset,
      { 
        $inc: { currentQuantity: -req.body.quantity },
        $set: { status: 'expended' }
      }
    );

    await expenditure.populate('asset base expendedBy');

    res.status(201).json({
      success: true,
      data: expenditure
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Retrieves expenditure records with optional filtering and pagination
exports.getExpenditures = async (req, res) => {
  try {
    const { startDate, endDate, baseId, equipmentType, page = 1, limit = 10 } = req.query;
    const user = req.user;

    const query = {};

    if (user.role === 'base_commander') {
      query.base = user.baseId;
    } else if (baseId) {
      query.base = baseId;
    }

    if (equipmentType) query.equipmentType = equipmentType;

    if (startDate || endDate) {
      query.expenditureDate = {};
      if (startDate) query.expenditureDate.$gte = new Date(startDate);
      if (endDate) query.expenditureDate.$lte = new Date(endDate);
    }

    const expenditures = await Expenditure.find(query)
      .populate('asset base expendedBy')
      .sort({ expenditureDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Expenditure.countDocuments(query);

    res.json({
      success: true,
      data: expenditures,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

