const Appointment = require('../models/Appointment')
const Slot = require('../models/Slot')
const Service = require('../models/Service')

/* ─── State machine ───────────────────────────────────────────────────────── */
const TRANSITIONS = {
  confirmed:   ['cancelled', 'completed', 'rescheduled'],
  pending:     ['confirmed', 'cancelled'],
  rescheduled: ['cancelled'],
  cancelled:   [],
  completed:   [],
}
const canTransition = (from, to) => TRANSITIONS[from]?.includes(to) ?? false

/* ─── Shared populate helper ──────────────────────────────────────────────── */
const populateFull = (query) =>
  query
    .populate('provider', 'name specialisation avatarUrl phone')
    .populate('patient', 'name email phone')
    .populate('slot', 'startTime endTime notes')
    .populate('service', 'name durationMinutes price currency description')
    .populate('rescheduledTo', 'startTime endTime status')
    .populate('rescheduledFrom', 'startTime endTime status')

/* ─── bookAppointment  POST /api/appointments ─────────────────────────────── */
const bookAppointment = async (req, res) => {
  const { slotId, serviceId, notes } = req.body
  const patientId = req.user._id

  const slot = await Slot.findById(slotId)
  if (!slot) return res.status(404).json({ success: false, message: 'Slot not found' })

  if (slot.isBooked) {
    return res.status(409).json({ success: false, message: 'This slot is already booked' })
  }
  if (slot.startTime <= new Date()) {
    return res.status(400).json({ success: false, message: 'Cannot book a slot that is in the past' })
  }
  if (slot.provider.toString() === patientId.toString()) {
    return res.status(400).json({ success: false, message: 'Providers cannot book their own slots' })
  }

  if (serviceId) {
    const service = await Service.findById(serviceId)
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' })
    if (service.provider.toString() !== slot.provider.toString()) {
      return res.status(400).json({ success: false, message: 'Service does not belong to this provider' })
    }
    if (!service.isActive) {
      return res.status(400).json({ success: false, message: 'This service is no longer available' })
    }
  }

  const existing = await Appointment.findOne({ slot: slotId, status: { $in: ['confirmed', 'pending'] } })
  if (existing) {
    return res.status(409).json({ success: false, message: 'This slot is already booked' })
  }

  const appointment = await Appointment.create({
    patient: patientId,
    provider: slot.provider,
    slot: slot._id,
    service: serviceId || null,
    startTime: slot.startTime,
    endTime: slot.endTime,
    status: 'confirmed',
    notes: notes || '',
  })

  slot.isBooked = true
  await slot.save({ validateBeforeSave: false })

  const populated = await populateFull(Appointment.findById(appointment._id))
  return res.status(201).json({ success: true, data: populated })
}

/* ─── getMyAppointments  GET /api/appointments/mine ──────────────────────── */
const getMyAppointments = async (req, res) => {
  const { status, from, to, page = 1, limit = 20 } = req.query
  const isProvider = req.user.role === 'provider'

  const filter = isProvider ? { provider: req.user._id } : { patient: req.user._id }

  // Support multi-status: "confirmed,pending" or single status or omitted (all)
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
  const appointments = await populateFull(
    Appointment.find(filter).sort({ startTime: isProvider ? 1 : -1 }).skip(skip).limit(Number(limit))
  )

  return res.status(200).json({ success: true, count: appointments.length, total, page: Number(page), pages: Math.ceil(total / Number(limit)), data: appointments })
}

/* ─── getAppointmentById  GET /api/appointments/:id ──────────────────────── */
const getAppointmentById = async (req, res) => {
  const appointment = await populateFull(Appointment.findById(req.params.id))
  if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' })

  const uid = req.user._id.toString()
  if (appointment.patient._id.toString() !== uid && appointment.provider._id.toString() !== uid) {
    return res.status(403).json({ success: false, message: 'You do not have access to this appointment' })
  }

  return res.status(200).json({ success: true, data: appointment })
}

