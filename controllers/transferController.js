const Transfer = require('../models/Transfer');
const Asset = require('../models/Asset');

// Creates a new transfer request and validates asset availability
exports.createTransfer = async (req, res) => {
  try {
    const transferData = {
      ...req.body,
      initiatedBy: req.user._id
    };

    const count = await Transfer.countDocuments();
    transferData.transferNumber = `TRF-${Date.now()}-${count + 1}`;

    const asset = await Asset.findById(req.body.asset);
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    if (asset.currentBase.toString() !== req.body.fromBase.toString()) {
      return res.status(400).json({ message: 'Asset is not at the source base' });
    }

    if (asset.currentQuantity < req.body.quantity) {
      return res.status(400).json({ message: 'Insufficient quantity available' });
    }

    const transfer = await Transfer.create(transferData);

    await transfer.populate('asset fromBase toBase initiatedBy');

    res.status(201).json({
      success: true,
      data: transfer
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Retrieves transfer records with optional filtering and pagination
exports.getTransfers = async (req, res) => {
  try {
    const { startDate, endDate, baseId, equipmentType, status, page = 1, limit = 10 } = req.query;
    const user = req.user;

    const query = {};

    if (user.role === 'base_commander') {
      query.$or = [{ fromBase: user.baseId }, { toBase: user.baseId }];
    } else if (baseId) {
      query.$or = [{ fromBase: baseId }, { toBase: baseId }];
    }

    if (equipmentType) query.equipmentType = equipmentType;
    if (status) query.status = status;

    if (startDate || endDate) {
      query.transferDate = {};
      if (startDate) query.transferDate.$gte = new Date(startDate);
      if (endDate) query.transferDate.$lte = new Date(endDate);
    }

    const transfers = await Transfer.find(query)
      .populate('asset fromBase toBase initiatedBy approvedBy')
      .sort({ transferDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Transfer.countDocuments(query);

    res.json({
      success: true,
      data: transfers,
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

// Retrieves a single transfer record by ID
exports.getTransfer = async (req, res) => {
  try {
    const transfer = await Transfer.findById(req.params.id)
      .populate('asset fromBase toBase initiatedBy approvedBy');

    if (!transfer) {
      return res.status(404).json({ message: 'Transfer not found' });
    }

    res.json({
      success: true,
      data: transfer
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Approves a pending transfer request
exports.approveTransfer = async (req, res) => {
  try {
    const transfer = await Transfer.findById(req.params.id);

    if (!transfer) {
      return res.status(404).json({ message: 'Transfer not found' });
    }

    if (transfer.status !== 'pending') {
      return res.status(400).json({ message: 'Transfer is not pending' });
    }

    transfer.status = 'approved';
    transfer.approvedBy = req.user._id;
    await transfer.save();

    res.json({
      success: true,
      data: transfer
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Completes an approved transfer by updating asset quantities at source and destination bases
exports.completeTransfer = async (req, res) => {
  try {
    const transfer = await Transfer.findById(req.params.id)
      .populate('asset');

    if (!transfer) {
      return res.status(404).json({ message: 'Transfer not found' });
    }

    if (transfer.status !== 'approved') {
      return res.status(400).json({ message: 'Transfer must be approved first' });
    }

    const asset = await Asset.findById(transfer.asset._id);
    if (!asset) {
      return res.status(404).json({ message: 'Source asset not found' });
    }
    if (asset.currentBase.toString() !== transfer.fromBase.toString()) {
      return res.status(400).json({ message: 'Source asset base mismatch' });
    }
    asset.currentQuantity -= transfer.quantity;
    if (asset.currentQuantity < 0) asset.currentQuantity = 0;
    await asset.save();

    let destAsset = await Asset.findOne({
      name: asset.name,
      equipmentType: asset.equipmentType,
      currentBase: transfer.toBase
    });

    if (destAsset) {
      destAsset.currentQuantity += transfer.quantity;
      await destAsset.save();
    } else {
      await Asset.create({
        assetNumber: `${asset.assetNumber}-${Date.now()}`,
        equipmentType: asset.equipmentType,
        name: asset.name,
        description: asset.description,
        currentBase: transfer.toBase,
        currentQuantity: transfer.quantity,
        openingBalance: transfer.quantity
      });
    }

    transfer.status = 'completed';
    transfer.completedAt = new Date();
    await transfer.save();

    await transfer.populate('asset fromBase toBase initiatedBy approvedBy');

    res.json({
      success: true,
      data: transfer
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

