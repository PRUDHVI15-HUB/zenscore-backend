const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/authMiddleware')
const {
  getMyApplications,
  getMyApplicationStats,
  getApplicationAnalytics,
  getApplicationById,
  updateApplicationStatus
} = require('../controllers/jobApplicationsController')

router.use(protect)

// GET /api/applications/me/stats (Dashboard statistics)
router.get('/me/stats', getMyApplicationStats)

// GET /api/applications/me/analytics (Full application & placement analytics)
router.get('/me/analytics', getApplicationAnalytics)

// GET /api/applications/me (Paginated applications list with search & filter)
router.get('/me', getMyApplications)

// GET /api/applications/:id (Complete application details + timeline)
router.get('/:id', getApplicationById)

// PATCH /api/applications/:id/status (Update recruitment status & append to timeline)
router.patch('/:id/status', updateApplicationStatus)

module.exports = router
