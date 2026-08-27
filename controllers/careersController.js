/**
 * Careers Legacy Controller (Backend Compatibility Wrapper)
 * Preserves legacy routes (/paths, /roles, /skill-gap) without breaking older callers.
 */

const { DEFAULT_TARGET_ROLES } = require('../config/careerConstants')
const CareerPath = require('../models/CareerPath')
const User = require('../models/User')

// GET /api/careers/paths
const getCareerPaths = async (req, res) => {
  try {
    let paths = await CareerPath.find({}).lean()
    if (!paths || paths.length === 0) {
      paths = DEFAULT_TARGET_ROLES.map((title, idx) => ({
        _id: `path-${idx + 1}`,
        title,
        demandLevel: 'High',
        avgSalary: '₹18L - ₹32L LPA',
        requiredSkills: ['React.js', 'Node.js', 'System Design', 'Databases']
      }))
    }
    return res.status(200).json({ success: true, data: paths })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

// GET /api/careers/roles
const getRoles = async (req, res) => {
  try {
    const roles = DEFAULT_TARGET_ROLES.map(title => ({
      title,
      demandLevel: 'High',
      avgSalary: '₹18L - ₹30L LPA',
      requiredSkills: ['Problem Solving', 'Data Structures', 'Web Architecture']
    }))
    return res.status(200).json({ success: true, data: roles })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

// POST /api/careers/skill-gap
const getSkillGap = async (req, res) => {
  try {
    const { roleTitle, roleId } = req.body
    const target = roleTitle || 'Software Engineer'
    const user = await User.findById(req.user?._id || req.user?.id).lean()
    const userSkills = (user?.skills || []).map(s => String(s).toLowerCase())

    const standardRequired = ['javascript', 'react', 'node.js', 'databases', 'system design']
    const matched = standardRequired.filter(s => userSkills.includes(s))
    const missing = standardRequired.filter(s => !userSkills.includes(s))

    const completionPercentage = Math.round((matched.length / standardRequired.length) * 100)
    const roadmap = {}
    missing.forEach((skill, i) => {
      roadmap[`Phase ${i + 1}`] = `Learn and practice: ${skill}`
    })

    return res.status(200).json({
      success: true,
      data: {
        role: target,
        missingSkills: missing,
        matchedSkills: matched,
        completionPercentage,
        roadmap
      }
    })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

module.exports = { getCareerPaths, getRoles, getSkillGap }
