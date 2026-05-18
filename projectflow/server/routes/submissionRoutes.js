const express = require('express');
const router = express.Router();
const {
  createSubmission,
  getSubmissions,
  reviewSubmission,
  getSubmission,
} = require('../controllers/submissionController');
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

router.post('/', protect, requireRole('student'), createSubmission);
router.get('/', protect, getSubmissions);
router.get('/:id', protect, getSubmission);
router.patch('/:id/review', protect, requireRole('coordinator', 'admin'), reviewSubmission);

module.exports = router;
