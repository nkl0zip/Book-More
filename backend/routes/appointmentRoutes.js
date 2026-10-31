const express = require('express')
const {
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
} = require('../controllers/appointmentController')
const { protect, authorise } = require('../middleware/authMiddleware')
const { validate, schemas } = require('../middleware/validateMiddleware')

const router = express.Router()

// All appointment routes require authentication
router.use(protect)

// ── Static collection routes (must come before /:id) ──────────────────────
router.get('/mine',     getMyAppointments)
router.get('/provider', authorise('provider'), getProviderAppointments)
router.get('/stats',    getAppointmentStats)

// ── Core booking ──────────────────────────────────────────────────────────
router.post('/', authorise('patient'), validate(schemas.bookAppointment), bookAppointment)

// ── Parameterised routes (always after static paths) ──────────────────────
router.get('/:id',               getAppointmentById)
router.get('/:id/history',       getAppointmentHistory)
router.get('/:id/cancel-policy', getCancellationPolicy)

router.patch('/:id/cancel',
  validate(schemas.cancelAppointment),
  cancelAppointment)

router.patch('/:id/reschedule',
  authorise('patient'),
  validate(schemas.rescheduleAppointment),
  rescheduleAppointment)

router.patch('/:id/provider-reschedule',
  authorise('provider'),
  validate(schemas.providerRescheduleAppointment),
  providerRescheduleAppointment)

router.patch('/:id/complete',
  authorise('provider'),
  completeAppointment)

module.exports = router