/* ─── getAppointmentHistory  GET /api/appointments/:id/history ───────────── */
// Returns the full rescheduling chain containing this appointment
const getAppointmentHistory = async (req, res) => {
  const seed = await Appointment.findById(req.params.id)
  if (!seed) return res.status(404).json({ success: false, message: 'Appointment not found' })

  const uid = req.user._id.toString()
  if (seed.patient.toString() !== uid && seed.provider.toString() !== uid) {
    return res.status(403).json({ success: false, message: 'You do not have access to this appointment' })
  }

  // Walk backward to the original
  let root = seed
  const visited = new Set()
  while (root.rescheduledFrom && !visited.has(root._id.toString())) {
    visited.add(root._id.toString())
    const parent = await Appointment.findById(root.rescheduledFrom)
    if (!parent) break
    root = parent
  }

  // Walk forward from root, collecting the full chain
  const chain = []
  let current = root
  visited.clear()
  while (current && !visited.has(current._id.toString())) {
    visited.add(current._id.toString())
    const populated = await populateFull(Appointment.findById(current._id))
    chain.push(populated)
    if (!current.rescheduledTo) break
    current = await Appointment.findById(current.rescheduledTo)
  }

  return res.status(200).json({ success: true, count: chain.length, data: chain })
}

/* ─── getCancellationPolicy  GET /api/appointments/:id/cancel-policy ─────── */
// Returns whether this appointment is cancellable right now, and why if not
const getCancellationPolicy = async (req, res) => {
  const appointment = await Appointment.findById(req.params.id)
  if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' })

  const uid        = req.user._id.toString()
  const isPatient  = appointment.patient.toString() === uid
  const isProvider = appointment.provider.toString() === uid
  if (!isPatient && !isProvider) {
    return res.status(403).json({ success: false, message: 'You do not have access to this appointment' })
  }

  const now            = new Date()
  const deadline       = new Date(appointment.startTime.getTime() - 60 * 60 * 1000) // 1h before
  const msRemaining    = deadline.getTime() - now.getTime()
  const canCancel      = canTransition(appointment.status, 'cancelled') &&
                         (isProvider || msRemaining > 0)  // providers bypass the 1h rule
  const canReschedule  = canTransition(appointment.status, 'rescheduled') && msRemaining > 0

  return res.status(200).json({
    success: true,
    data: {
      canCancel,
      canReschedule,
      deadlineISO: deadline.toISOString(),
      msRemaining: Math.max(0, msRemaining),
      hoursRemaining: Math.max(0, Math.floor(msRemaining / (1000 * 60 * 60))),
      minutesRemaining: Math.max(0, Math.floor((msRemaining % (1000 * 60 * 60)) / (1000 * 60))),
      status: appointment.status,
      reason: !canTransition(appointment.status, 'cancelled')
        ? `Appointment is already ${appointment.status}`
        : !isProvider && msRemaining <= 0
          ? 'Cancellation window has passed (must cancel at least 1 hour before start)'
          : null,
    },
  })
}

/* ─── cancelAppointment  PATCH /api/appointments/:id/cancel ──────────────── */
const cancelAppointment = async (req, res) => {
  const { reason } = req.body
  const uid = req.user._id.toString()

  const appointment = await Appointment.findById(req.params.id)
  if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' })

  const isPatient  = appointment.patient.toString() === uid
  const isProvider = appointment.provider.toString() === uid
  if (!isPatient && !isProvider) {
    return res.status(403).json({ success: false, message: 'You do not have access to this appointment' })
  }

  if (!canTransition(appointment.status, 'cancelled')) {
    return res.status(409).json({ success: false, message: `Cannot cancel an appointment with status '${appointment.status}'` })
  }

  // 1-hour notice applies only to patients; providers can cancel at any time
  if (isPatient && !isProvider) {
    const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000)
    if (appointment.startTime <= oneHourFromNow) {
      return res.status(400).json({
        success: false,
        message: 'Appointments can only be cancelled at least 1 hour before the start time',
      })
    }
  }

  // Determine who is performing the action — provider takes precedence if they share the account
  appointment.status = 'cancelled'
  appointment.cancelledBy = isProvider ? 'provider' : 'patient'
  appointment.cancellationReason = reason || ''
  appointment.cancelledAt = new Date()
  await appointment.save({ validateBeforeSave: false })

  await Slot.findByIdAndUpdate(appointment.slot, { isBooked: false })

  const populated = await populateFull(Appointment.findById(appointment._id))
  return res.status(200).json({ success: true, data: populated })
}

