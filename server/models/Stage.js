const mongoose = require('mongoose');

const stageSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    stageName: {
      type: String,
      enum: ['Idea', 'Prototype', 'Final'],
      required: true,
    },
    order: { type: Number, enum: [1, 2, 3], required: true },
    deadline: { type: Date, required: true },
    instructions: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Stage', stageSchema);
