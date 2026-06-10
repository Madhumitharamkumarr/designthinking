const express = require('express');
const router = express.Router();
const {
  createProject,
  getProjects,
  getProject,
  updateProject,
  assignMentor,
  assignCoordinator,
  unassignMentor,
  unassignCoordinator,
  getUnassignedProjects,
} = require('../controllers/projectController');
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

// Must come before /:id routes to avoid conflicts
router.get('/unassigned', protect, requireRole('admin'), getUnassignedProjects);

router.post('/', protect, requireRole('student'), createProject);
router.get('/', protect, getProjects);
router.get('/:id', protect, getProject);
router.put('/:id', protect, requireRole('student', 'admin'), updateProject);

// Admin assignment endpoints
router.patch('/:id/assign-mentor', protect, requireRole('admin'), assignMentor);
router.patch('/:id/assign-coordinator', protect, requireRole('admin'), assignCoordinator);
router.patch('/:id/unassign-mentor', protect, requireRole('admin'), unassignMentor);
router.patch('/:id/unassign-coordinator', protect, requireRole('admin'), unassignCoordinator);

module.exports = router;
