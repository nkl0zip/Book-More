const Joi = require('joi')

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false, stripUnknown: true })
  if (error) {
    const message = error.details.map((d) => d.message.replace(/['"]/g, '')).join('. ')
    return res.status(400).json({ success: false, message })
  }
  next()
}

const schemas = {
  register: Joi.object({
    name: Joi.string().trim().min(2).max(100).required().messages({
      'string.min': 'Name must be at least 2 characters',
      'any.required': 'Name is required',
    }),
    email: Joi.string().trim().email({ tlds: { allow: false } }).required().messages({
      'string.email': 'Please enter a valid email address',
      'any.required': 'Email is required',
    }),
    password: Joi.string().min(8).required().messages({
      'string.min': 'Password must be at least 8 characters',
      'any.required': 'Password is required',
    }),
    role: Joi.string().valid('patient', 'provider').default('patient'),
    specialisation: Joi.when('role', {
      is: 'provider',
      then: Joi.string().trim().min(2).required().messages({
        'any.required': 'Specialisation is required for providers',
      }),
      otherwise: Joi.string().optional().allow(''),
    }),
    phone: Joi.string().optional().allow(''),
    bio: Joi.string().max(500).optional().allow(''),
  }),

  login: Joi.object({
    email: Joi.string().trim().email({ tlds: { allow: false } }).required().messages({
      'string.email': 'Please enter a valid email address',
      'any.required': 'Email is required',
    }),
    password: Joi.string().required().messages({
      'any.required': 'Password is required',
    }),
  }),

  updateProfile: Joi.object({
    name: Joi.string().trim().min(2).max(100).optional(),
    phone: Joi.string().optional().allow(''),
    bio: Joi.string().max(500).optional().allow(''),
    specialisation: Joi.string().trim().optional().allow(''),
  }),

  updateProviderProfile: Joi.object({
    name: Joi.string().trim().min(2).max(100).optional().messages({
      'string.min': 'Name must be at least 2 characters',
    }),
    specialisation: Joi.string().trim().min(2).max(100).optional().messages({
      'string.min': 'Specialisation must be at least 2 characters',
    }),
    bio: Joi.string().max(500).optional().allow('').messages({
      'string.max': 'Bio cannot exceed 500 characters',
    }),
    phone: Joi.string()
      .pattern(/^[+\d\s\-().]{7,20}$/)
      .optional()
      .allow('')
      .messages({ 'string.pattern.base': 'Please enter a valid phone number' }),
    avatarUrl: Joi.string().uri().optional().allow('').messages({
      'string.uri': 'Avatar URL must be a valid URL',
    }),
  }),

  createService: Joi.object({
    name: Joi.string().trim().min(2).max(100).required().messages({
      'string.min': 'Service name must be at least 2 characters',
      'any.required': 'Service name is required',
    }),
    description: Joi.string().trim().max(500).optional().allow('').messages({
      'string.max': 'Description cannot exceed 500 characters',
    }),
    durationMinutes: Joi.number().integer().min(5).max(480).required().messages({
      'number.min': 'Duration must be at least 5 minutes',
      'number.max': 'Duration cannot exceed 480 minutes',
      'any.required': 'Duration is required',
    }),
    price: Joi.number().min(0).required().messages({
      'number.min': 'Price cannot be negative',
      'any.required': 'Price is required',
    }),
    currency: Joi.string().trim().uppercase().length(3).optional().default('INR').messages({
      'string.length': 'Currency must be a 3-letter code (e.g. INR, USD)',
    }),
  }),

  updateService: Joi.object({
    name: Joi.string().trim().min(2).max(100).optional().messages({
      'string.min': 'Service name must be at least 2 characters',
    }),
    description: Joi.string().trim().max(500).optional().allow('').messages({
      'string.max': 'Description cannot exceed 500 characters',
    }),
    durationMinutes: Joi.number().integer().min(5).max(480).optional().messages({
      'number.min': 'Duration must be at least 5 minutes',
      'number.max': 'Duration cannot exceed 480 minutes',
    }),
    price: Joi.number().min(0).optional().messages({
      'number.min': 'Price cannot be negative',
    }),
    currency: Joi.string().trim().uppercase().length(3).optional().messages({
      'string.length': 'Currency must be a 3-letter code (e.g. INR, USD)',
    }),
    isActive: Joi.boolean().optional(),
  }),

  createSlot: Joi.object({
    startTime: Joi.date().iso().greater('now').required().messages({
      'date.base':    'Start time must be a valid date',
      'date.greater': 'Start time must be in the future',
      'any.required': 'Start time is required',
    }),
    endTime: Joi.date().iso().greater(Joi.ref('startTime')).required().messages({
      'date.base':    'End time must be a valid date',
      'date.greater': 'End time must be after start time',
      'any.required': 'End time is required',
    }),
    service: Joi.string().hex().length(24).optional().allow(null, '').messages({
      'string.length': 'service must be a valid MongoDB ObjectId',
    }),
    notes: Joi.string().trim().max(300).optional().allow('').messages({
      'string.max': 'Notes cannot exceed 300 characters',
    }),
  }),

  updateSlot: Joi.object({
    startTime: Joi.date().iso().optional().messages({
      'date.base': 'Start time must be a valid date',
    }),
    endTime: Joi.date().iso().optional().messages({
      'date.base': 'End time must be a valid date',
    }),
    service: Joi.string().hex().length(24).optional().allow(null, '').messages({
      'string.length': 'service must be a valid MongoDB ObjectId',
    }),
    notes: Joi.string().trim().max(300).optional().allow('').messages({
      'string.max': 'Notes cannot exceed 300 characters',
    }),
  }),

  bookAppointment: Joi.object({
    slotId: Joi.string().hex().length(24).required().messages({
      'string.length': 'slotId must be a valid MongoDB ObjectId',
      'any.required': 'slotId is required',
    }),
    serviceId: Joi.string().hex().length(24).optional().allow(null, '').messages({
      'string.length': 'serviceId must be a valid MongoDB ObjectId',
    }),
    notes: Joi.string().trim().max(500).optional().allow('').messages({
      'string.max': 'Notes cannot exceed 500 characters',
    }),
  }),

  cancelAppointment: Joi.object({
    reason: Joi.string().trim().max(300).optional().allow('').messages({
      'string.max': 'Cancellation reason cannot exceed 300 characters',
    }),
  }),

  rescheduleAppointment: Joi.object({
    newSlotId: Joi.string().hex().length(24).required().messages({
      'string.length': 'newSlotId must be a valid MongoDB ObjectId',
      'any.required': 'newSlotId is required',
    }),
    notes: Joi.string().trim().max(500).optional().allow('').messages({
      'string.max': 'Notes cannot exceed 500 characters',
    }),
  }),

  providerRescheduleAppointment: Joi.object({
    newSlotId: Joi.string().hex().length(24).required().messages({
      'string.length': 'newSlotId must be a valid MongoDB ObjectId',
      'any.required': 'newSlotId is required',
    }),
    reason: Joi.string().trim().max(300).optional().allow('').messages({
      'string.max': 'Reason cannot exceed 300 characters',
    }),
  }),
}

module.exports = { validate, schemas }
