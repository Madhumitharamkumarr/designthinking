const Project = require('../models/Project');
const Event = require('../models/Event');
const User = require('../models/User');

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

    // Mentors see ONLY their assigned projects
    if (req.user.role === 'mentor') {
      query.assignedMentor = req.user._id;
    }

    // Coordinators see ONLY their assigned projects
    if (req.user.role === 'coordinator') {
      query.assignedCoordinator = req.user._id;
    }

    const projects = await Project.find(query)
      .populate('studentId', 'name email')
      .populate('eventId', 'title type')
      .populate('assignedMentor', 'name email')
      .populate('assignedCoordinator', 'name email')
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
      .populate('eventId', 'title type description coordinatorId mentorIds')
      .populate('assignedMentor', 'name email')
      .populate('assignedCoordinator', 'name email');

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
    }).populate(['studentId', 'eventId', 'assignedMentor', 'assignedCoordinator']);

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Assign a mentor to a project
// @route  PATCH /api/projects/:id/assign-mentor
// @access Admin
const assignMentor = async (req, res) => {
  try {
    const { mentorId } = req.body;
    if (!mentorId) return res.status(400).json({ message: 'mentorId is required' });

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Validate mentor exists and has correct role
    const mentor = await User.findById(mentorId);
    if (!mentor || mentor.role !== 'mentor') {
      return res.status(400).json({ message: 'Invalid mentor ID or user is not a mentor' });
    }

    project.assignedMentor = mentorId;
    project.mentorAssignedAt = new Date();
    await project.save();

    await project.populate(['studentId', 'eventId', 'assignedMentor', 'assignedCoordinator']);
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Assign a coordinator to a project
// @route  PATCH /api/projects/:id/assign-coordinator
// @access Admin
const assignCoordinator = async (req, res) => {
  try {
    const { coordinatorId } = req.body;
    if (!coordinatorId) return res.status(400).json({ message: 'coordinatorId is required' });

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Validate coordinator exists and has correct role
    const coordinator = await User.findById(coordinatorId);
    if (!coordinator || coordinator.role !== 'coordinator') {
      return res.status(400).json({ message: 'Invalid coordinator ID or user is not a coordinator' });
    }

    project.assignedCoordinator = coordinatorId;
    project.coordinatorAssignedAt = new Date();
    await project.save();

    await project.populate(['studentId', 'eventId', 'assignedMentor', 'assignedCoordinator']);
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Remove mentor assignment from project
// @route  PATCH /api/projects/:id/unassign-mentor
// @access Admin
const unassignMentor = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    project.assignedMentor = null;
    project.mentorAssignedAt = undefined;
    await project.save();

    await project.populate(['studentId', 'eventId', 'assignedMentor', 'assignedCoordinator']);
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Remove coordinator assignment from project
// @route  PATCH /api/projects/:id/unassign-coordinator
// @access Admin
const unassignCoordinator = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    project.assignedCoordinator = null;
    project.coordinatorAssignedAt = undefined;
    await project.save();

    await project.populate(['studentId', 'eventId', 'assignedMentor', 'assignedCoordinator']);
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Get unassigned projects (no mentor or no coordinator)
// @route  GET /api/projects/unassigned
// @access Admin
const getUnassignedProjects = async (req, res) => {
  try {
    const { type } = req.query; // 'mentor', 'coordinator', or 'both'

    let query = {};
    if (type === 'mentor') {
      query.assignedMentor = null;
    } else if (type === 'coordinator') {
      query.assignedCoordinator = null;
    } else {
      // Default: projects missing either
      query.$or = [{ assignedMentor: null }, { assignedCoordinator: null }];
    }

    const projects = await Project.find(query)
      .populate('studentId', 'name email')
      .populate('eventId', 'title type')
      .populate('assignedMentor', 'name email')
      .populate('assignedCoordinator', 'name email')
      .sort({ createdAt: -1 });

    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createProject,
  getProjects,
  getProject,
  updateProject,
  assignMentor,
  assignCoordinator,
  unassignMentor,
  unassignCoordinator,
  getUnassignedProjects,
};
