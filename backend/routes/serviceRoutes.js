const express = require('express')
const {
  getServicesByProvider,
  getMyServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
} = require('../controllers/serviceController')
const { protect, authorise } = require('../middleware/authMiddleware')
const { validate, schemas } = require('../middleware/validateMiddleware')

const router = express.Router()

// Static paths before parameterised /:id
router.get('/mine/list', protect, authorise('provider'), getMyServices)

// Public routes
router.get('/',     getServicesByProvider)   // ?providerId=
router.get('/:id',  getServiceById)

// Provider-only routes
router.post('/',         protect, authorise('provider'), validate(schemas.createService), createService)
router.patch('/:id',     protect, authorise('provider'), validate(schemas.updateService), updateService)
router.delete('/:id',    protect, authorise('provider'), deleteService)

module.exports = router
