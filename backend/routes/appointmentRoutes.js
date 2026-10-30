const express = require('express')
const {
  bookAppointment,
  getMyAppointments,
  getAppointmentById,
  cancelAppointment,
  rescheduleAppointment,
  completeAppointment,
  getProviderAppointments,
} = require('../controllers/appointmentController')
const { protect, authorise } = require('../middleware/authMiddleware')
const { validate, schemas } = require('../middleware/validateMiddleware')

const router = express.Router()

// All appointment routes require authentication
router.use(protect)

// Static paths before parameterised /:id
router.get('/mine',     getMyAppointments)
router.get('/provider', authorise('provider'), getProviderAppointments)

// Core booking
router.post('/', authorise('patient'), validate(schemas.bookAppointment), bookAppointment)

// Parameterised routes last
router.get('/:id',                    getAppointmentById)
router.patch('/:id/cancel',           validate(schemas.cancelAppointment), cancelAppointment)
router.patch('/:id/reschedule',       authorise('patient'), validate(schemas.rescheduleAppointment), rescheduleAppointment)
router.patch('/:id/complete',         authorise('provider'), completeAppointment)

module.exports = router
