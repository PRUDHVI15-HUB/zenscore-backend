const express = require('express')
const router = express.Router()
const { protect, adminOnly } = require('../middleware/authMiddleware')
const {
  submitFeedback,
  getFeedbackStatus,
  exportFeedbackCSV
} = require('../controllers/feedbackController')

// Student endpoints (require authentication)
router.post('/', protect, submitFeedback)
router.get('/status', protect, getFeedbackStatus)

// Admin-only CSV export
router.get('/export-csv', protect, adminOnly, exportFeedbackCSV)

module.exports = router
