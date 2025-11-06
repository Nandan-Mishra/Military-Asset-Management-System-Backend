const Purchase = require('../models/Purchase');
const Asset = require('../models/Asset');

// Creates a new purchase record and updates asset quantities
exports.createPurchase = async (req, res) => {
  try {
    const { asset: assetInput, equipmentType, base } = req.body;

    let assetId = assetInput;
    const isLikelyObjectId = typeof assetInput === 'string' && assetInput.length === 24 && /^[0-9a-fA-F]+$/.test(assetInput);

    if (!isLikelyObjectId) {
      if (!equipmentType || !base) {
        return res.status(400).json({ message: 'When creating a new asset by name, equipmentType and base are required' });
      }

      let existing = await Asset.findOne({ name: assetInput, currentBase: base, equipmentType });
      if (!existing) {
        const assetNumber = `${String(equipmentType).slice(0,3).toUpperCase()}-${Date.now()}`;
        existing = await Asset.create({
          assetNumber,
          equipmentType,
          name: assetInput,
          currentBase: base,
          currentQuantity: 0,
          openingBalance: 0,
        });
      }
      assetId = existing._id;
      req.body.asset = assetId;
    }

    const purchaseData = {
      ...req.body,
      purchasedBy: req.user._id,
      totalAmount: req.body.quantity * req.body.unitPrice
    };

    const count = await Purchase.countDocuments();
    purchaseData.purchaseNumber = `PUR-${Date.now()}-${count + 1}`;

    const purchase = await Purchase.create(purchaseData);

    await Asset.findByIdAndUpdate(
      purchase.asset,
      { 
        $inc: { 
          currentQuantity: purchase.quantity,
          openingBalance: purchase.quantity
        }
      }
    );

    await purchase.populate('base asset purchasedBy');

    res.status(201).json({
      success: true,
      data: purchase
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Retrieves purchase records with optional filtering by date, base, and equipment type
exports.getPurchases = async (req, res) => {
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
      query.purchaseDate = {};
      if (startDate) query.purchaseDate.$gte = new Date(startDate);
      if (endDate) query.purchaseDate.$lte = new Date(endDate);
    }

    const purchases = await Purchase.find(query)
      .populate('base asset purchasedBy')
      .sort({ purchaseDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Purchase.countDocuments(query);

    res.json({
      success: true,
      data: purchases,
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

// Retrieves a single purchase record by ID
exports.getPurchase = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id)
      .populate('base asset purchasedBy');

    if (!purchase) {
      return res.status(404).json({ message: 'Purchase not found' });
    }

    res.json({
      success: true,
      data: purchase
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

