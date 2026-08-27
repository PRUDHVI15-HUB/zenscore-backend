const AdminSkillsService = require('../services/adminSkillsService')

// GET /api/admin/skills/analytics
const getAdminAnalytics = async (req, res) => {
  try {
    const data = await AdminSkillsService.getAdminAnalytics()
    res.status(200).json({ success: true, data })
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message || 'Server error' })
  }
}

// POST /api/admin/skills/categories
const createCategory = async (req, res) => {
  try {
    const data = await AdminSkillsService.createCategory(req.body)
    res.status(201).json({ success: true, message: 'Category created', data })
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message || 'Server error' })
  }
}

// PUT /api/admin/skills/categories/:id
const updateCategory = async (req, res) => {
  try {
    const data = await AdminSkillsService.updateCategory(req.params.id, req.body)
    res.status(200).json({ success: true, message: 'Category updated', data })
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message || 'Server error' })
  }
}

// DELETE /api/admin/skills/categories/:id
const deleteCategory = async (req, res) => {
  try {
    await AdminSkillsService.deleteCategory(req.params.id)
    res.status(200).json({ success: true, message: 'Category deleted' })
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message || 'Server error' })
  }
}

// POST /api/admin/skills
const createSkill = async (req, res) => {
  try {
    const data = await AdminSkillsService.createSkill(req.body)
    res.status(201).json({ success: true, message: 'Skill created', data })
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message || 'Server error' })
  }
}

// PUT /api/admin/skills/:id
const updateSkill = async (req, res) => {
  try {
    const data = await AdminSkillsService.updateSkill(req.params.id, req.body)
    res.status(200).json({ success: true, message: 'Skill updated', data })
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message || 'Server error' })
  }
}

// DELETE /api/admin/skills/:id
const deleteSkill = async (req, res) => {
  try {
    await AdminSkillsService.deleteSkill(req.params.id)
    res.status(200).json({ success: true, message: 'Skill deleted' })
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message || 'Server error' })
  }
}

// POST /api/admin/skills/lessons
const createLesson = async (req, res) => {
  try {
    const data = await AdminSkillsService.createLesson(req.body)
    res.status(201).json({ success: true, message: 'Lesson created', data })
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message || 'Server error' })
  }
}

// PUT /api/admin/skills/lessons/:id
const updateLesson = async (req, res) => {
  try {
    const data = await AdminSkillsService.updateLesson(req.params.id, req.body)
    res.status(200).json({ success: true, message: 'Lesson updated', data })
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message || 'Server error' })
  }
}

// DELETE /api/admin/skills/lessons/:id
const deleteLesson = async (req, res) => {
  try {
    await AdminSkillsService.deleteLesson(req.params.id)
    res.status(200).json({ success: true, message: 'Lesson deleted' })
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message || 'Server error' })
  }
}

module.exports = {
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
}
