const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/authMiddleware')
const { addFocusLog, getAnalytics, getAISuggestion } = require('../controllers/productivityController')

router.use(protect)

router.post('/focus-log', addFocusLog)
router.get('/analytics', getAnalytics)
router.post('/ai-suggestion', getAISuggestion)

module.exports = router
