const express = require('express')
const { register, login, getMe, updateMe } = require('../controllers/authController')
const { protect } = require('../middleware/authMiddleware')
const { validate, schemas } = require('../middleware/validateMiddleware')

const router = express.Router()

router.post('/register', validate(schemas.register), register)
router.post('/login', validate(schemas.login), login)
router.get('/me', protect, getMe)
router.patch('/me', protect, validate(schemas.updateProfile), updateMe)

module.exports = router
