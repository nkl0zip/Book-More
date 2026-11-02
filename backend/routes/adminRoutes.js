const express = require('express')
const {
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
} = require('../controllers/adminController')
const { protect, authorise } = require('../middleware/authMiddleware')

const router = express.Router()

// Bootstrap — no auth required (gated by ADMIN_SECRET in body)
router.post('/create', createAdmin)

// All routes below require admin authentication
router.use(protect, authorise('admin'))

// Platform stats
router.get('/stats', getStats)

// Users
router.get('/users',     getUsers)
router.get('/users/:id', getUserById)
router.patch('/users/:id', updateUser)
router.delete('/users/:id', deleteUser)

// Appointments
router.get('/appointments',     getAppointments)
router.delete('/appointments/:id', deleteAppointment)

// Slots
router.get('/slots',     getSlots)
router.delete('/slots/:id', deleteSlot)

// Services
router.get('/services',      getServices)
router.patch('/services/:id',  updateService)
router.delete('/services/:id', deleteService)

module.exports = router
