const Appointment = require('../models/Appointment')
const Slot = require('../models/Slot')
const Service = require('../models/Service')

/* ─── helpers ─────────────────────────────────────────────────────────────── */

/** Allowed status transitions for the state machine */
const TRANSITIONS = {
  confirmed:   ['cancelled', 'completed', 'rescheduled'],
  pending:     ['confirmed', 'cancelled'],
  rescheduled: ['cancelled'],
  cancelled:   [],
  completed:   [],
}

const canTransition = (from, to) => TRANSITIONS[from]?.includes(to) ?? false

/* ─── bookAppointment  POST /api/appointments ────────────────────────────── */
const bookAppointment = async (req, res) => {
  const { slotId, serviceId, notes } = req.body
  const patientId = req.user._id

  // 1. Load the slot
  const slot = await Slot.findById(slotId)
  if (!slot) return res.status(404).json({ success: false, message: 'Slot not found' })

  // 2. Slot must be available
  if (slot.isBooked) {
    return res.status(409).json({ success: false, message: 'This slot is already booked' })
  }

  // 3. Slot must be in the future
  if (slot.startTime <= new Date()) {
    return res.status(400).json({ success: false, message: 'Cannot book a slot that is in the past' })
  }

  // 4. Patient cannot book their own provider slot (if they happen to be a provider too — edge case)
  if (slot.provider.toString() === patientId.toString()) {
    return res.status(400).json({ success: false, message: 'Providers cannot book their own slots' })
  }

  // 5. Validate optional service — must belong to the same provider
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

  // 6. Double-booking guard — idempotency: check no live appointment exists for this slot
  const existing = await Appointment.findOne({
    slot: slotId,
    status: { $in: ['confirmed', 'pending'] },
  })
  if (existing) {
    return res.status(409).json({ success: false, message: 'This slot is already booked' })
  }

  // 7. Create appointment
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

  // 8. Mark slot as booked (atomic-ish — best effort; real systems use transactions)
  slot.isBooked = true
  await slot.save({ validateBeforeSave: false })

  const populated = await Appointment.findById(appointment._id)
    .populate('provider', 'name specialisation avatarUrl')
    .populate('patient', 'name email')
    .populate('slot', 'startTime endTime')
    .populate('service', 'name durationMinutes price currency')

  return res.status(201).json({ success: true, data: populated })
}

/* ─── getMyAppointments  GET /api/appointments/mine ─────────────────────── */
const getMyAppointments = async (req, res) => {
  const { status, from, to, page = 1, limit = 20 } = req.query
  const isProvider = req.user.role === 'provider'

  const filter = isProvider
    ? { provider: req.user._id }
    : { patient: req.user._id }

  if (status) filter.status = status
  if (from || to) {
    filter.startTime = {}
    if (from) filter.startTime.$gte = new Date(from)
    if (to)   filter.startTime.$lte = new Date(to)
  }

  const skip  = (Number(page) - 1) * Number(limit)
  const total = await Appointment.countDocuments(filter)

  const appointments = await Appointment.find(filter)
    .sort({ startTime: isProvider ? 1 : -1 })
    .skip(skip)
    .limit(Number(limit))
    .populate('provider', 'name specialisation avatarUrl')
    .populate('patient', 'name email phone')
    .populate('slot', 'startTime endTime')
    .populate('service', 'name durationMinutes price currency')

  return res.status(200).json({
    success: true,
    count: appointments.length,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
    data: appointments,
  })
}

/* ─── getAppointmentById  GET /api/appointments/:id ─────────────────────── */
const getAppointmentById = async (req, res) => {
  const appointment = await Appointment.findById(req.params.id)
    .populate('provider', 'name specialisation avatarUrl phone')
    .populate('patient', 'name email phone')
    .populate('slot', 'startTime endTime notes')
    .populate('service', 'name durationMinutes price currency description')

  if (!appointment) {
    return res.status(404).json({ success: false, message: 'Appointment not found' })
  }

  // Access: only patient or provider of the appointment
  const uid = req.user._id.toString()
  if (
    appointment.patient._id.toString() !== uid &&
    appointment.provider._id.toString() !== uid
  ) {
    return res.status(403).json({ success: false, message: 'You do not have access to this appointment' })
  }

  return res.status(200).json({ success: true, data: appointment })
}

/* ─── cancelAppointment  PATCH /api/appointments/:id/cancel ─────────────── */
const cancelAppointment = async (req, res) => {
  const { reason } = req.body
  const uid = req.user._id.toString()

  const appointment = await Appointment.findById(req.params.id)
  if (!appointment) {
    return res.status(404).json({ success: false, message: 'Appointment not found' })
  }

  // Access check — patient or provider
  const isPatient  = appointment.patient.toString() === uid
  const isProvider = appointment.provider.toString() === uid
  if (!isPatient && !isProvider) {
    return res.status(403).json({ success: false, message: 'You do not have access to this appointment' })
  }

  // State machine check
  if (!canTransition(appointment.status, 'cancelled')) {
    return res.status(409).json({
      success: false,
      message: `Cannot cancel an appointment with status '${appointment.status}'`,
    })
  }

  // Must be at least 1 hour in the future (patients); providers have no restriction
  if (isPatient && !isProvider) {
    const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000)
    if (appointment.startTime <= oneHourFromNow) {
      return res.status(400).json({
        success: false,
        message: 'Appointments can only be cancelled at least 1 hour before the start time',
      })
    }
  }

  appointment.status = 'cancelled'
  appointment.cancelledBy = isPatient ? 'patient' : 'provider'
  appointment.cancellationReason = reason || ''
  appointment.cancelledAt = new Date()
  await appointment.save({ validateBeforeSave: false })

  // Free up the slot
  await Slot.findByIdAndUpdate(appointment.slot, { isBooked: false })

  const populated = await Appointment.findById(appointment._id)
    .populate('provider', 'name specialisation avatarUrl')
    .populate('patient', 'name email')
    .populate('slot', 'startTime endTime')
    .populate('service', 'name durationMinutes price currency')

  return res.status(200).json({ success: true, data: populated })
}

