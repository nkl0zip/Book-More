const mongoose = require('mongoose')

const slotSchema = new mongoose.Schema(
  {
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Provider is required'],
      index: true,
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      default: null,
    },
    startTime: {
      type: Date,
      required: [true, 'Start time is required'],
    },
    endTime: {
      type: Date,
      required: [true, 'End time is required'],
    },
    isBooked: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [300, 'Notes cannot exceed 300 characters'],
    },
  },
  {
    timestamps: true,
  }
)

// Compound index for fast overlap queries
slotSchema.index({ provider: 1, startTime: 1, endTime: 1 })

// Pre-save: endTime > startTime
slotSchema.pre('save', function (next) {
  if (this.endTime <= this.startTime) {
    const err = new Error('End time must be after start time')
    err.statusCode = 400
    return next(err)
  }
  next()
})

// Pre-save: startTime must be in the future (only on new slots, not updates to isBooked etc.)
slotSchema.pre('save', function (next) {
  if (this.isNew && this.startTime <= new Date()) {
    const err = new Error('Slot start time must be in the future')
    err.statusCode = 400
    return next(err)
  }
  next()
})

module.exports = mongoose.model('Slot', slotSchema)