/* ─── rescheduleAppointment  PATCH /api/appointments/:id/reschedule ──────── */
// Patient-initiated rescheduling: marks original as rescheduled, creates new appointment
const rescheduleAppointment = async (req, res) => {
  const { newSlotId, notes } = req.body
  const uid = req.user._id.toString()

  const original = await Appointment.findById(req.params.id)
  if (!original) return res.status(404).json({ success: false, message: 'Appointment not found' })

  if (original.patient.toString() !== uid) {
    return res.status(403).json({ success: false, message: 'Only the patient can reschedule this appointment' })
  }

  if (!canTransition(original.status, 'rescheduled')) {
    return res.status(409).json({ success: false, message: `Cannot reschedule an appointment with status '${original.status}'` })
  }

  const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000)
  if (original.startTime <= oneHourFromNow) {
    return res.status(400).json({ success: false, message: 'Appointments can only be rescheduled at least 1 hour before the start time' })
  }

  const newSlot = await Slot.findById(newSlotId)
  if (!newSlot) return res.status(404).json({ success: false, message: 'New slot not found' })
  if (newSlot.isBooked) return res.status(409).json({ success: false, message: 'The selected slot is already booked' })
  if (newSlot.startTime <= new Date()) return res.status(400).json({ success: false, message: 'The selected slot is in the past' })
  if (newSlot.provider.toString() !== original.provider.toString()) {
    return res.status(400).json({ success: false, message: 'New slot must be with the same provider' })
  }
  if (newSlot._id.toString() === original.slot.toString()) {
    return res.status(400).json({ success: false, message: 'New slot must be different from the current slot' })
  }

  const slotConflict = await Appointment.findOne({ slot: newSlotId, status: { $in: ['confirmed', 'pending'] } })
  if (slotConflict) return res.status(409).json({ success: false, message: 'The selected slot is already booked' })

  const newAppointment = await Appointment.create({
    patient: original.patient,
    provider: original.provider,
    slot: newSlot._id,
    service: original.service,
    startTime: newSlot.startTime,
    endTime: newSlot.endTime,
    status: 'confirmed',
    notes: notes !== undefined ? notes : (original.notes || ''),
    rescheduledFrom: original._id,
  })

  newSlot.isBooked = true
  await newSlot.save({ validateBeforeSave: false })

  original.status = 'rescheduled'
  original.rescheduledTo = newAppointment._id
  await original.save({ validateBeforeSave: false })
  await Slot.findByIdAndUpdate(original.slot, { isBooked: false })

  const populated = await populateFull(Appointment.findById(newAppointment._id))
  return res.status(200).json({ success: true, data: populated })
}

