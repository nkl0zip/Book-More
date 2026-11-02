/* ─────────────────────────────────────────────────────────────────────────
 * adminController.js
 *
 * All routes require: protect + authorise('admin')
 * Routes:
 *   POST   /api/admin/create          — bootstrap first admin (ADMIN_SECRET guard)
 *   GET    /api/admin/stats           — platform-wide overview stats
 *   GET    /api/admin/users           — paginated user list with search + role filter
 *   GET    /api/admin/users/:id       — single user detail
 *   PATCH  /api/admin/users/:id       — update role / isActive
 *   DELETE /api/admin/users/:id       — hard delete user
 *   GET    /api/admin/appointments    — paginated appointment list with filters
 *   DELETE /api/admin/appointments/:id— hard delete appointment
 *   GET    /api/admin/slots           — paginated slot list
 *   DELETE /api/admin/slots/:id       — hard delete slot
 *   GET    /api/admin/services        — paginated service list
 *   PATCH  /api/admin/services/:id    — toggle isActive
 *   DELETE /api/admin/services/:id    — hard delete service
 * ─────────────────────────────────────────────────────────────────────────*/
const User = require('../models/User')
const Appointment = require('../models/Appointment')
const Slot = require('../models/Slot')
const Service = require('../models/Service')
const { generateToken } = require('../middleware/authMiddleware')

/* ── POST /api/admin/create ────────────────────────────────────────────── */
// Bootstrap: creates the first admin user. Requires ADMIN_SECRET in request body.
// After the first admin is created, that admin can elevate other users via PATCH /users/:id.
const createAdmin = async (req, res) => {
  const { name, email, password, adminSecret } = req.body

  if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ success: false, message: 'Invalid admin secret' })
  }
  if (!process.env.ADMIN_SECRET) {
    return res.status(503).json({ success: false, message: 'ADMIN_SECRET not configured on this server' })
  }

  const existing = await User.findOne({ email })
  if (existing) {
    return res.status(400).json({ success: false, message: 'Email already in use' })
  }

  const admin = await User.create({ name, email, password, role: 'admin' })
  const token = generateToken(admin._id)
  return res.status(201).json({ success: true, token, user: admin })
}

/* ── GET /api/admin/stats ──────────────────────────────────────────────── */
const getStats = async (req, res) => {
  const [
    totalUsers,
    totalPatients,
    totalProviders,
    totalAdmins,
    totalAppointments,
    activeAppointments,
    cancelledAppointments,
    totalSlots,
    availableSlots,
    totalServices,
    activeServices,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'patient' }),
    User.countDocuments({ role: 'provider' }),
    User.countDocuments({ role: 'admin' }),
    Appointment.countDocuments(),
    Appointment.countDocuments({ status: { $in: ['confirmed', 'pending'] } }),
    Appointment.countDocuments({ status: 'cancelled' }),
    Slot.countDocuments(),
    Slot.countDocuments({ isBooked: false, startTime: { $gte: new Date() } }),
    Service.countDocuments(),
    Service.countDocuments({ isActive: true }),
  ])

  const cancellationRate = totalAppointments > 0
    ? Math.round((cancelledAppointments / totalAppointments) * 100 * 10) / 10
    : 0

  return res.status(200).json({
    success: true,
    data: {
      users: { total: totalUsers, patients: totalPatients, providers: totalProviders, admins: totalAdmins },
      appointments: { total: totalAppointments, active: activeAppointments, cancelled: cancelledAppointments, cancellationRate },
      slots: { total: totalSlots, available: availableSlots },
      services: { total: totalServices, active: activeServices },
    },
  })
}

