const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/authMiddleware')
const {
  createJobAlert,
  getJobAlerts,
  updateJobAlert,
  deleteJobAlert,
  toggleJobAlert
} = require('../controllers/jobAlertsController')

router.use(protect)

// POST /api/job-alerts
router.post('/', createJobAlert)

// GET /api/job-alerts
router.get('/', getJobAlerts)

// PATCH /api/job-alerts/:id
router.patch('/:id', updateJobAlert)

// DELETE /api/job-alerts/:id
router.delete('/:id', deleteJobAlert)

// PATCH /api/job-alerts/:id/toggle
router.patch('/:id/toggle', toggleJobAlert)

module.exports = router
