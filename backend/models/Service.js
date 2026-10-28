const mongoose = require('mongoose')

const serviceSchema = new mongoose.Schema(
  {
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Provider is required'],
    },
    name: {
      type: String,
      required: [true, 'Service name is required'],
      trim: true,
      minlength: [2, 'Service name must be at least 2 characters'],
      maxlength: [100, 'Service name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    durationMinutes: {
      type: Number,
      required: [true, 'Duration is required'],
      min: [5, 'Duration must be at least 5 minutes'],
      max: [480, 'Duration cannot exceed 480 minutes (8 hours)'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    currency: {
      type: String,
      default: 'INR',
      trim: true,
      uppercase: true,
      maxlength: [3, 'Currency code must be 3 characters'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
)

// Compound index: a provider cannot have two services with the same name
serviceSchema.index({ provider: 1, name: 1 }, { unique: true })

module.exports = mongoose.model('Service', serviceSchema)
