const Submission = require('../models/Submission');
const Project = require('../models/Project');
const Stage = require('../models/Stage');

// @desc   Create a submission
// @route  POST /api/submissions
// @access Student
const createSubmission = async (req, res) => {
  try {
    const { projectId, stageId, fileUrl, fileName, notes } = req.body;

    if (!projectId || !stageId) {
      return res.status(400).json({ message: 'projectId and stageId are required' });
    }

    // Verify project belongs to student
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (
      req.user.role === 'student' &&
      project.studentId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Not authorized to submit for this project' });
    }

    // Check for existing submission for this stage
    const existing = await Submission.findOne({ projectId, stageId });
    if (existing) {
      // Update existing submission
      existing.fileUrl = fileUrl || existing.fileUrl;
      existing.fileName = fileName || existing.fileName;
      existing.notes = notes || existing.notes;
      existing.status = 'pending';
      existing.feedback = '';
      await existing.save();
      return res.json(existing);
    }

    const submission = await Submission.create({
      projectId,
      stageId,
      fileUrl: fileUrl || '',
      fileName: fileName || '',
      notes: notes || '',
    });

    res.status(201).json(submission);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Get submissions (role-filtered)
// @route  GET /api/submissions
// @access Authenticated
const getSubmissions = async (req, res) => {
  try {
    const { projectId, stageId } = req.query;
    let query = {};

    if (projectId) query.projectId = projectId;
    if (stageId) query.stageId = stageId;

    // Students see only their project submissions
    if (req.user.role === 'student') {
      const myProjects = await Project.find({ studentId: req.user._id }).select('_id');
      query.projectId = { $in: myProjects.map((p) => p._id) };
    }

    // Coordinators see submissions from their events' projects
    if (req.user.role === 'coordinator') {
      const Event = require('../models/Event');
      const myEvents = await Event.find({ coordinatorId: req.user._id }).select('_id');
      const eventIds = myEvents.map((e) => e._id);
      const projects = await Project.find({ eventId: { $in: eventIds } }).select('_id');
      query.projectId = { $in: projects.map((p) => p._id) };
    }

    const submissions = await Submission.find(query)
      .populate({ path: 'projectId', populate: { path: 'studentId', select: 'name email' } })
      .populate('stageId', 'stageName order')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 });

    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Review a submission (approve/reject + feedback)
// @route  PATCH /api/submissions/:id/review
// @access Coordinator
const reviewSubmission = async (req, res) => {
  try {
    const { status, feedback } = req.body;

    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'status must be "approved" or "rejected"' });
    }

    const submission = await Submission.findById(req.params.id);
    if (!submission) return res.status(404).json({ message: 'Submission not found' });

    submission.status = status;
    submission.feedback = feedback || '';
    submission.reviewedBy = req.user._id;
    await submission.save();

    res.json(submission);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Get single submission
// @route  GET /api/submissions/:id
// @access Authenticated
const getSubmission = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate({ path: 'projectId', populate: { path: 'studentId', select: 'name email' } })
      .populate('stageId', 'stageName order deadline')
      .populate('reviewedBy', 'name email');

    if (!submission) return res.status(404).json({ message: 'Submission not found' });
    res.json(submission);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createSubmission, getSubmissions, reviewSubmission, getSubmission };
