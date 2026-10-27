const User = require('../models/User')

// GET /api/providers — list all active providers (public)
const getAllProviders = async (req, res) => {
  const { specialisation, search, page = 1, limit = 20 } = req.query

  const filter = { role: 'provider', isActive: true }

  if (specialisation) {
    filter.specialisation = { $regex: specialisation, $options: 'i' }
  }

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { specialisation: { $regex: search, $options: 'i' } },
      { bio: { $regex: search, $options: 'i' } },
    ]
  }

  const skip = (Number(page) - 1) * Number(limit)

  const [providers, total] = await Promise.all([
    User.find(filter)
      .select('name email specialisation bio phone avatarUrl createdAt')
      .sort({ name: 1 })
      .skip(skip)
      .limit(Number(limit)),
    User.countDocuments(filter),
  ])

  res.status(200).json({
    success: true,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
    providers,
  })
}

// GET /api/providers/:id — single provider public profile
const getProviderById = async (req, res) => {
  const provider = await User.findOne({
    _id: req.params.id,
    role: 'provider',
    isActive: true,
  }).select('name email specialisation bio phone avatarUrl createdAt')

  if (!provider) {
    return res.status(404).json({ success: false, message: 'Provider not found' })
  }

  res.status(200).json({ success: true, provider })
}

// GET /api/providers/me — authenticated provider's own full profile
const getMyProfile = async (req, res) => {
  const provider = await User.findById(req.user._id)
  if (!provider || provider.role !== 'provider') {
    return res.status(403).json({ success: false, message: 'Not a provider account' })
  }
  res.status(200).json({ success: true, provider })
}

// PATCH /api/providers/me — update own profile
const updateMyProfile = async (req, res) => {
  const { name, specialisation, bio, phone, avatarUrl } = req.body

  const updates = {}
  if (name !== undefined) updates.name = name
  if (specialisation !== undefined) updates.specialisation = specialisation
  if (bio !== undefined) updates.bio = bio
  if (phone !== undefined) updates.phone = phone
  if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl

  const provider = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  })

  if (!provider) {
    return res.status(404).json({ success: false, message: 'Provider not found' })
  }

  res.status(200).json({ success: true, provider })
}

// PATCH /api/providers/me/deactivate — soft-delete own account
const deactivateAccount = async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { isActive: false })
  res.status(200).json({ success: true, message: 'Account deactivated' })
}

module.exports = {
  getAllProviders,
  getProviderById,
  getMyProfile,
  updateMyProfile,
  deactivateAccount,
}
