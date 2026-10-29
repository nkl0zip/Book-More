const express = require('express')
const {
  getSlotsByProvider,
  getMySlots,
  getSlotById,
  createSlot,
  updateSlot,
  deleteSlot,
  bulkDeleteSlots,
} = require('../controllers/slotController')
const { protect, authorise } = require('../middleware/authMiddleware')
const { validate, schemas } = require('../middleware/validateMiddleware')

const router = express.Router()

// Static paths MUST come before parameterised /:id routes

// Provider-only — static paths first
router.get('/mine/list',   protect, authorise('provider'), getMySlots)
router.delete('/bulk',     protect, authorise('provider'), bulkDeleteSlots)

// Public — list by provider
router.get('/', getSlotsByProvider)   // ?providerId=&from=&to=&available=

// Write routes (provider only)
router.post('/',     protect, authorise('provider'), validate(schemas.createSlot), createSlot)

// Parameterised routes last
router.get('/:id',    getSlotById)
router.patch('/:id',  protect, authorise('provider'), validate(schemas.updateSlot), updateSlot)
router.delete('/:id', protect, authorise('provider'), deleteSlot)

module.exports = router
