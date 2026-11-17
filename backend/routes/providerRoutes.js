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

// Static paths before parameterised /:id
router.get('/me/profile',    protect, authorise('provider'), getMyProfile)
router.patch('/me/profile',  protect, authorise('provider'), validate(schemas.updateProviderProfile), updateMyProfile)
router.patch('/me/deactivate', protect, authorise('provider'), deactivateAccount)

// Public routes
router.get('/', getAllProviders)
router.get('/:id', getProviderById)

module.exports = router
