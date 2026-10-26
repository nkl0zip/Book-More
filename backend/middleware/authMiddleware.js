const jwt = require('jsonwebtoken')
const User = require('../models/User')

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  })
}

// Protect routes — verify JWT and attach user to req
const protect = async (req, res, next) => {
  let token
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1]
  }
  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorised — no token' })
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = await User.findById(decoded.id)
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User belonging to this token no longer exists' })
    }
    next()
  } catch {
    return res.status(401).json({ success: false, message: 'Not authorised — invalid token' })
  }
}

// Restrict route to specific roles
const authorise = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not permitted to access this route`,
      })
    }
    next()
  }
}

module.exports = { protect, authorise, generateToken }
