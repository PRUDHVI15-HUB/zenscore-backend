const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/authMiddleware')
const {
  getCategories,
  getSkills,
  getContinueLearning,
  getUserProgress,
  getRecommendedSkills,
  getAIRecommendations,
  getSkillDetails,
  enrollSkill,
  recordLearnComplete,
  verifyLessonTask,
  completeLesson,
  getLessonNote,
  saveLessonNote,
  toggleLessonBookmark,
  submitLessonQuiz,
  askLessonAI,
  getSkillCertificate
} = require('../controllers/skillsController')

// Public routes
router.get('/categories', getCategories)
router.get('/recommended', getRecommendedSkills)
router.get('/', getSkills)

// Protected Progress Analytics Routes (Step 9)
router.get('/continue-learning', protect, getContinueLearning)
router.get('/continue', protect, getContinueLearning)
router.get('/progress', protect, getUserProgress)
router.get('/progress/overview', protect, getUserProgress)
router.get('/progress/categories', protect, getUserProgress)
router.get('/progress/history', protect, getUserProgress)
router.get('/progress/activity', protect, getUserProgress)
router.get('/ai-recommendations', protect, getAIRecommendations)

// Interactive Engine Lesson Actions
router.get('/lesson/:lessonId/note', protect, getLessonNote)
router.post('/lesson/:lessonId/learn-complete', protect, recordLearnComplete)
router.post('/lesson/:lessonId/note', protect, saveLessonNote)
router.post('/lesson/:lessonId/bookmark', protect, toggleLessonBookmark)
router.post('/lesson/:lessonId/quiz/submit', protect, submitLessonQuiz)
router.post('/lesson/:lessonId/task/verify', protect, verifyLessonTask)
router.post('/lesson/:lessonId/ai', protect, askLessonAI)
router.post('/lesson/:lessonId/complete', protect, completeLesson)

router.get('/certificate/:skillId', protect, getSkillCertificate)

// Skill detail & interactive action routes
router.get('/:skillId', protect, getSkillDetails)
router.post('/:skillId/enroll', protect, enrollSkill)
router.post('/:skillId/ai-tutor', protect, askLessonAI)
router.get('/:skillId/lessons/:lessonId/note', protect, getLessonNote)
router.post('/:skillId/lessons/:lessonId/note', protect, saveLessonNote)
router.post('/:skillId/lessons/:lessonId/bookmark', protect, toggleLessonBookmark)
router.post('/:skillId/lessons/:lessonId/ai', protect, askLessonAI)
router.post('/:skillId/lessons/:lessonId/learn-complete', protect, recordLearnComplete)
router.post('/:skillId/lessons/:lessonId/assessment/submit', protect, submitLessonQuiz)
router.post('/:skillId/lessons/:lessonId/task/verify', protect, verifyLessonTask)
router.post('/:skillId/lessons/:lessonId/complete', protect, completeLesson)

module.exports = router
