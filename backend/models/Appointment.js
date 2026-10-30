const mongoose = require('mongoose')

const STATUSES = ['pending', 'confirmed', 'cancelled', 'completed', 'rescheduled']

const appointmentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Patient is required'],
      index: true,
    },
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Provider is required'],
      index: true,
    },
    slot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Slot',
      required: [true, 'Slot is required'],
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      default: null,
    },
    // Denormalised snapshot so appointment history is stable even if slot is deleted
    startTime: {
      type: Date,
      required: [true, 'Start time is required'],
    },
    endTime: {
      type: Date,
      required: [true, 'End time is required'],
    },
    status: {
      type: String,
      enum: { values: STATUSES, message: 'Status must be one of: ' + STATUSES.join(', ') },
      default: 'confirmed',
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
    // Cancellation
    cancelledBy: {
      type: String,
      enum: ['patient', 'provider', null],
      default: null,
    },
    cancellationReason: {
      type: String,
      trim: true,
      maxlength: [300, 'Cancellation reason cannot exceed 300 characters'],
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    // Rescheduling — points to the replacement appointment
    rescheduledTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      default: null,
    },
    rescheduledFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      default: null,
    },
  },
  {
    timestamps: true,
  }
)

// Compound index for quick "does this slot already have a live appointment?" lookup
appointmentSchema.index({ slot: 1, status: 1 })
// For "my appointments sorted by time" queries
appointmentSchema.index({ patient: 1, startTime: -1 })
appointmentSchema.index({ provider: 1, startTime: -1 })

module.exports = mongoose.model('Appointment', appointmentSchema)
