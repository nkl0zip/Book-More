const express = require('express')
const { getDashboard } = require('../controllers/dashboardController')
const { protect, authorise } = require('../middleware/authMiddleware')

const router = express.Router()

router.get('/provider', protect, authorise('provider'), getDashboard)

module.exports = router
