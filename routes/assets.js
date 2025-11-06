const express = require('express');
const router = express.Router();
const { getAssets } = require('../controllers/assetController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getAssets);

module.exports = router;

