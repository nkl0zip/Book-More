const Slot = require('../models/Slot')

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Check whether [start, end) overlaps any existing slot for this provider,
 * excluding the slot with `excludeId` (used when updating a slot).
 */
const hasOverlap = async (providerId, start, end, excludeId = null) => {
  const query = {
    provider: providerId,
    // Overlap condition: existing.startTime < end  AND  existing.endTime > start
    startTime: { $lt: end },
    endTime:   { $gt: start },
  }
  if (excludeId) {
    query._id = { $ne: excludeId }
  }
  const count = await Slot.countDocuments(query)
  return count > 0
}

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * GET /api/slots?providerId=&from=&to=&available=
 * Public — list a provider's slots with optional date range and availability filter.
 */
const getSlotsByProvider = async (req, res) => {
  const { providerId, from, to, available } = req.query
  if (!providerId) {
    return res.status(400).json({ success: false, message: 'providerId query param is required' })
  }

  const filter = { provider: providerId }

  if (from || to) {
    filter.startTime = {}
    if (from) filter.startTime.$gte = new Date(from)
    if (to)   filter.startTime.$lte = new Date(to)
  }

  if (available === 'true')  filter.isBooked = false
  if (available === 'false') filter.isBooked = true

  const slots = await Slot.find(filter)
    .populate('service', 'name durationMinutes price currency')
    .sort({ startTime: 1 })

  res.json({ success: true, count: slots.length, data: slots })
}

/**
 * GET /api/slots/mine
 * Authenticated provider — all own slots (including past and booked).
 */
const getMySlots = async (req, res) => {
  const { from, to, available } = req.query
  const filter = { provider: req.user._id }

  if (from || to) {
    filter.startTime = {}
    if (from) filter.startTime.$gte = new Date(from)
    if (to)   filter.startTime.$lte = new Date(to)
  }

  if (available === 'true')  filter.isBooked = false
  if (available === 'false') filter.isBooked = true

  const slots = await Slot.find(filter)
    .populate('service', 'name durationMinutes price currency')
    .sort({ startTime: 1 })

  res.json({ success: true, count: slots.length, data: slots })
}

/**
 * GET /api/slots/:id
 * Public — single slot.
 */
const getSlotById = async (req, res) => {
  const slot = await Slot.findById(req.params.id)
    .populate('provider', 'name specialisation')
    .populate('service', 'name durationMinutes price currency')

  if (!slot) {
    return res.status(404).json({ success: false, message: 'Slot not found' })
  }
  res.json({ success: true, data: slot })
}

/**
 * POST /api/slots
 * Authenticated provider — create a new slot.
 * Business rules enforced:
 *   1. startTime must be in the future (pre-save hook)
 *   2. endTime must be > startTime (pre-save hook)
 *   3. No overlap with existing provider slots
 */
const createSlot = async (req, res) => {
  const { startTime, endTime, service, notes } = req.body
  const start = new Date(startTime)
  const end   = new Date(endTime)

  // Business rule: overlap check (in-app, before hitting the DB pre-save hooks)
  const overlap = await hasOverlap(req.user._id, start, end)
  if (overlap) {
    return res.status(409).json({
      success: false,
      message: 'This time slot overlaps with one of your existing slots',
    })
  }

  const slot = await Slot.create({
    provider:  req.user._id,
    startTime: start,
    endTime:   end,
    service:   service || null,
    notes:     notes   || '',
  })

  const populated = await slot.populate('service', 'name durationMinutes price currency')
  res.status(201).json({ success: true, data: populated })
}

/**
 * PATCH /api/slots/:id
 * Authenticated provider — update own slot (time, service, notes).
 * Cannot update a booked slot's times.
 */
const updateSlot = async (req, res) => {
  const slot = await Slot.findById(req.params.id)
  if (!slot) {
    return res.status(404).json({ success: false, message: 'Slot not found' })
  }
  if (slot.provider.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorised to update this slot' })
  }

  const { startTime, endTime, service, notes } = req.body

  // If rescheduling a booked slot — block time changes
  if (slot.isBooked && (startTime || endTime)) {
    return res.status(409).json({
      success: false,
      message: 'Cannot change the time of an already-booked slot',
    })
  }

  const newStart = startTime ? new Date(startTime) : slot.startTime
  const newEnd   = endTime   ? new Date(endTime)   : slot.endTime

  // Overlap check (exclude self)
  if (startTime || endTime) {
    const overlap = await hasOverlap(req.user._id, newStart, newEnd, slot._id)
    if (overlap) {
      return res.status(409).json({
        success: false,
        message: 'Updated time overlaps with one of your existing slots',
      })
    }
  }

  if (startTime !== undefined) slot.startTime = newStart
  if (endTime   !== undefined) slot.endTime   = newEnd
  if (service   !== undefined) slot.service   = service || null
  if (notes     !== undefined) slot.notes     = notes

  await slot.save()
  const populated = await slot.populate('service', 'name durationMinutes price currency')
  res.json({ success: true, data: populated })
}

/**
 * DELETE /api/slots/:id
 * Authenticated provider — hard delete an unbooked slot.
 * Booked slots cannot be deleted (would break appointment records).
 */
const deleteSlot = async (req, res) => {
  const slot = await Slot.findById(req.params.id)
  if (!slot) {
    return res.status(404).json({ success: false, message: 'Slot not found' })
  }
  if (slot.provider.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorised to delete this slot' })
  }
  if (slot.isBooked) {
    return res.status(409).json({
      success: false,
      message: 'Cannot delete a booked slot — cancel the appointment first',
    })
  }
  await slot.deleteOne()
  res.json({ success: true, message: 'Slot deleted successfully' })
}

/**
 * DELETE /api/slots/bulk
 * Authenticated provider — delete multiple unbooked future slots at once.
 * Body: { ids: [id1, id2, ...] }
 */
const bulkDeleteSlots = async (req, res) => {
  const { ids } = req.body
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ success: false, message: 'ids array is required' })
  }

  // Only delete slots that: belong to this provider, are not booked
  const result = await Slot.deleteMany({
    _id:      { $in: ids },
    provider: req.user._id,
    isBooked: false,
  })

  res.json({
    success: true,
    message: `${result.deletedCount} slot(s) deleted`,
    deletedCount: result.deletedCount,
  })
}

module.exports = {
  getSlotsByProvider,
  getMySlots,
  getSlotById,
  createSlot,
  updateSlot,
  deleteSlot,
  bulkDeleteSlots,
}
