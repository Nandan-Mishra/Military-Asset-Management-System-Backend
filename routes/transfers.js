const express = require('express');
const router = express.Router();
const {
  createTransfer,
  getTransfers,
  getTransfer,
  approveTransfer,
  completeTransfer
} = require('../controllers/transferController');
const { protect } = require('../middleware/auth');
const { checkRole } = require('../middleware/rbac');
const { ROLES } = require('../utils/constants');

router.post('/', protect, createTransfer);
router.get('/', protect, getTransfers);
router.get('/:id', protect, getTransfer);
router.patch('/:id/approve', protect, checkRole(ROLES.ADMIN, ROLES.BASE_COMMANDER), approveTransfer);
router.patch('/:id/complete', protect, completeTransfer);

module.exports = router;

