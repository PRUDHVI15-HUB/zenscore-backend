const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/authMiddleware')
const { getJobs, getReadinessScore } = require('../controllers/jobsController')

router.use(protect)

router.get('/', getJobs)
router.post('/readiness-score', getReadinessScore)

module.exports = router
