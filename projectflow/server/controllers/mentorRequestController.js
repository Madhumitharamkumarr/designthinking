const MentorRequest = require('../models/MentorRequest');
const Project = require('../models/Project');
const Event = require('../models/Event');
const User = require('../models/User');

// @desc   Create a mentor request (student selects preferred mentor)
// @route  POST /api/mentor-requests
// @access Student
const createMentorRequest = async (req, res) => {
  try {
    const { projectId, requestedMentorId, reason } = req.body;

    if (!projectId || !requestedMentorId) {
      return res.status(400).json({ message: 'projectId and requestedMentorId are required' });
    }

    // Verify project exists and belongs to this student
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (project.studentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only request mentors for your own projects' });
    }

    // Check if project already has an assigned mentor
    if (project.assignedMentor) {
      return res.status(400).json({ message: 'This project already has an assigned mentor' });
    }

    // Verify the requested user is a mentor
    const mentor = await User.findById(requestedMentorId);
    if (!mentor || mentor.role !== 'mentor') {
      return res.status(400).json({ message: 'Requested user is not a valid mentor' });
    }

    // Verify mentor is part of this event
    const event = await Event.findById(project.eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (!event.mentorIds.map((id) => id.toString()).includes(requestedMentorId)) {
      return res.status(400).json({ message: 'This mentor is not assigned to this event' });
    }

    // Check for duplicate request
    const existing = await MentorRequest.findOne({ projectId, requestedMentorId });
    if (existing) {
      return res.status(409).json({ message: 'You already requested this mentor for this project' });
    }

    const mentorRequest = await MentorRequest.create({
      projectId,
      studentId: req.user._id,
      requestedMentorId,
      eventId: project.eventId,
      reason: reason || '',
    });

    await mentorRequest.populate([
      { path: 'projectId', select: 'projectTitle' },
      { path: 'requestedMentorId', select: 'name email' },
      { path: 'studentId', select: 'name email' },
    ]);

    res.status(201).json(mentorRequest);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Duplicate mentor request' });
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc   Get all mentor requests (filterable)
// @route  GET /api/mentor-requests
// @access Admin, Coordinator
const getMentorRequests = async (req, res) => {
  try {
    const { status, eventId } = req.query;
    let query = {};

    if (status) query.status = status;
    if (eventId) query.eventId = eventId;

    // Coordinator sees only requests from their events
    if (req.user.role === 'coordinator') {
      const myEvents = await Event.find({ coordinatorId: req.user._id }).select('_id');
      query.eventId = { $in: myEvents.map((e) => e._id) };
    }

    // Students see only their own requests
    if (req.user.role === 'student') {
      query.studentId = req.user._id;
    }

    const requests = await MentorRequest.find(query)
      .populate('projectId', 'projectTitle description')
      .populate('studentId', 'name email')
      .populate('requestedMentorId', 'name email')
      .populate('eventId', 'title type')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Get mentor requests for a specific project
// @route  GET /api/mentor-requests/project/:projectId
// @access Authenticated
const getMentorRequestsByProject = async (req, res) => {
  try {
    const requests = await MentorRequest.find({ projectId: req.params.projectId })
      .populate('requestedMentorId', 'name email')
      .populate('studentId', 'name email')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Review a mentor request (approve/reject)
// @route  PATCH /api/mentor-requests/:id/review
// @access Admin
const reviewMentorRequest = async (req, res) => {
  try {
    const { status, adminNote, overrideMentorId } = req.body;

    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'status must be "approved" or "rejected"' });
    }

    const mentorRequest = await MentorRequest.findById(req.params.id);
    if (!mentorRequest) {
      return res.status(404).json({ message: 'Mentor request not found' });
    }

    if (mentorRequest.status !== 'pending') {
      return res.status(400).json({ message: 'This request has already been reviewed' });
    }

    // Update the request
    mentorRequest.status = status;
    mentorRequest.adminNote = adminNote || '';
    mentorRequest.reviewedBy = req.user._id;
    mentorRequest.reviewedAt = new Date();
    await mentorRequest.save();

    // If approved, assign the mentor to the project
    if (status === 'approved') {
      const assignedMentorId = overrideMentorId || mentorRequest.requestedMentorId;

      // Validate override mentor if provided
      if (overrideMentorId) {
        const overrideMentor = await User.findById(overrideMentorId);
        if (!overrideMentor || overrideMentor.role !== 'mentor') {
          return res.status(400).json({ message: 'Override mentor is not valid' });
        }
      }

      await Project.findByIdAndUpdate(mentorRequest.projectId, {
        assignedMentor: assignedMentorId,
        mentorAssignedAt: new Date(),
      });

      // Reject other pending requests for the same project
      await MentorRequest.updateMany(
        {
          projectId: mentorRequest.projectId,
          _id: { $ne: mentorRequest._id },
          status: 'pending',
        },
        {
          status: 'rejected',
          adminNote: 'Another mentor was assigned to this project',
          reviewedBy: req.user._id,
          reviewedAt: new Date(),
        }
      );
    }

    await mentorRequest.populate([
      { path: 'projectId', select: 'projectTitle' },
      { path: 'requestedMentorId', select: 'name email' },
      { path: 'studentId', select: 'name email' },
      { path: 'reviewedBy', select: 'name' },
    ]);

    res.json(mentorRequest);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createMentorRequest,
  getMentorRequests,
  getMentorRequestsByProject,
  reviewMentorRequest,
};
