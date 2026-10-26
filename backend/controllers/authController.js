const User = require('../models/User')
const { generateToken } = require('../middleware/authMiddleware')

// POST /api/auth/register
const register = async (req, res) => {
  const { name, email, password, role, specialisation, phone, bio } = req.body

  const existing = await User.findOne({ email })
  if (existing) {
    return res.status(400).json({ success: false, message: 'Email already in use' })
  }

  const user = await User.create({ name, email, password, role, specialisation, phone, bio })
  const token = generateToken(user._id)

  res.status(201).json({
    success: true,
    token,
    user,
  })
}

// POST /api/auth/login
const login = async (req, res) => {
  const { email, password } = req.body

  const user = await User.findOne({ email }).select('+password')
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' })
  }

  const token = generateToken(user._id)

  // Remove password from response
  const userObj = user.toJSON()

  res.status(200).json({
    success: true,
    token,
    user: userObj,
  })
}

// GET /api/auth/me
const getMe = async (req, res) => {
  res.status(200).json({ success: true, user: req.user })
}

// PATCH /api/auth/me
const updateMe = async (req, res) => {
  const { name, phone, bio, specialisation } = req.body
  const updates = {}
  if (name !== undefined) updates.name = name
  if (phone !== undefined) updates.phone = phone
  if (bio !== undefined) updates.bio = bio
  if (specialisation !== undefined && req.user.role === 'provider') updates.specialisation = specialisation

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  })

  res.status(200).json({ success: true, user })
}

module.exports = { register, login, getMe, updateMe }
