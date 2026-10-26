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
}

module.exports = { validate, schemas }
