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
  getModuleQuiz,
  submitModuleQuiz,
  getQuizResults,
  getModuleCoding,
  evaluateCodingExercise,
  saveModuleCodingDraft,
  submitModuleAssignment,
  getModuleProject,
  runModuleProjectTests,
  submitModuleProject,
  saveModuleProjectDraft,
  completeModule,
  toggleBookmark,
  getRoadmap,
  adjustRoadmap,
  getDailyChallenge,
  submitDailyChallenge,
  getNotifications,
  getCertificates,
  getLearningAnalytics,
  updateLastOpenedModule,
  getModuleNote,
  saveModuleNote,
  askModuleAITutor
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
router.post('/:id/last-opened', updateLastOpenedModule)

// Course Modules learning activities routes
router.post('/:id/modules/:moduleIndex/video', completeModuleVideo)
router.post('/:id/modules/:moduleIndex/notes', completeModuleNotes)
router.get('/:id/modules/:moduleIndex/quiz', getModuleQuiz)
router.post('/:id/modules/:moduleIndex/quiz', submitModuleQuiz)
router.post('/:id/modules/:moduleIndex/quiz/submit', submitModuleQuiz)
router.get('/:id/modules/:moduleIndex/quiz/results', getQuizResults)
router.get('/:id/modules/:moduleIndex/coding', getModuleCoding)
router.post('/:id/modules/:moduleIndex/coding', evaluateCodingExercise)
router.post('/:id/modules/:moduleIndex/coding/run', evaluateCodingExercise)
router.post('/:id/modules/:moduleIndex/coding/save', saveModuleCodingDraft)

// Capstone Project learning activities routes
router.get('/:id/modules/:moduleIndex/project', getModuleProject)
router.post('/:id/modules/:moduleIndex/project/run', runModuleProjectTests)
router.post('/:id/modules/:moduleIndex/project/submit', submitModuleProject)
router.post('/:id/modules/:moduleIndex/project/save', saveModuleProjectDraft)
router.post('/:id/modules/:moduleIndex/assignment', submitModuleAssignment)
router.post('/:id/modules/:moduleIndex/complete', completeModule)
router.get('/:id/modules/:moduleIndex/note', getModuleNote)
router.post('/:id/modules/:moduleIndex/note', saveModuleNote)
router.post('/:id/modules/:moduleIndex/tutor', askModuleAITutor)

module.exports = router
