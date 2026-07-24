const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/authMiddleware')
const {
  getCourses,
  getCourseById,
  getCourseStats,
  getRecommendedCourses,
  getContinueLearning,
  enrollInCourse,
  completeModuleVideo,
  completeModuleNotes,
  submitModuleQuiz,
  evaluateCodingExercise,
  submitModuleAssignment,
  completeModule,
  toggleBookmark,
  getRoadmap,
  adjustRoadmap,
  getDailyChallenge,
  submitDailyChallenge,
  getNotifications,
  getCertificates,
  getLearningAnalytics
} = require('../controllers/coursesController')

router.use(protect)

router.get('/', getCourses)
router.get('/stats', getCourseStats)
router.get('/recommended', getRecommendedCourses)
router.get('/continue-learning', getContinueLearning)
router.get('/analytics', getLearningAnalytics)
router.post('/roadmap/adjust', adjustRoadmap)
router.get('/roadmap', getRoadmap)
router.get('/daily-challenge', getDailyChallenge)
router.post('/daily-challenge/submit', submitDailyChallenge)
router.get('/notifications', getNotifications)
router.get('/certificates', getCertificates)
router.get('/:id', getCourseById)
router.post('/:id/enroll', enrollInCourse)
router.post('/:id/bookmark', toggleBookmark)

// Course Modules learning activities routes
router.post('/:id/modules/:moduleIndex/video', completeModuleVideo)
router.post('/:id/modules/:moduleIndex/notes', completeModuleNotes)
router.post('/:id/modules/:moduleIndex/quiz', submitModuleQuiz)
router.post('/:id/modules/:moduleIndex/coding', evaluateCodingExercise)
router.post('/:id/modules/:moduleIndex/assignment', submitModuleAssignment)
router.post('/:id/modules/:moduleIndex/complete', completeModule)

module.exports = router
