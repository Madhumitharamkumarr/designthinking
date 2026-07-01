const express = require('express');
const router = express.Router();
const {
  createEvent,
  getEvents,
  getEvent,
  updateEvent,
  deleteEvent,
} = require('../controllers/eventController');
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

router.get('/', protect, getEvents);
router.post('/', protect, requireRole('admin'), createEvent);
router.get('/:id', protect, getEvent);
router.put('/:id', protect, requireRole('admin'), updateEvent);
router.delete('/:id', protect, requireRole('admin'), deleteEvent);

module.exports = router;
