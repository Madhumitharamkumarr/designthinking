const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    projectTitle: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    teamMembers: [{ type: String }],
    assignedMentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    assignedCoordinator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    mentorAssignedAt: { type: Date },
    coordinatorAssignedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Project', projectSchema);