/* ─── rescheduleAppointment  PATCH /api/appointments/:id/reschedule ──────── */
const rescheduleAppointment = async (req, res) => {
  const { newSlotId, notes } = req.body
  const uid = req.user._id.toString()

  const original = await Appointment.findById(req.params.id)
  if (!original) {
    return res.status(404).json({ success: false, message: 'Appointment not found' })
  }

  // Access — only the patient can reschedule (providers should cancel + patient re-books)
  if (original.patient.toString() !== uid) {
    return res.status(403).json({ success: false, message: 'Only the patient can reschedule this appointment' })
  }

  // State machine
  if (!canTransition(original.status, 'rescheduled')) {
    return res.status(409).json({
      success: false,
      message: `Cannot reschedule an appointment with status '${original.status}'`,
    })
  }

  // Must be at least 1 hour in the future
  const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000)
  if (original.startTime <= oneHourFromNow) {
    return res.status(400).json({
      success: false,
      message: 'Appointments can only be rescheduled at least 1 hour before the start time',
    })
  }

  // New slot
  const newSlot = await Slot.findById(newSlotId)
  if (!newSlot) return res.status(404).json({ success: false, message: 'New slot not found' })

  if (newSlot.isBooked) {
    return res.status(409).json({ success: false, message: 'The selected slot is already booked' })
  }
  if (newSlot.startTime <= new Date()) {
    return res.status(400).json({ success: false, message: 'The selected slot is in the past' })
  }
  if (newSlot.provider.toString() !== original.provider.toString()) {
    return res.status(400).json({ success: false, message: 'New slot must be with the same provider' })
  }

  // Double-booking guard on new slot
  const slotConflict = await Appointment.findOne({
    slot: newSlotId,
    status: { $in: ['confirmed', 'pending'] },
  })
  if (slotConflict) {
    return res.status(409).json({ success: false, message: 'The selected slot is already booked' })
  }

  // Create the new appointment
  const newAppointment = await Appointment.create({
    patient: original.patient,
    provider: original.provider,
    slot: newSlot._id,
    service: original.service,
    startTime: newSlot.startTime,
    endTime: newSlot.endTime,
    status: 'confirmed',
    notes: notes || original.notes || '',
    rescheduledFrom: original._id,
  })

  // Mark new slot as booked
  newSlot.isBooked = true
  await newSlot.save({ validateBeforeSave: false })

  // Mark original appointment as rescheduled and free its slot
  original.status = 'rescheduled'
  original.rescheduledTo = newAppointment._id
  await original.save({ validateBeforeSave: false })
  await Slot.findByIdAndUpdate(original.slot, { isBooked: false })

  const populated = await Appointment.findById(newAppointment._id)
    .populate('provider', 'name specialisation avatarUrl')
    .populate('patient', 'name email')
    .populate('slot', 'startTime endTime')
    .populate('service', 'name durationMinutes price currency')

  return res.status(200).json({ success: true, data: populated })
}

/* ─── completeAppointment  PATCH /api/appointments/:id/complete ──────────── */
const completeAppointment = async (req, res) => {
  const appointment = await Appointment.findById(req.params.id)
  if (!appointment) {
    return res.status(404).json({ success: false, message: 'Appointment not found' })
  }

  // Only the provider can mark as completed
  if (appointment.provider.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Only the provider can mark an appointment as completed' })
  }

  if (!canTransition(appointment.status, 'completed')) {
    return res.status(409).json({
      success: false,
      message: `Cannot complete an appointment with status '${appointment.status}'`,
    })
  }

  appointment.status = 'completed'
  await appointment.save({ validateBeforeSave: false })

  const populated = await Appointment.findById(appointment._id)
    .populate('provider', 'name specialisation avatarUrl')
    .populate('patient', 'name email')
    .populate('slot', 'startTime endTime')
    .populate('service', 'name durationMinutes price currency')

  return res.status(200).json({ success: true, data: populated })
}

/* ─── getProviderAppointments  GET /api/appointments/provider ───────────── */
const getProviderAppointments = async (req, res) => {
  const { status, from, to, page = 1, limit = 20 } = req.query

  const filter = { provider: req.user._id }
  if (status) filter.status = status
  if (from || to) {
    filter.startTime = {}
    if (from) filter.startTime.$gte = new Date(from)
    if (to)   filter.startTime.$lte = new Date(to)
  }

  const skip  = (Number(page) - 1) * Number(limit)
  const total = await Appointment.countDocuments(filter)

  const appointments = await Appointment.find(filter)
    .sort({ startTime: 1 })
    .skip(skip)
    .limit(Number(limit))
    .populate('patient', 'name email phone')
    .populate('slot', 'startTime endTime')
    .populate('service', 'name durationMinutes price currency')

  return res.status(200).json({
    success: true,
    count: appointments.length,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
    data: appointments,
  })
}

module.exports = {
  bookAppointment,
  getMyAppointments,
  getAppointmentById,
  cancelAppointment,
  rescheduleAppointment,
  completeAppointment,
  getProviderAppointments,
}
