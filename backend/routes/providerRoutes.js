const express = require('express')
const {
  getAllProviders,
  getProviderById,
  getMyProfile,
  updateMyProfile,
  deactivateAccount,
} = require('../controllers/providerController')
const { protect, authorise } = require('../middleware/authMiddleware')
const { validate, schemas } = require('../middleware/validateMiddleware')

const router = express.Router()

// Public routes
router.get('/', getAllProviders)
router.get('/:id', getProviderById)

// Provider-only routes
router.get('/me/profile', protect, authorise('provider'), getMyProfile)
router.patch('/me/profile', protect, authorise('provider'), validate(schemas.updateProviderProfile), updateMyProfile)
router.patch('/me/deactivate', protect, authorise('provider'), deactivateAccount)

module.exports = router
