const mongoose = require('mongoose')
const JobListing = require('../models/JobListing')
const User = require('../models/User')
const AcademicRecord = require('../models/AcademicRecord')

/**
 * Interleaves job listings by normalized role title to showcase diverse positions
 */
const interleaveJobsByRole = (rawJobs) => {
  if (!Array.isArray(rawJobs) || rawJobs.length === 0) return []

  const groups = new Map()
  for (const job of rawJobs) {
    const key = (job.title || 'Other').toLowerCase().trim()
    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key).push(job)
  }

  const result = []
  const groupArrays = Array.from(groups.values())
  let maxLen = 0
  groupArrays.forEach(arr => { if (arr.length > maxLen) maxLen = arr.length })

  for (let i = 0; i < maxLen; i++) {
    for (const arr of groupArrays) {
      if (i < arr.length) {
        result.push(arr[i])
      }
    }
  }

  return result
}

/**
 * GET /api/jobs
 * High performance MongoDB search & filtering with pagination & role diversity interleaving
 */
const getJobs = async (req, res) => {
  try {
    const {
      search,
      category,
      company,
      workMode,
      employmentType,
      experience,
      location,
      minSalary,
      featured,
      recommended,
      latest,
      page = 1,
      limit = 10
    } = req.query

    const filter = { isActive: true }

    // 1. Text / Regex Search across Title, Company, Required Skills with safe regex escaping
    if (search && search.trim()) {
      const q = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { company: { $regex: q, $options: 'i' } },
        { requiredSkills: { $elemMatch: { $regex: q, $options: 'i' } } }
      ]
    }

    // 2. Category Filter (matches category name, domain keywords, titles, or skills)
    if (category && category !== 'All') {
      const getCategoryPatterns = (cat) => {
        const c = cat.toLowerCase()
        if (c.includes('front')) return 'frontend|react|vue|angular|ui|ux|web developer|html|css|javascript'
        if (c.includes('back')) return 'backend|node|python|java|golang|express|fastapi|django|spring|api'
        if (c.includes('full')) return 'full stack|fullstack|mern|mean|software engineer|developer'
        if (c.includes('devops') || c.includes('cloud')) return 'devops|cloud|aws|azure|gcp|kubernetes|docker|ci/cd|terraform'
        if (c.includes('ai') || c.includes('ml') || c.includes('data')) return 'ai|ml|data|machine learning|python|deep learning|llm'
        if (c.includes('cyber') || c.includes('security')) return 'cyber|security|soc|penetration|infosec|network'
        return cat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      }

      const pattern = getCategoryPatterns(category)
      filter.$or = filter.$or || []
      filter.$or.push(
        { category: { $regex: pattern, $options: 'i' } },
        { title: { $regex: pattern, $options: 'i' } },
        { requiredSkills: { $elemMatch: { $regex: pattern, $options: 'i' } } }
      )
    }

    // 3. Company Filter
    if (company && company !== 'All' && company.trim()) {
      const safeComp = company.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      filter.company = { $regex: `^${safeComp}$`, $options: 'i' }
    }

    // 4. Work Mode
    if (workMode && workMode !== 'All') {
      const cleanMode = workMode.replace('-', '[ -]?')
      filter.workMode = { $regex: cleanMode, $options: 'i' }
    }

    // 5. Employment Type
    if (employmentType && employmentType !== 'All') {
      const cleanType = employmentType.replace('-', '[ -]?')
      filter.employmentType = { $regex: cleanType, $options: 'i' }
    }

    // 6. Experience Level
    if (experience && experience !== 'All') {
      filter.experience = { $regex: experience.replace(/[–—]/g, '[-–—]?'), $options: 'i' }
    }

    // 7. Location
    if (location && location !== 'All') {
      const safeLoc = location.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      filter.location = { $regex: safeLoc, $options: 'i' }
    }

    // 8. Min Salary
    if (minSalary && parseInt(minSalary) > 0) {
      filter.minSalaryVal = { $gte: parseInt(minSalary) }
    }

    // 9. Boolean Badges
    if (featured === 'true') filter.featured = true
    if (recommended === 'true') filter.recommended = true
    if (latest === 'true') filter.latest = true

    // Pagination setup
    const pageNum = Math.max(1, parseInt(page))
    const limitNum = Math.max(1, Math.min(100, parseInt(limit)))

    const totalJobs = await JobListing.countDocuments(filter)

    // Fetch candidate pool to interleave diverse roles
    const candidatePool = await JobListing.find(filter)
      .sort({ createdAt: -1 })
      .limit(300)
      .lean()

    // Interleave candidate pool so consecutive items display different job roles
    const interleavedPool = interleaveJobsByRole(candidatePool)

    // Paginate interleaved pool
    const skip = (pageNum - 1) * limitNum
    const jobs = interleavedPool.slice(skip, skip + limitNum)

    const totalPages = Math.ceil(totalJobs / limitNum) || 1

    res.status(200).json({
      success: true,
      jobs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalPages,
        totalJobs
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

/**
 * GET /api/jobs/featured
 */
const getFeaturedJobs = async (req, res) => {
  try {
    const jobs = await JobListing.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean()
    res.status(200).json({ success: true, count: jobs.length, jobs })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

/**
 * GET /api/jobs/recommended
 * Dynamically fetches and recommends live positions from MongoDB across all active integrations
 */
const getRecommendedJobs = async (req, res) => {
  try {
    const candidatePool = await JobListing.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(150)
      .lean()

    if (!candidatePool || candidatePool.length === 0) {
      return res.status(200).json({ success: true, count: 0, jobs: [] })
    }

    const interleaved = interleaveJobsByRole(candidatePool)
    const recommended = interleaved.slice(0, 6).map((job, idx) => ({
      ...job,
      aiMatch: job.aiMatch || (96 - idx * 2),
      recommended: true
    }))

    res.status(200).json({ success: true, count: recommended.length, jobs: recommended })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

/**
 * GET /api/jobs/latest
 * Dynamically fetches newly posted live positions from MongoDB
 */
const getLatestJobs = async (req, res) => {
  try {
    const candidatePool = await JobListing.find({ isActive: true })
      .sort({ createdAt: -1, postedDate: -1 })
      .limit(150)
      .lean()

    if (!candidatePool || candidatePool.length === 0) {
      return res.status(200).json({ success: true, count: 0, jobs: [] })
    }

    const interleaved = interleaveJobsByRole(candidatePool)
    const latest = interleaved.slice(3, 9).map(job => ({
      ...job,
      latest: true
    }))

    res.status(200).json({ success: true, count: latest.length, jobs: latest })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

/**
 * GET /api/jobs/:id
 */
const getJobById = async (req, res) => {
  try {
    const { id } = req.params
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ success: false, message: 'Job listing not found.' })
    }
    const job = await JobListing.findById(id).lean()
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job listing not found.' })
    }
    res.status(200).json({ success: true, job })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

/**
 * POST /api/jobs/readiness-score
 */
const getReadinessScore = async (req, res) => {
  const { jobId } = req.body
  if (!jobId || !mongoose.Types.ObjectId.isValid(jobId)) {
    return res.status(400).json({ success: false, message: 'Valid jobId is required.' })
  }

  try {
    const job = await JobListing.findById(jobId)
    if (!job) return res.status(404).json({ success: false, message: 'Job not found.' })

    const user = await User.findById(req.user._id)
    const record = await AcademicRecord.findOne({ user: req.user._id })

    // Skill match calculation
    const userSkills = (user?.skills || []).map(s => s.toLowerCase())
    const required = (job.requiredSkills || []).map(s => s.toLowerCase())
    const matched = required.filter(s => userSkills.includes(s))
    const skillMatch = required.length ? matched.length / required.length : 0

    // CGPA normalized (out of 10)
    const cgpa = record?.cgpa || user?.cgpa || 0
    const cgpaNormalized = cgpa > 0 ? cgpa / 10 : 0.7

    // Projects weight (max 5 projects = full score)
    const projectsCount = typeof user?.projectsCount === 'number' ? user.projectsCount : (user?.projects?.length || 0)
    const projectsWeight = Math.min(projectsCount / 5, 1)

    // Final score calculation
    const score = Math.round(
      (skillMatch * 0.5 + cgpaNormalized * 0.3 + projectsWeight * 0.2) * 100
    )

    const suggestions = []
    if (skillMatch < 0.6) suggestions.push(`Learn missing skills: ${required.filter(s => !userSkills.includes(s)).join(', ')}`)
    if (cgpaNormalized < 0.7) suggestions.push('Improve your academic record / CGPA')
    if (projectsWeight < 0.6) suggestions.push('Add more projects to your profile (aim for 3+)')

    res.status(200).json({
      success: true,
      data: {
        score,
        skillMatch: Math.round(skillMatch * 100),
        cgpa,
        suggestions,
        jobTitle: job.title,
        company: job.company
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

/**
 * GET /api/jobs/stats
 * Real-time dynamic aggregation of live MongoDB jobs, internships, hiring companies, and user applications
 */
const getJobStats = async (req, res) => {
  try {
    const JobApplication = require('../models/JobApplication')
    const baseFilter = { isActive: { $ne: false } }

    const [totalJobs, totalInternships, distinctCompaniesArr, totalApplications] = await Promise.all([
      JobListing.countDocuments(baseFilter),
      JobListing.countDocuments({
        ...baseFilter,
        $or: [
          { employmentType: /intern/i },
          { title: /intern/i },
          { category: /intern/i }
        ]
      }),
      JobListing.distinct('company', baseFilter),
      JobApplication.countDocuments({})
    ])

    return res.status(200).json({
      success: true,
      stats: {
        totalJobs: totalJobs || 0,
        totalInternships: totalInternships || 0,
        companiesCount: distinctCompaniesArr ? distinctCompaniesArr.length : 0,
        applicationsCount: totalApplications || 0
      }
    })
  } catch (err) {
    console.error('Error fetching job stats:', err)
    return res.status(500).json({
      success: false,
      message: 'Failed to compute job statistics'
    })
  }
}

module.exports = {
  getJobs,
  getFeaturedJobs,
  getRecommendedJobs,
  getLatestJobs,
  getJobById,
  getReadinessScore,
  getJobStats
}