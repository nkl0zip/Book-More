require('dotenv').config()
const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const connectDB = require('./config/db')
const { notFound, errorHandler } = require('./middleware/errorMiddleware')
const authRoutes     = require('./routes/authRoutes')
const providerRoutes = require('./routes/providerRoutes')
const serviceRoutes  = require('./routes/serviceRoutes')

const app = express()

// Connect to MongoDB (skip in test environment)
if (process.env.NODE_ENV !== 'test') {
  connectDB()
}

app.use(cors())
app.use(express.json())

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
}

// Health check
app.get('/api/health', (_req, res) => {
  res.status(200).json({ success: true, status: 'ok', env: process.env.NODE_ENV })
})

// Routes
app.use('/api/auth',      authRoutes)
app.use('/api/providers', providerRoutes)
app.use('/api/services',  serviceRoutes)

// Error handling
app.use(notFound)
app.use(errorHandler)

module.exports = app
