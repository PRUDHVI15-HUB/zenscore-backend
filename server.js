require('dotenv').config()
const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const connectDB = require('./config/db')

const authRoutes = require('./routes/authRoutes')
const academicsRoutes = require('./routes/academicsRoutes')
const careersRoutes = require('./routes/careersRoutes')
const skillsRoutes = require('./routes/skillsRoutes')
const jobsRoutes = require('./routes/jobsRoutes')
const productivityRoutes = require('./routes/productivityRoutes')
const aiTutorRoute = require('./routes/aiTutorRoute')
const coursesRoutes = require('./routes/coursesRoutes')
const ocrRoutes = require('./routes/ocrRoutes')
const copilotRoutes = require('./routes/copilotRoutes')
const seedDatabase = require('./config/seed')

const app = express()

// Connect to MongoDB
connectDB().then(() => {
  seedDatabase()
})

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }))
app.use(express.json())
app.use(morgan('dev'))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/academics', academicsRoutes)
app.use('/api/careers', careersRoutes)
app.use('/api/skills', skillsRoutes)
app.use('/api/jobs', jobsRoutes)
app.use('/api/productivity', productivityRoutes)
app.use('/api/ai-tutor', aiTutorRoute)
app.use('/api/courses', coursesRoutes)
app.use('/api/ocr', ocrRoutes)
app.use('/api/academics/copilot', copilotRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ZenScore API is running', timestamp: new Date().toISOString() })
})

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`🚀 ZenScore API running on port ${PORT}`))