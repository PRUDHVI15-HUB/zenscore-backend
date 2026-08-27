const express = require('express')
const router = express.Router()
const { protect, optionalAuth } = require('../middleware/authMiddleware')
const {
  getRoadmaps,
  getUserRoadmaps,
  getRoadmapDetails,
  enrollRoadmap,
  updateNodeProgress
} = require('../controllers/roadmapController')

// Public / Optional Auth
router.get('/', optionalAuth, getRoadmaps)

// Protected Routes
router.get('/user', protect, getUserRoadmaps)
router.get('/progress', protect, getUserRoadmaps)
router.post('/enroll', protect, enrollRoadmap)
router.patch('/node/:nodeId', protect, updateNodeProgress)

// Parameterized Detail Route
router.get('/:roadmapId', optionalAuth, getRoadmapDetails)

module.exports = router
