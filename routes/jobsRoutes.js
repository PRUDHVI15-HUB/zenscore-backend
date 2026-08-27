const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/authMiddleware')
const {
  getJobs,
  getFeaturedJobs,
  getRecommendedJobs,
  getLatestJobs,
  getJobById,
  getReadinessScore,
  getJobStats
} = require('../controllers/jobsController')

const {
  saveJob,
  removeSavedJob,
  getSavedJobs,
  isJobSaved
} = require('../controllers/savedJobsController')

const {
  applyForJob,
  getApplicationStatus
} = require('../controllers/jobApplicationsController')

const { syncJobsFromProvider } = require('../services/jobs/sync/syncJobs')

// Public Job Listing read routes
router.get('/', getJobs)
router.get('/stats', getJobStats)
router.get('/featured', getFeaturedJobs)
router.get('/recommended', getRecommendedJobs)
router.get('/latest', getLatestJobs)

// Development Provider Architecture Test Endpoint (Must come before /:id)
router.get('/providers/:providerName/test', async (req, res) => {
  try {
    const { providerName } = req.params
    const syncResult = await syncJobsFromProvider(providerName, { persistToDb: false, ...req.query })
    return res.status(200).json({
      success: true,
      developmentNotice: 'Test endpoint for validating Provider Architecture. Data is not persisted to MongoDB.',
      syncResult
    })
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.name || 'ProviderError',
      message: err.message
    })
  }
})

// Development/Admin Live Ingestion Endpoint (Must come before /:id)
router.post('/providers/:providerName/sync', async (req, res) => {
  try {
    const { providerName } = req.params
    const syncResult = await syncJobsFromProvider(providerName, { persistToDb: true, ...req.body, ...req.query })
    return res.status(200).json({
      success: true,
      provider: providerName,
      totalFetched: syncResult.totalFetched,
      validJobs: syncResult.validJobs,
      inserted: syncResult.inserted,
      updated: syncResult.updated,
      duplicatesRemoved: syncResult.duplicatesRemoved,
      message: `Live job ingestion completed for provider '${providerName}'.`,
      syncResult
    })
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.name || 'ProviderError',
      message: err.message
    })
  }
})

// Compatibility sub-router aliases (Must come before /:id)
const jobAlertsRoutes = require('./jobAlertsRoutes')
const companiesRoutes = require('./companiesRoutes')
router.use('/alerts', jobAlertsRoutes)
router.use('/job-alerts', jobAlertsRoutes)
router.use('/companies', companiesRoutes)
router.use('/followed-companies', companiesRoutes)

// Saved Jobs Endpoints (Protected - MUST come before /:id)
router.get('/saved', protect, getSavedJobs)
router.get('/:jobId/is-saved', protect, isJobSaved)
router.post('/:jobId/save', protect, saveJob)
router.delete('/:jobId/save', protect, removeSavedJob)

// Job Application Endpoints (Protected)
router.post('/:jobId/apply', protect, applyForJob)
router.get('/:jobId/application-status', protect, getApplicationStatus)

// Protected readiness evaluation route (Must come before /:id)
router.post('/readiness-score', protect, getReadinessScore)

// Single Job By ID (Must be after all named GET/POST routes)
router.get('/:id', getJobById)

module.exports = router