/* ── GET /api/admin/users ──────────────────────────────────────────────── */
const getUsers = async (req, res) => {
  const { role, search, page = 1, limit = 20, sort = '-createdAt' } = req.query
  const filter = {}
  if (role) filter.role = role
  if (search) {
    filter.$or = [
      { name:  { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ]
  }
  const skip  = (Number(page) - 1) * Number(limit)
  const total = await User.countDocuments(filter)
  const users = await User.find(filter).sort(sort).skip(skip).limit(Number(limit))
  return res.status(200).json({ success: true, count: users.length, total, page: Number(page), pages: Math.ceil(total / Number(limit)), data: users })
}

/* ── GET /api/admin/users/:id ──────────────────────────────────────────── */
const getUserById = async (req, res) => {
  const user = await User.findById(req.params.id)
  if (!user) return res.status(404).json({ success: false, message: 'User not found' })
  return res.status(200).json({ success: true, data: user })
}

/* ── PATCH /api/admin/users/:id ────────────────────────────────────────── */
const updateUser = async (req, res) => {
  const { role, isActive, name, specialisation } = req.body
  const allowed = {}
  if (role !== undefined) {
    if (!['patient', 'provider', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' })
    }
    allowed.role = role
  }
  if (isActive !== undefined) allowed.isActive = isActive
  if (name !== undefined) allowed.name = name
  if (specialisation !== undefined) allowed.specialisation = specialisation

  if (req.params.id === req.user._id.toString()) {
    return res.status(400).json({ success: false, message: 'Admins cannot modify their own account via this endpoint' })
  }

  const user = await User.findByIdAndUpdate(req.params.id, allowed, { new: true, runValidators: true })
  if (!user) return res.status(404).json({ success: false, message: 'User not found' })
  return res.status(200).json({ success: true, data: user })
}

/* ── DELETE /api/admin/users/:id ────────────────────────────────────────── */
const deleteUser = async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    return res.status(400).json({ success: false, message: 'Admins cannot delete their own account' })
  }
  const user = await User.findByIdAndDelete(req.params.id)
  if (!user) return res.status(404).json({ success: false, message: 'User not found' })
  return res.status(200).json({ success: true, message: 'User deleted' })
}

/* ── GET /api/admin/appointments ──────────────────────────────────────── */
const getAppointments = async (req, res) => {
  const { status, from, to, page = 1, limit = 20 } = req.query
  const filter = {}
  if (status) {
    const statuses = status.split(',').map(s => s.trim()).filter(Boolean)
    filter.status = statuses.length === 1 ? statuses[0] : { $in: statuses }
  }
  if (from || to) {
    filter.startTime = {}
    if (from) filter.startTime.$gte = new Date(from)
    if (to)   filter.startTime.$lte = new Date(to)
  }
  const skip  = (Number(page) - 1) * Number(limit)
  const total = await Appointment.countDocuments(filter)
  const appts = await Appointment.find(filter)
    .sort({ startTime: -1 })
    .skip(skip)
    .limit(Number(limit))
    .populate('patient', 'name email')
    .populate('provider', 'name specialisation email')
    .populate('service', 'name price')
  return res.status(200).json({ success: true, count: appts.length, total, page: Number(page), pages: Math.ceil(total / Number(limit)), data: appts })
}

/* ── DELETE /api/admin/appointments/:id ─────────────────────────────────── */
const deleteAppointment = async (req, res) => {
  const appt = await Appointment.findByIdAndDelete(req.params.id)
  if (!appt) return res.status(404).json({ success: false, message: 'Appointment not found' })
  // Free the slot if the appointment was active
  if (['confirmed', 'pending'].includes(appt.status)) {
    await Slot.findByIdAndUpdate(appt.slot, { isBooked: false })
  }
  return res.status(200).json({ success: true, message: 'Appointment deleted' })
}

/* ── GET /api/admin/slots ─────────────────────────────────────────────── */
const getSlots = async (req, res) => {
  const { available, providerId, page = 1, limit = 20 } = req.query
  const filter = {}
  if (providerId) filter.provider = providerId
  if (available === 'true')  filter.isBooked = false
  if (available === 'false') filter.isBooked = true
  const skip  = (Number(page) - 1) * Number(limit)
  const total = await Slot.countDocuments(filter)
  const slots = await Slot.find(filter)
    .sort({ startTime: -1 })
    .skip(skip)
    .limit(Number(limit))
    .populate('provider', 'name specialisation')
    .populate('service', 'name')
  return res.status(200).json({ success: true, count: slots.length, total, page: Number(page), pages: Math.ceil(total / Number(limit)), data: slots })
}

/* ── DELETE /api/admin/slots/:id ─────────────────────────────────────── */
const deleteSlot = async (req, res) => {
  const slot = await Slot.findByIdAndDelete(req.params.id)
  if (!slot) return res.status(404).json({ success: false, message: 'Slot not found' })
  return res.status(200).json({ success: true, message: 'Slot deleted' })
}

/* ── GET /api/admin/services ─────────────────────────────────────────── */
const getServices = async (req, res) => {
  const { providerId, page = 1, limit = 20 } = req.query
  const filter = {}
  if (providerId) filter.provider = providerId
  const skip  = (Number(page) - 1) * Number(limit)
  const total = await Service.countDocuments(filter)
  const services = await Service.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .populate('provider', 'name specialisation')
  return res.status(200).json({ success: true, count: services.length, total, page: Number(page), pages: Math.ceil(total / Number(limit)), data: services })
}

/* ── PATCH /api/admin/services/:id ──────────────────────────────────── */
const updateService = async (req, res) => {
  const { isActive } = req.body
  if (isActive === undefined) {
    return res.status(400).json({ success: false, message: 'No updatable field provided' })
  }
  const service = await Service.findByIdAndUpdate(req.params.id, { isActive }, { new: true, runValidators: true })
    .populate('provider', 'name')
  if (!service) return res.status(404).json({ success: false, message: 'Service not found' })
  return res.status(200).json({ success: true, data: service })
}

/* ── DELETE /api/admin/services/:id ──────────────────────────────────── */
const deleteService = async (req, res) => {
  const service = await Service.findByIdAndDelete(req.params.id)
  if (!service) return res.status(404).json({ success: false, message: 'Service not found' })
  return res.status(200).json({ success: true, message: 'Service deleted' })
}

module.exports = {
  createAdmin,
  getStats,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getAppointments,
  deleteAppointment,
  getSlots,
  deleteSlot,
  getServices,
  updateService,
  deleteService,
}
