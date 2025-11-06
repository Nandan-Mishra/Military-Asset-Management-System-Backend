const express = require('express');
const router = express.Router();
const { userAuth } = require('../controllers/userAuthController');

// Single endpoint to register or login based on existence
router.post('/auth', userAuth);

module.exports = router;

