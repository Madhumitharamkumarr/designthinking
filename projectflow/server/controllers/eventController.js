const Event = require('../models/Event');
const User = require('../models/User');

// @desc   Create event
// @route  POST /api/events
// @access Admin
const createEvent = async (req, res) => {
  try {
    const { title, type, description, coordinatorId, mentorIds } = req.body;

    if (!title || !description || !coordinatorId) {
      return res.status(400).json({ message: 'Title, description, and coordinator are required' });
    }

    // Validate coordinator exists and has correct role
    const coordinator = await User.findById(coordinatorId);
    if (!coordinator || coordinator.role !== 'coordinator') {
      return res.status(400).json({ message: 'Invalid coordinator ID or user is not a coordinator' });
    }

    const event = await Event.create({
      title,
      type: type || 'other',
      description,
      coordinatorId,
      mentorIds: mentorIds || [],
      createdBy: req.user._id,
    });

    await event.populate(['coordinatorId', 'mentorIds', 'createdBy']);
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Get all events
// @route  GET /api/events
// @access Authenticated
const getEvents = async (req, res) => {
  try {
    let query = {};

    // Coordinators see their events
    if (req.user.role === 'coordinator') {
      query.coordinatorId = req.user._id;
    }
    // Mentors see events they're assigned to
    if (req.user.role === 'mentor') {
      query.mentorIds = req.user._id;
    }

    const events = await Event.find(query)
      .populate('coordinatorId', 'name email')
      .populate('mentorIds', 'name email')
      .sort({ createdAt: -1 });

    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Get single event
// @route  GET /api/events/:id
// @access Authenticated
const getEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('coordinatorId', 'name email')
      .populate('mentorIds', 'name email')
      .populate('createdBy', 'name email');

    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Update event
// @route  PUT /api/events/:id
// @access Admin
const updateEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate(['coordinatorId', 'mentorIds']);

    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Delete event
// @route  DELETE /api/events/:id
// @access Admin
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createEvent, getEvents, getEvent, updateEvent, deleteEvent };
