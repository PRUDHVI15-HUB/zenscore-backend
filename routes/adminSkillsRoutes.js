const express = require('express')
const router = express.Router()
const { protect, adminOnly } = require('../middleware/authMiddleware')
const {
  getAdminAnalytics,
  createCategory,
  updateCategory,
  deleteCategory,
  createSkill,
  updateSkill,
  deleteSkill,
  createLesson,
  updateLesson,
  deleteLesson
} = require('../controllers/adminSkillsController')

// Protect all admin routes with protect & adminOnly middleware
router.use(protect)
router.use(adminOnly)

// Admin Analytics
router.get('/analytics', getAdminAnalytics)

// Category Management
router.post('/categories', createCategory)
router.put('/categories/:id', updateCategory)
router.delete('/categories/:id', deleteCategory)

// Skill Management
router.post('/', createSkill)
router.put('/:id', updateSkill)
router.delete('/:id', deleteSkill)

// Lesson Management
router.post('/lessons', createLesson)
router.put('/lessons/:id', updateLesson)
router.delete('/lessons/:id', deleteLesson)

module.exports = router
