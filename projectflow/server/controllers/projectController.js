const Project = require('../models/Project');
const Event = require('../models/Event');

// @desc   Create a project
// @route  POST /api/projects
// @access Student
const createProject = async (req, res) => {
  try {
    const { projectTitle, description, eventId, teamMembers } = req.body;

    if (!projectTitle || !description || !eventId) {
      return res.status(400).json({ message: 'projectTitle, description, and eventId are required' });
    }

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Check if student already has a project in this event
    const existing = await Project.findOne({ studentId: req.user._id, eventId });
    if (existing) {
      return res.status(409).json({ message: 'You already have a project in this event' });
    }

    const project = await Project.create({
      projectTitle,
      description,
      studentId: req.user._id,
      eventId,
      teamMembers: teamMembers || [],
    });

    await project.populate(['studentId', 'eventId']);
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Get projects (role-filtered)
// @route  GET /api/projects
// @access Authenticated
const getProjects = async (req, res) => {
  try {
    let query = {};
    const { eventId } = req.query;

    if (eventId) query.eventId = eventId;

    // Students see only their own projects
    if (req.user.role === 'student') {
      query.studentId = req.user._id;
    }

    // Mentors see projects from their events
    if (req.user.role === 'mentor') {
      const Event = require('../models/Event');
      const mentorEvents = await Event.find({ mentorIds: req.user._id }).select('_id');
      const eventIds = mentorEvents.map((e) => e._id);
      query.eventId = { $in: eventIds };
    }

    const projects = await Project.find(query)
      .populate('studentId', 'name email')
      .populate('eventId', 'title type')
      .sort({ createdAt: -1 });

    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Get single project
// @route  GET /api/projects/:id
// @access Authenticated
const getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('studentId', 'name email')
      .populate('eventId', 'title type description coordinatorId mentorIds');

    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Update project
// @route  PUT /api/projects/:id
// @access Student (own project)
const updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (
      req.user.role === 'student' &&
      project.studentId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Not authorized to update this project' });
    }

    const updated = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate(['studentId', 'eventId']);

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createProject, getProjects, getProject, updateProject };
