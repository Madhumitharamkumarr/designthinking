const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    stageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Stage',
      required: true,
    },
    fileUrl: { type: String, default: '' },
    fileName: { type: String, default: '' },
    notes: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    feedback: { type: String, default: '' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Submission', submissionSchema);
