const Asset = require('../models/Asset');
const { ROLES } = require('../utils/constants');

// Retrieves available assets filtered by base and equipment type with quantity greater than zero
exports.getAssets = async (req, res) => {
  try {
    const { baseId, equipmentType } = req.query;
    const user = req.user;

    const query = {};

    if (user.role === ROLES.BASE_COMMANDER) {
      query.currentBase = user.baseId;
    } else if (baseId) {
      query.currentBase = baseId;
    }

    if (equipmentType) {
      query.equipmentType = equipmentType;
    }

    query.currentQuantity = { $gt: 0 };

    const assets = await Asset.find(query)
      .populate('currentBase')
      .sort({ name: 1 });

    res.json({
      success: true,
      data: assets
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

