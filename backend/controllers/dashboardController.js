/* ─────────────────────────────────────────────────────────────────────────
 * dashboardController.js
 *
 * GET /api/dashboard/provider  — single endpoint that returns everything the
 * Provider Dashboard page needs in one round-trip:
 *
 *  • stats          — today, this week, total, cancellation rate
 *  • upcomingAppts  — next 5 confirmed appointments (populated)
 *  • weekSchedule   — 7-day strip starting today (slots + bookings per day)
 *  • recentPatients — last 5 unique patients
 *  • serviceBreakdown — appointment counts per service (last 30 days)
 *  • slotSummary    — total open / booked slots (next 30 days)
 * ─────────────────────────────────────────────────────────────────────────*/
const mongoose = require('mongoose')
const Appointment = require('../models/Appointment')
const Slot = require('../models/Slot')
const Service = require('../models/Service')

/* ── date helpers ──────────────────────────────────────────────────────── */
const startOfDay = (d) => {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}
const endOfDay = (d) => {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x
}
const addDays = (d, n) => new Date(d.getTime() + n * 86400000)

/* ── getDashboard  GET /api/dashboard/provider ─────────────────────────── */
const getDashboard = async (req, res) => {
  const providerId = req.user._id
  const providerOid = new mongoose.Types.ObjectId(providerId)

  const now    = new Date()
  const today0 = startOfDay(now)
  const today1 = endOfDay(now)

  // Week: today through today+6
  const week0  = today0
  const week1  = endOfDay(addDays(today0, 6))

  // Month window for stats
  const month0 = new Date(now.getTime() - 30 * 86400000)

  /* ── 1. Stats aggregation ─────────────────────────────────────────────── */
  const [statusCounts, todayCount, weekCount] = await Promise.all([
    // All-time per-status breakdown
    Appointment.aggregate([
      { $match: { provider: providerOid } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    // Today's confirmed/pending appointments
    Appointment.countDocuments({
      provider: providerId,
      startTime: { $gte: today0, $lte: today1 },
      status: { $in: ['confirmed', 'pending'] },
    }),
    // This-week confirmed/pending appointments
    Appointment.countDocuments({
      provider: providerId,
      startTime: { $gte: week0, $lte: week1 },
      status: { $in: ['confirmed', 'pending'] },
    }),
  ])

  const statMap = { confirmed: 0, pending: 0, cancelled: 0, completed: 0, rescheduled: 0 }
  let total = 0
  statusCounts.forEach(c => {
    if (statMap[c._id] !== undefined) statMap[c._id] = c.count
    total += c.count
  })
  const cancellationRate = total > 0 ? Math.round((statMap.cancelled / total) * 100 * 10) / 10 : 0

  /* ── 2. Upcoming appointments (next 5) ────────────────────────────────── */
  const upcomingAppts = await Appointment
    .find({ provider: providerId, status: { $in: ['confirmed', 'pending'] }, startTime: { $gte: now } })
    .sort({ startTime: 1 })
    .limit(5)
    .populate('patient', 'name email phone')
    .populate('service', 'name durationMinutes price')

  /* ── 3. Weekly schedule strip ─────────────────────────────────────────── */
  // All slots + appointments for the 7-day window
  const [weekSlots, weekAppts] = await Promise.all([
    Slot.find({ provider: providerId, startTime: { $gte: week0, $lte: week1 } })
      .sort({ startTime: 1 })
      .populate('service', 'name'),
    Appointment.find({
      provider: providerId,
      startTime: { $gte: week0, $lte: week1 },
      status: { $in: ['confirmed', 'pending'] },
    })
      .sort({ startTime: 1 })
      .populate('patient', 'name')
      .populate('service', 'name'),
  ])

  // Build 7-day array
  const weekSchedule = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(today0, i)
    const d0   = startOfDay(date)
    const d1   = endOfDay(date)
    const daySlots = weekSlots.filter(s => s.startTime >= d0 && s.startTime <= d1)
    const dayAppts = weekAppts.filter(a => a.startTime >= d0 && a.startTime <= d1)
    return {
      date: date.toISOString(),
      dayLabel: date.toLocaleDateString('en-GB', { weekday: 'short' }),
      dateNum: date.getDate(),
      isToday: i === 0,
      slotCount: daySlots.length,
      bookedCount: daySlots.filter(s => s.isBooked).length,
      availableCount: daySlots.filter(s => !s.isBooked).length,
      appointments: dayAppts.map(a => ({
        _id: a._id,
        startTime: a.startTime,
        endTime: a.endTime,
        status: a.status,
        patient: a.patient,
        service: a.service,
      })),
    }
  })

  /* ── 4. Recent unique patients (last 5) ──────────────────────────────── */
  const recentPatientDocs = await Appointment.aggregate([
    { $match: { provider: providerOid, status: { $in: ['confirmed', 'completed', 'pending'] } } },
    { $sort: { startTime: -1 } },
    { $group: { _id: '$patient', lastAppt: { $first: '$startTime' }, apptId: { $first: '$_id' } } },
    { $limit: 5 },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'patientInfo',
      },
    },
    { $unwind: '$patientInfo' },
    {
      $project: {
        _id: 0,
        patientId: '$_id',
        name: '$patientInfo.name',
        email: '$patientInfo.email',
        lastAppt: 1,
      },
    },
  ])

  /* ── 5. Service breakdown (last 30 days) ──────────────────────────────── */
  const serviceBreakdown = await Appointment.aggregate([
    {
      $match: {
        provider: providerOid,
        startTime: { $gte: month0 },
        service: { $ne: null },
      },
    },
    { $group: { _id: '$service', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 6 },
    {
      $lookup: {
        from: 'services',
        localField: '_id',
        foreignField: '_id',
        as: 'serviceInfo',
      },
    },
    { $unwind: { path: '$serviceInfo', preserveNullAndEmpty: true } },
    {
      $project: {
        _id: 0,
        serviceId: '$_id',
        name: { $ifNull: ['$serviceInfo.name', 'Unknown service'] },
        count: 1,
        price: { $ifNull: ['$serviceInfo.price', 0] },
      },
    },
  ])

  /* ── 6. Slot summary (next 30 days) ───────────────────────────────────── */
  const next30End = new Date(now.getTime() + 30 * 86400000)
  const [openSlots, bookedSlots] = await Promise.all([
    Slot.countDocuments({ provider: providerId, startTime: { $gte: now, $lte: next30End }, isBooked: false }),
    Slot.countDocuments({ provider: providerId, startTime: { $gte: now, $lte: next30End }, isBooked: true  }),
  ])

  return res.status(200).json({
    success: true,
    data: {
      stats: {
        today: todayCount,
        thisWeek: weekCount,
        total,
        completed: statMap.completed,
        cancelled: statMap.cancelled,
        cancellationRate,
      },
      upcomingAppts,
      weekSchedule,
      recentPatients: recentPatientDocs,
      serviceBreakdown,
      slotSummary: { open: openSlots, booked: bookedSlots, total: openSlots + bookedSlots },
    },
  })
}

module.exports = { getDashboard }
