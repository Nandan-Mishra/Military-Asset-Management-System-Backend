const express = require('express');
const router = express.Router();
const {
  createAssignment,
  getAssignments,
  returnAssignment,
  createExpenditure,
  getExpenditures
} = require('../controllers/assignmentController');
const { protect } = require('../middleware/auth');

router.post('/assignments', protect, createAssignment);
router.get('/assignments', protect, getAssignments);
router.patch('/assignments/:id/return', protect, returnAssignment);

router.post('/expenditures', protect, createExpenditure);
router.get('/expenditures', protect, getExpenditures);

module.exports = router;

