const SkillRoadmap = require('../models/SkillRoadmap')

// GET /api/skills/categories
const getCategories = async (req, res) => {
  try {
    const categories = await SkillRoadmap.find({}).select('category timeline')
    res.status(200).json({ success: true, data: categories })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// GET /api/skills/:category
const getSkillByCategory = async (req, res) => {
  try {
    const skill = await SkillRoadmap.findOne({
      category: { $regex: new RegExp(req.params.category, 'i') }
    })
    if (!skill) return res.status(404).json({ success: false, message: 'Category not found.' })

    res.status(200).json({
      success: true,
      data: {
        category: skill.category,
        beginner: skill.beginner,
        intermediate: skill.intermediate,
        advanced: skill.advanced,
        timeline: skill.timeline,
        platforms: skill.platforms,
      },
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

module.exports = { getCategories, getSkillByCategory }
