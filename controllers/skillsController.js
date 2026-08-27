const SkillsService = require('../services/skillsService')
const { getPersonalizedRecommendations } = require('../services/ai/skillsAIService')

// GET /api/skills/categories
const getCategories = async (req, res) => {
  try {
    const data = await SkillsService.getCategories()
    res.status(200).json({ success: true, data })
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message || 'Server error' })
  }
}

// GET /api/skills
const getSkills = async (req, res) => {
  try {
    const result = await SkillsService.getSkills(req.query)
    res.status(200).json({ success: true, data: result.skills, pagination: result.pagination })
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message || 'Server error' })
  }
}

// GET /api/skills/continue-learning OR /api/skills/continue
const getContinueLearning = async (req, res) => {
  try {
    const data = await SkillsService.getContinueLearning(req.user._id)
    res.status(200).json({ success: true, data })
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message || 'Server error' })
  }
}

// GET /api/skills/progress & sub-analytics routes
const getUserProgress = async (req, res) => {
  try {
    const data = await SkillsService.getUserProgress(req.user._id)
    res.status(200).json({ success: true, data })
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message || 'Server error' })
  }
}

// GET /api/skills/recommended
const getRecommendedSkills = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : null
    const data = await SkillsService.getRecommendedSkills(userId)
    res.status(200).json({ success: true, data })
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message || 'Server error' })
  }
}

// GET /api/skills/ai-recommendations
const getAIRecommendations = async (req, res) => {
  try {
    const data = await getPersonalizedRecommendations(req.user._id)
    res.status(200).json({ success: true, data })
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message || 'Server error' })
  }
}

// GET /api/skills/:skillId
const getSkillDetails = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : null
    const data = await SkillsService.getSkillDetails(req.params.skillId, userId)
    res.status(200).json({ success: true, data })
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message || 'Server error' })
  }
}

// POST /api/skills/:skillId/enroll
const enrollSkill = async (req, res) => {
  try {
    const data = await SkillsService.enrollSkill(req.params.skillId, req.user._id)
    res.status(201).json({ success: true, message: 'Enrolled successfully', data })
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message || 'Server error' })
  }
}

// POST /api/skills/:skillId/lessons/:lessonId/learn-complete OR /api/skills/lesson/:lessonId/learn-complete
const recordLearnComplete = async (req, res) => {
  try {
    const skillId = req.params.skillId || null
    const lessonId = req.params.lessonId
    const data = await SkillsService.recordLearnComplete(skillId, lessonId, req.user._id)
    res.status(200).json({ success: true, message: 'Learn stage completed', data })
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message || 'Server error' })
  }
}

// POST /api/skills/:skillId/lessons/:lessonId/complete OR /api/skills/lesson/:lessonId/complete
const completeLesson = async (req, res) => {
  try {
    const skillId = req.params.skillId || null
    const lessonId = req.params.lessonId
    const data = await SkillsService.completeLesson(skillId, lessonId, req.user._id)
    res.status(200).json({ success: true, message: 'Lesson marked as complete', data })
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message || 'Server error' })
  }
}

// POST /api/skills/:skillId/lessons/:lessonId/task/verify OR /api/skills/lesson/:lessonId/task/verify
const verifyLessonTask = async (req, res) => {
  try {
    const skillId = req.params.skillId || null
    const lessonId = req.params.lessonId
    const data = await SkillsService.verifyLessonTask(skillId, lessonId, req.body.code, req.body.command, req.user._id)
    res.status(200).json({ success: true, data })
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message || 'Server error' })
  }
}

// GET /api/skills/lesson/:lessonId/note OR /api/skills/:skillId/lessons/:lessonId/note
const getLessonNote = async (req, res) => {
  try {
    const skillId = req.params.skillId || req.query.skillId || null
    const data = await SkillsService.getLessonNote(req.params.lessonId, req.user._id, skillId)
    res.status(200).json({ success: true, data })
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message || 'Server error' })
  }
}

// POST /api/skills/lesson/:lessonId/note OR /api/skills/:skillId/lessons/:lessonId/note
const saveLessonNote = async (req, res) => {
  try {
    const skillId = req.params.skillId || req.body.skillId || null
    const data = await SkillsService.saveLessonNote(req.params.lessonId, req.body.content || '', req.user._id, skillId)
    res.status(200).json({ success: true, data })
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message || 'Server error' })
  }
}

// POST /api/skills/lesson/:lessonId/bookmark OR /api/skills/:skillId/lessons/:lessonId/bookmark
const toggleLessonBookmark = async (req, res) => {
  try {
    const skillId = req.params.skillId || req.body.skillId || null
    const data = await SkillsService.toggleLessonBookmark(req.params.lessonId, req.user._id, skillId)
    res.status(200).json({ success: true, data })
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message || 'Server error' })
  }
}

// POST /api/skills/lesson/:lessonId/quiz/submit OR /api/skills/:skillId/lessons/:lessonId/assessment/submit
const submitLessonQuiz = async (req, res) => {
  try {
    const skillId = req.params.skillId || req.body.skillId || null
    const data = await SkillsService.submitLessonQuiz(req.params.lessonId, req.body.answers, req.user._id, skillId)
    res.status(200).json({ success: true, data })
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message || 'Server error' })
  }
}

// POST /api/skills/lesson/:lessonId/ai OR /api/skills/:skillId/lessons/:lessonId/ai
const askLessonAI = async (req, res) => {
  try {
    const skillId = req.params.skillId || req.body.skillId || null
    const data = await SkillsService.askLessonAI(
      req.params.lessonId,
      req.body.prompt,
      req.body.history || [],
      req.body.promptType || 'explain',
      req.user._id,
      skillId
    )
    res.status(200).json({ success: true, data })
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message || 'Server error' })
  }
}

// GET /api/skills/certificate/:skillId
const getSkillCertificate = async (req, res) => {
  try {
    const data = await SkillsService.getSkillCertificate(req.params.skillId, req.user._id)
    res.status(200).json({ success: true, data })
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message || 'Server error' })
  }
}

module.exports = {
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
}
