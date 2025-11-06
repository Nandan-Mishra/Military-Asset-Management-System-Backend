const mongoose = require('mongoose');
const Purchase = require('../models/Purchase');
const Transfer = require('../models/Transfer');
const Assignment = require('../models/Assignment');
const Expenditure = require('../models/Expenditure');
const Asset = require('../models/Asset');
const { ROLES } = require('../utils/constants');

// Calculates and returns dashboard metrics including balances, movements, assignments, and expenditures
exports.getDashboardMetrics = async (req, res) => {
  try {
    const { startDate, endDate, baseId, equipmentType } = req.query;
    const user = req.user;

    let baseFilter = {};
    if (user.role === ROLES.BASE_COMMANDER) {
      baseFilter = { $or: [{ base: user.baseId }, { fromBase: user.baseId }, { toBase: user.baseId }] };
    } else if (baseId) {
      baseFilter = { $or: [{ base: baseId }, { fromBase: baseId }, { toBase: baseId }] };
    }

    // Builds MongoDB date range filter for queries
    const buildDateFilter = (fieldName) => {
      const filter = {};
      if (startDate || endDate) {
        filter[fieldName] = {};
        if (startDate) filter[fieldName].$gte = new Date(startDate);
        if (endDate) filter[fieldName].$lte = new Date(endDate);
      }
      return filter;
    };

    const equipmentFilter = equipmentType ? { equipmentType } : {};

    const baseFilterForAssets = {};
    if (user.role === ROLES.BASE_COMMANDER) {
      baseFilterForAssets.currentBase = user.baseId;
    } else if (baseId) {
      baseFilterForAssets.currentBase = mongoose.Types.ObjectId.isValid(baseId) 
        ? new mongoose.Types.ObjectId(baseId)
        : baseId;
    }
    if (equipmentType) {
      baseFilterForAssets.equipmentType = equipmentType;
    }

    let openingBalance = 0;
    
    if (startDate) {
        const purchasesBeforeStartQuery = { ...equipmentFilter, purchaseDate: { $lt: new Date(startDate) } };
        if (user.role === ROLES.BASE_COMMANDER) {
          purchasesBeforeStartQuery.base = user.baseId;
        } else if (baseId) {
          // Convert string baseId to ObjectId if needed
          purchasesBeforeStartQuery.base = mongoose.Types.ObjectId.isValid(baseId) 
            ? new mongoose.Types.ObjectId(baseId)
            : baseId;
        }
      
          const purchasesBeforeStart = await Purchase.aggregate([
            { $match: purchasesBeforeStartQuery },
            { $group: { _id: null, total: { $sum: '$quantity' } } }
          ]);
          
          openingBalance = purchasesBeforeStart[0]?.total || 0;
        } else {
          const purchasesQuery = { ...equipmentFilter };
          if (user.role === ROLES.BASE_COMMANDER) {
            purchasesQuery.base = user.baseId;
          } else if (baseId) {
            purchasesQuery.base = mongoose.Types.ObjectId.isValid(baseId) 
              ? new mongoose.Types.ObjectId(baseId)
              : baseId;
          }
          
          const allPurchases = await Purchase.aggregate([
            { $match: purchasesQuery },
            { $group: { _id: null, total: { $sum: '$quantity' } } }
          ]);
          
          openingBalance = allPurchases[0]?.total || 0;
        }
        
        let closingBalance = 0;

        const purchasesQuery = { ...buildDateFilter('purchaseDate'), ...equipmentFilter };
        if (user.role === ROLES.BASE_COMMANDER) {
          purchasesQuery.base = user.baseId;
        } else if (baseId) {
          purchasesQuery.base = mongoose.Types.ObjectId.isValid(baseId) 
            ? new mongoose.Types.ObjectId(baseId)
            : baseId;
        }

        const purchases = await Purchase.aggregate([
          { $match: purchasesQuery },
          { $group: { _id: null, total: { $sum: '$quantity' }, amount: { $sum: '$totalAmount' } } }
        ]);

        const transfersInQuery = { ...buildDateFilter('transferDate'), ...equipmentFilter, status: 'completed' };
        if (user.role === ROLES.BASE_COMMANDER) {
          transfersInQuery.toBase = user.baseId;
        } else if (baseId) {
          transfersInQuery.toBase = mongoose.Types.ObjectId.isValid(baseId) 
            ? new mongoose.Types.ObjectId(baseId)
            : baseId;
        }

        const transfersIn = await Transfer.aggregate([
          { $match: transfersInQuery },
          { $group: { _id: null, total: { $sum: '$quantity' } } }
        ]);

        const transfersOutQuery = { ...buildDateFilter('transferDate'), ...equipmentFilter, status: 'completed' };
        if (user.role === ROLES.BASE_COMMANDER) {
          transfersOutQuery.fromBase = user.baseId;
        } else if (baseId) {
          transfersOutQuery.fromBase = mongoose.Types.ObjectId.isValid(baseId) 
            ? new mongoose.Types.ObjectId(baseId)
            : baseId;
        }

        const transfersOut = await Transfer.aggregate([
          { $match: transfersOutQuery },
          { $group: { _id: null, total: { $sum: '$quantity' } } }
        ]);

        const assignedQuery = { ...buildDateFilter('assignmentDate'), ...equipmentFilter, isReturned: false };
        if (user.role === ROLES.BASE_COMMANDER) {
          assignedQuery.base = user.baseId;
        } else if (baseId) {
          assignedQuery.base = mongoose.Types.ObjectId.isValid(baseId) 
            ? new mongoose.Types.ObjectId(baseId)
            : baseId;
        }

        const assigned = await Assignment.aggregate([
          { $match: assignedQuery },
          { $group: { _id: null, total: { $sum: '$quantity' } } }
        ]);

        const expendedQuery = { ...buildDateFilter('expenditureDate'), ...equipmentFilter };
        if (user.role === ROLES.BASE_COMMANDER) {
          expendedQuery.base = user.baseId;
        } else if (baseId) {
          expendedQuery.base = mongoose.Types.ObjectId.isValid(baseId) 
            ? new mongoose.Types.ObjectId(baseId)
            : baseId;
        }

        const expended = await Expenditure.aggregate([
          { $match: expendedQuery },
          { $group: { _id: null, total: { $sum: '$quantity' } } }
        ]);
    const closingBalanceResult = await Asset.aggregate([
      { $match: baseFilterForAssets },
      { $group: { _id: null, total: { $sum: '$currentQuantity' } } }
    ]);
    closingBalance = closingBalanceResult[0]?.total || 0;

        const purchasesTotal = purchases[0]?.total || 0;
        const transfersInTotal = transfersIn[0]?.total || 0;
        const transfersOutTotal = transfersOut[0]?.total || 0;
        const netMovement = purchasesTotal + transfersInTotal - transfersOutTotal;

    res.json({
      success: true,
      data: {
        openingBalance: openingBalance,
        closingBalance: closingBalance,
        netMovement: {
          total: netMovement,
          purchases: purchasesTotal,
          transfersIn: transfersInTotal,
          transfersOut: transfersOutTotal
        },
        assigned: assigned[0]?.total || 0,
        expended: expended[0]?.total || 0
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

