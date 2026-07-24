const CareerPath = require('../models/CareerPath')
const User = require('../models/User')

// GET /api/careers/paths
const getCareerPaths = async (req, res) => {
  try {
    const paths = await CareerPath.find({})
    res.status(200).json({ success: true, data: paths })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// GET /api/careers/roles
const getRoles = async (req, res) => {
  try {
    const roles = await CareerPath.find({}).select('title requiredSkills demandLevel avgSalary')
    res.status(200).json({ success: true, data: roles })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// POST /api/careers/skill-gap
const getSkillGap = async (req, res) => {
  const { roleId } = req.body
  if (!roleId) return res.status(400).json({ success: false, message: 'roleId is required.' })

  try {
    const role = await CareerPath.findById(roleId)
    if (!role) return res.status(404).json({ success: false, message: 'Role not found.' })

    const user = await User.findById(req.user._id)
    const userSkills = user.skills.map(s => s.toLowerCase())
    const required = role.requiredSkills.map(s => s.toLowerCase())

    const missingSkills = required.filter(s => !userSkills.includes(s))
    const matched = required.filter(s => userSkills.includes(s))
    const completionPercentage = Math.round((matched.length / required.length) * 100)

    const roadmap = {}
    missingSkills.forEach((skill, i) => {
      roadmap[`Week ${i + 1}`] = `Learn and practice: ${skill}`
    })

    res.status(200).json({
      success: true,
      data: {
        role: role.title,
        missingSkills,
        matchedSkills: matched,
        completionPercentage,
        roadmap,
      },
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

module.exports = { getCareerPaths, getRoles, getSkillGap }