/* ─── providerRescheduleAppointment  PATCH /api/appointments/:id/provider-reschedule */
// Provider-initiated: cancel the original and create a new one on a new slot
// (providers don't "own" the booking — they propose a new time, patient slot changes automatically)
const providerRescheduleAppointment = async (req, res) => {
  const { newSlotId, reason } = req.body
  const uid = req.user._id.toString()

  const original = await Appointment.findById(req.params.id)
  if (!original) return res.status(404).json({ success: false, message: 'Appointment not found' })

  if (original.provider.toString() !== uid) {
    return res.status(403).json({ success: false, message: 'Only the provider can use this action' })
  }

  if (!canTransition(original.status, 'rescheduled')) {
    return res.status(409).json({ success: false, message: `Cannot reschedule an appointment with status '${original.status}'` })
  }

  const newSlot = await Slot.findById(newSlotId)
  if (!newSlot) return res.status(404).json({ success: false, message: 'New slot not found' })
  if (newSlot.isBooked) return res.status(409).json({ success: false, message: 'The selected slot is already booked' })
  if (newSlot.startTime <= new Date()) return res.status(400).json({ success: false, message: 'The selected slot is in the past' })
  if (newSlot.provider.toString() !== uid) {
    return res.status(400).json({ success: false, message: 'You can only move the appointment to one of your own slots' })
  }
  if (newSlot._id.toString() === original.slot.toString()) {
    return res.status(400).json({ success: false, message: 'New slot must be different from the current slot' })
  }

  const slotConflict = await Appointment.findOne({ slot: newSlotId, status: { $in: ['confirmed', 'pending'] } })
  if (slotConflict) return res.status(409).json({ success: false, message: 'The selected slot is already booked' })

  const newAppointment = await Appointment.create({
    patient: original.patient,
    provider: original.provider,
    slot: newSlot._id,
    service: original.service,
    startTime: newSlot.startTime,
    endTime: newSlot.endTime,
    status: 'confirmed',
    notes: original.notes || '',
    rescheduledFrom: original._id,
    cancelledBy: null,
    cancellationReason: reason || '',
  })

  newSlot.isBooked = true
  await newSlot.save({ validateBeforeSave: false })

  original.status = 'rescheduled'
  original.rescheduledTo = newAppointment._id
  original.cancellationReason = reason || ''
  await original.save({ validateBeforeSave: false })
  await Slot.findByIdAndUpdate(original.slot, { isBooked: false })

  const populated = await populateFull(Appointment.findById(newAppointment._id))
  return res.status(200).json({ success: true, data: populated })
}

/* ─── completeAppointment  PATCH /api/appointments/:id/complete ──────────── */
const completeAppointment = async (req, res) => {
  const appointment = await Appointment.findById(req.params.id)
  if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' })

  if (appointment.provider.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Only the provider can mark an appointment as completed' })
  }

  if (!canTransition(appointment.status, 'completed')) {
    return res.status(409).json({ success: false, message: `Cannot complete an appointment with status '${appointment.status}'` })
  }

  appointment.status = 'completed'
  await appointment.save({ validateBeforeSave: false })

  const populated = await populateFull(Appointment.findById(appointment._id))
  return res.status(200).json({ success: true, data: populated })
}

/* ─── getProviderAppointments  GET /api/appointments/provider ────────────── */
const getProviderAppointments = async (req, res) => {
  const { status, from, to, page = 1, limit = 20 } = req.query

  const filter = { provider: req.user._id }

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
  const appointments = await populateFull(
    Appointment.find(filter).sort({ startTime: 1 }).skip(skip).limit(Number(limit))
  )

  return res.status(200).json({ success: true, count: appointments.length, total, page: Number(page), pages: Math.ceil(total / Number(limit)), data: appointments })
}

/* ─── getCancellationStats  GET /api/appointments/stats ─────────────────── */
// Returns cancellation/reschedule counts for the authenticated user
const getAppointmentStats = async (req, res) => {
  const isProvider = req.user.role === 'provider'
  const matchField = isProvider ? 'provider' : 'patient'

  const counts = await Appointment.aggregate([
    { $match: { [matchField]: req.user._id } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ])

  const stats = { confirmed: 0, pending: 0, cancelled: 0, completed: 0, rescheduled: 0, total: 0 }
  counts.forEach(c => {
    if (stats[c._id] !== undefined) stats[c._id] = c.count
    stats.total += c.count
  })

  // Cancellation rate
  stats.cancellationRate = stats.total > 0
    ? Math.round((stats.cancelled / stats.total) * 100)
    : 0

  return res.status(200).json({ success: true, data: stats })
}

module.exports = {
  bookAppointment,
  getMyAppointments,
  getAppointmentById,
  getAppointmentHistory,
  getCancellationPolicy,
  cancelAppointment,
  rescheduleAppointment,
  providerRescheduleAppointment,
  completeAppointment,
  getProviderAppointments,
  getAppointmentStats,
}
