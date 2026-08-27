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
const applicationsRoutes = require('./routes/applicationsRoutes')
const jobAlertsRoutes = require('./routes/jobAlertsRoutes')
const companiesRoutes = require('./routes/companiesRoutes')
const productivityRoutes = require('./routes/productivityRoutes')
const aiTutorRoute = require('./routes/aiTutorRoute')
const coursesRoutes = require('./routes/coursesRoutes')
const ocrRoutes = require('./routes/ocrRoutes')
const copilotRoutes = require('./routes/copilotRoutes')
const adminSkillsRoutes = require('./routes/adminSkillsRoutes')
const roadmapRoutes = require('./routes/roadmapRoutes')
const studentProfileRoutes = require('./routes/studentProfileRoutes')
const resumeRoutes = require('./routes/resumeRoutes')
const testRoutes = require('./routes/testRoutes')
const searchRoutes = require('./routes/searchRoutes')
const notificationRoutes = require('./routes/notificationRoutes')
const seedDatabase = require('./config/seed')

const app = express()

// Connect to MongoDB asynchronously without blocking server start
connectDB().then((conn) => {
  if (conn && require('mongoose').connection.readyState === 1) {
    try {
      seedDatabase()
      // Trigger automatic background sync for live Adzuna jobs
      const { syncJobsFromProvider } = require('./services/jobs/sync/syncJobs')
      syncJobsFromProvider('adzuna', { persistToDb: true }).catch(err => {
        console.warn('Background Adzuna live sync notice:', err?.message || err)
      })
    } catch (e) {
      console.warn('Seed database warning:', e?.message || e)
    }
  } else {
    console.warn('⚠️ Skipping seed database and job sync because MongoDB is not connected.')
  }
}).catch(err => console.warn('DB initialization error:', err?.message || err))

// Middleware
app.use(cors({ origin: true, credentials: true }))
app.use(express.json())
app.use(morgan('dev'))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/student/profile', studentProfileRoutes)
app.use('/api/academics', academicsRoutes)
app.use('/api/careers', careersRoutes)
app.use('/api/skills', skillsRoutes)
app.use('/api/admin/skills', adminSkillsRoutes)
app.use('/api/roadmaps', roadmapRoutes)
app.use('/api/jobs', jobsRoutes)
app.use('/api/applications', applicationsRoutes)
app.use('/api/job-alerts', jobAlertsRoutes)
app.use('/api/companies', companiesRoutes)
app.use('/api/productivity', productivityRoutes)
app.use('/api/ai-tutor', aiTutorRoute)
app.use('/api/courses', coursesRoutes)
app.use('/api/ocr', ocrRoutes)
app.use('/api/academics/copilot', copilotRoutes)
app.use('/api/resume', resumeRoutes)
app.use('/api/search', searchRoutes)
app.use('/api/notifications', notificationRoutes)
// TODO: Remove this route before production.
app.use('/api/test', testRoutes)

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
const server = app.listen(PORT, () => console.log(`🚀 ZenScore API running on port ${PORT}`))

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`\n⚠️ Port ${PORT} is already in use by an active ZenScore API instance. The backend is already live!`)
    process.exit(0)
  } else {
    console.error('Server startup error:', err)
  }
})