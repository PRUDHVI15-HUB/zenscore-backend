const express = require('express')
const router = express.Router()
const { protect, optionalAuth } = require('../middleware/authMiddleware')
const {
  addFocusLog,
  getFocusLogs,
  deleteFocusLog,
  getAnalytics,
  getAISuggestion,
  getProductivityCoach
} = require('../controllers/productivityController')

router.post('/focus-log', protect, addFocusLog)
router.get('/focus-log', protect, getFocusLogs)
router.delete('/focus-log/:id', protect, deleteFocusLog)
router.get('/analytics', protect, getAnalytics)
router.post('/ai-suggestion', protect, getAISuggestion)
router.post('/coach', optionalAuth, getProductivityCoach)

module.exports = router
