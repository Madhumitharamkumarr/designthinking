const express = require('express');
const router = express.Router();
const {
  createMentorRequest,
  getMentorRequests,
  getMentorRequestsByProject,
  reviewMentorRequest,
} = require('../controllers/mentorRequestController');
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

router.post('/', protect, requireRole('student'), createMentorRequest);
router.get('/', protect, getMentorRequests);
router.get('/project/:projectId', protect, getMentorRequestsByProject);
router.patch('/:id/review', protect, requireRole('admin'), reviewMentorRequest);

module.exports = router;
