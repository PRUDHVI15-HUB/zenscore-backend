const JobListing = require('../models/JobListing')
const User = require('../models/User')
const AcademicRecord = require('../models/AcademicRecord')

// GET /api/jobs
const getJobs = async (req, res) => {
  try {
    const { location, domain, level } = req.query
    const filter = { isActive: true }
    if (location) filter.location = { $regex: location, $options: 'i' }
    if (domain) filter.domain = { $regex: domain, $options: 'i' }
    if (level) filter.level = level

    const jobs = await JobListing.find(filter).sort({ createdAt: -1 })
    res.status(200).json({ success: true, count: jobs.length, data: jobs })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// POST /api/jobs/readiness-score
const getReadinessScore = async (req, res) => {
  const { jobId } = req.body
  if (!jobId) return res.status(400).json({ success: false, message: 'jobId is required.' })

  try {
    const job = await JobListing.findById(jobId)
    if (!job) return res.status(404).json({ success: false, message: 'Job not found.' })

    const user = await User.findById(req.user._id)
    const record = await AcademicRecord.findOne({ user: req.user._id })

    // Skill match
    const userSkills = user.skills.map(s => s.toLowerCase())
    const required = job.requiredSkills.map(s => s.toLowerCase())
    const matched = required.filter(s => userSkills.includes(s))
    const skillMatch = required.length ? matched.length / required.length : 0

    // CGPA normalized (out of 10)
    const cgpa = record?.cgpa || user.cgpa || 0
    const cgpaNormalized = cgpa / 10

    // Projects weight (max 5 projects = full score)
    const projectsWeight = Math.min(user.projectsCount / 5, 1)

    // Final score
    const score = Math.round(
      (skillMatch * 0.5 + cgpaNormalized * 0.3 + projectsWeight * 0.2) * 100
    )

    const suggestions = []
    if (skillMatch < 0.6) suggestions.push(`Learn missing skills: ${required.filter(s => !userSkills.includes(s)).join(', ')}`)
    if (cgpaNormalized < 0.7) suggestions.push('Improve your CGPA to above 7.0')
    if (projectsWeight < 0.6) suggestions.push('Add more projects to your profile (aim for 3+)')

    res.status(200).json({
      success: true,
      data: {
        score,
        skillMatch: Math.round(skillMatch * 100),
        cgpa,
        suggestions,
        jobTitle: job.title,
        company: job.company,
      },
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

module.exports = { getJobs, getReadinessScore }
