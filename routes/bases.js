const express = require('express');
const router = express.Router();
const {
  createBase,
  getBases,
  getBase,
  updateBase,
  deleteBase
} = require('../controllers/baseController');
const { protect } = require('../middleware/auth');
const { checkRole } = require('../middleware/rbac');
const { ROLES } = require('../utils/constants');

router.post('/', protect, checkRole(ROLES.ADMIN, ROLES.BASE_COMMANDER), createBase);
router.get('/', getBases); // Public route for registration
router.get('/:id', protect, getBase);
router.put('/:id', protect, checkRole(ROLES.ADMIN), updateBase);
router.delete('/:id', protect, checkRole(ROLES.ADMIN), deleteBase);

module.exports = router;
