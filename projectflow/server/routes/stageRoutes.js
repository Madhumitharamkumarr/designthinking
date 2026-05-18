const express = require('express');
const router = express.Router();
const {
  createStage,
  getStagesByEvent,
  updateStage,
  deleteStage,
} = require('../controllers/stageController');
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

router.post('/', protect, requireRole('coordinator', 'admin'), createStage);
router.get('/:eventId', protect, getStagesByEvent);
router.put('/:id', protect, requireRole('coordinator', 'admin'), updateStage);
router.delete('/:id', protect, requireRole('coordinator', 'admin'), deleteStage);

module.exports = router;
