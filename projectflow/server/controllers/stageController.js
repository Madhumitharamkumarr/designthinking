const Stage = require('../models/Stage');
const Event = require('../models/Event');

// @desc   Create stage for an event
// @route  POST /api/stages
// @access Coordinator
const createStage = async (req, res) => {
  try {
    const { eventId, stageName, deadline, instructions } = req.body;

    if (!eventId || !stageName || !deadline) {
      return res.status(400).json({ message: 'eventId, stageName, and deadline are required' });
    }

    // Verify coordinator owns this event
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (
      req.user.role === 'coordinator' &&
      event.coordinatorId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'You are not the coordinator of this event' });
    }

    // Determine order based on stageName
    const orderMap = { Idea: 1, Prototype: 2, Final: 3 };
    const order = orderMap[stageName];

    // Check if stage already exists
    const existingStage = await Stage.findOne({ eventId, stageName });
    if (existingStage) {
      return res.status(409).json({ message: `Stage "${stageName}" already exists for this event` });
    }

    const stage = await Stage.create({ eventId, stageName, order, deadline, instructions });
    res.status(201).json(stage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Get stages for an event
// @route  GET /api/stages/:eventId
// @access Authenticated
const getStagesByEvent = async (req, res) => {
  try {
    const stages = await Stage.find({ eventId: req.params.eventId }).sort({ order: 1 });
    res.json(stages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Update stage
// @route  PUT /api/stages/:id
// @access Coordinator
const updateStage = async (req, res) => {
  try {
    const stage = await Stage.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!stage) return res.status(404).json({ message: 'Stage not found' });
    res.json(stage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Delete stage
// @route  DELETE /api/stages/:id
// @access Coordinator
const deleteStage = async (req, res) => {
  try {
    const stage = await Stage.findByIdAndDelete(req.params.id);
    if (!stage) return res.status(404).json({ message: 'Stage not found' });
    res.json({ message: 'Stage deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createStage, getStagesByEvent, updateStage, deleteStage };
