const express = require('express');
const router = express.Router();
const {
  createPurchase,
  getPurchases,
  getPurchase
} = require('../controllers/purchaseController');
const { protect } = require('../middleware/auth');
const { checkRole } = require('../middleware/rbac');
const { ROLES } = require('../utils/constants');

router.post('/', protect, checkRole(ROLES.ADMIN, ROLES.BASE_COMMANDER, ROLES.LOGISTICS_OFFICER), createPurchase);
router.get('/', protect, getPurchases);
router.get('/:id', protect, getPurchase);

module.exports = router;

