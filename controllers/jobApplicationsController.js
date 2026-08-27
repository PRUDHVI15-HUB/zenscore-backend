const { createNotification } = require('../services/notificationService')
﻿const mongoose = require('mongoose')
const JobApplication = require('../models/JobApplication')
const JobListing = require('../models/JobListing')
const SavedJob = require('../models/SavedJob')
const { getUserApplicationAnalytics } = require('../services/jobs/applicationAnalyticsService')

/**
 * POST /api/jobs/:jobId/apply
 * Apply for a job and initialize timeline
 */
const applyForJob = async (req, res) => {
  try {
    const { jobId } = req.params
    const userId = req.user._id
    const { resumeUrl, coverLetter } = req.body || {}

    if (!jobId || !mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(404).json({ success: false, message: 'Job listing not found.' })
    }

    // 1. Verify job exists
    const job = await JobListing.findById(jobId)
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job listing not found.' })
    }

    // 2. Check if already applied
    const existing = await JobApplication.findOne({ user: userId, job: jobId })
    if (existing) {
      let redirectUrl = null
      if (job.applyLink && job.applyLink !== '#' && job.applyLink.trim() !== '') {
        redirectUrl = job.applyLink
      }

      return res.status(200).json({
        success: true,
        alreadyApplied: true,
        status: existing.status,
        redirectUrl,
        message: 'You have already applied to this job.'
      })
    }

    // 3. Determine external redirect URL if applicable
    let redirectUrl = null
    if (job.applyLink && job.applyLink !== '#' && job.applyLink.trim() !== '') {
      redirectUrl = job.applyLink
    }

    const now = new Date()

    // 4. Create JobApplication document with initial timeline entry
    const newApplication = await JobApplication.create({
      user: userId,
      job: jobId,
      applicationType: redirectUrl ? 'external' : 'internal',
      status: 'Applied',
      timeline: [
        {
          status: 'Applied',
          updatedAt: now,
          remarks: 'Application submitted successfully'
        }
      ],
      resumeUrl: resumeUrl || '',
      coverLetter: coverLetter || '',
      appliedAt: now,
      lastUpdated: now
    })

    try {
      createNotification({
        userId,
        type: 'job',
        eventKey: `job-app-${newApplication._id}`,
        title: 'Job Application Submitted',
        message: `Your application for ${job.title} at ${job.company} was submitted successfully.`,
        icon: '📬',
        route: '/jobs/applications',
        entityId: newApplication._id,
        metadata: { jobId: job._id, title: job.title, company: job.company }
      }).catch(() => {})
    } catch (_) {}
    return res.status(201).json({
      success: true,
      alreadyApplied: false,
      status: newApplication.status,
      redirectUrl,
      message: 'Application recorded successfully.'
    })
  } catch (err) {
    if (err.code === 11000) {
      return res.status(200).json({
        success: true,
        alreadyApplied: true,
        status: 'Applied',
        message: 'You have already applied to this job.'
      })
    }
    return res.status(500).json({ success: false, message: err.message })
  }
}

/**
 * GET /api/applications/me
 * Return paginated student applications with optional status filter and populated JobListing
 */
const getMyApplications = async (req, res) => {
  try {
    const userId = req.user._id
    const { status, search, sort, page = 1, limit = 10 } = req.query

    const pageNum = Math.max(1, parseInt(page))
    const limitNum = Math.max(1, Math.min(50, parseInt(limit)))

    const filter = { user: userId }
    if (status && status !== 'All') {
      filter.status = status
    }

    let query = JobApplication.find(filter).populate('job')

    // Sorting
    if (sort === 'oldest') {
      query = query.sort({ appliedAt: 1 })
    } else {
      query = query.sort({ appliedAt: -1 })
    }

    let applicationDocs = await query.lean()

    // Filter out null jobs
    applicationDocs = applicationDocs.filter(app => app.job && app.job.isActive !== false)

    // In-memory text search across company and title
    if (search && search.trim()) {
      const q = search.trim().toLowerCase()
      applicationDocs = applicationDocs.filter(app => {
        const titleMatch = app.job.title?.toLowerCase().includes(q)
        const companyMatch = app.job.company?.toLowerCase().includes(q)
        return titleMatch || companyMatch
      })
    }

    // Company sorting if requested
    if (sort === 'company') {
      applicationDocs.sort((a, b) => (a.job.company || '').localeCompare(b.job.company || ''))
    }

    const total = applicationDocs.length
    const skip = (pageNum - 1) * limitNum
    const paginatedDocs = applicationDocs.slice(skip, skip + limitNum)

    const applications = paginatedDocs.map(app => {
      const jobDoc = app.job
      return {
        id: app._id,
        jobId: jobDoc._id,
        title: jobDoc.title,
        company: jobDoc.company,
        logo: jobDoc.logo,
        location: jobDoc.location,
        workMode: jobDoc.workMode,
        salary: jobDoc.salary,
        category: jobDoc.category,
        aiMatch: jobDoc.aiMatch,
        applyLink: jobDoc.applyLink,
        applicationType: app.applicationType,
        status: app.status,
        timeline: app.timeline || [],
        recruiterNotes: app.recruiterNotes,
        interviewDate: app.interviewDate,
        offerPackage: app.offerPackage,
        rejectionReason: app.rejectionReason,
        appliedAt: app.appliedAt,
        lastUpdated: app.lastUpdated,
        jobDetails: jobDoc
      }
    })

    const totalPages = Math.ceil(total / limitNum) || 1

    return res.status(200).json({
      success: true,
      applications,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages
      }
    })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

/**
 * GET /api/applications/me/stats
 * Return aggregated placement dashboard statistics
 */
const getMyApplicationStats = async (req, res) => {
  try {
    const userId = req.user._id

    const [applications, savedCount] = await Promise.all([
      JobApplication.find({ user: userId }).populate('job').lean(),
      SavedJob.countDocuments({ user: userId })
    ])

    const validApps = applications.filter(a => a.job)

    const totalApplications = validApps.length
    let interviews = 0
    let offers = 0
    let rejected = 0
    let withdrawn = 0
    let matchSum = 0
    let matchCount = 0

    validApps.forEach(app => {
      const st = app.status
      if (['Assessment', 'Technical Interview', 'HR Interview'].includes(st)) {
        interviews++
      } else if (st === 'Offer') {
        offers++
      } else if (st === 'Rejected') {
        rejected++
      } else if (st === 'Withdrawn') {
        withdrawn++
      }

      if (app.job && typeof app.job.aiMatch === 'number') {
        matchSum += app.job.aiMatch
        matchCount++
      }
    })

    const activeApplications = totalApplications - (rejected + withdrawn)
    const averageMatchScore = matchCount > 0 ? Math.round(matchSum / matchCount) : 0

    return res.status(200).json({
      success: true,
      stats: {
        totalApplications,
        interviews,
        offers,
        rejected,
        withdrawn,
        activeApplications,
        savedJobs: savedCount,
        averageMatchScore
      }
    })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

/**
 * GET /api/applications/:id
 * Return complete application detail with full timeline
 */
const getApplicationById = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user._id

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ success: false, message: 'Application not found.' })
    }

    const app = await JobApplication.findOne({ _id: id, user: userId })
      .populate('job')
      .lean()

    if (!app) {
      return res.status(404).json({ success: false, message: 'Application not found.' })
    }

    return res.status(200).json({
      success: true,
      application: {
        id: app._id,
        jobId: app.job?._id,
        title: app.job?.title,
        company: app.job?.company,
        logo: app.job?.logo,
        location: app.job?.location,
        workMode: app.job?.workMode,
        salary: app.job?.salary,
        category: app.job?.category,
        aiMatch: app.job?.aiMatch,
        applyLink: app.job?.applyLink,
        applicationType: app.applicationType,
        status: app.status,
        timeline: app.timeline || [],
        recruiterNotes: app.recruiterNotes,
        interviewDate: app.interviewDate,
        offerPackage: app.offerPackage,
        rejectionReason: app.rejectionReason,
        resumeUrl: app.resumeUrl,
        coverLetter: app.coverLetter,
        appliedAt: app.appliedAt,
        lastUpdated: app.lastUpdated,
        jobDetails: app.job
      }
    })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

/**
 * PATCH /api/applications/:id/status
 * Updates recruitment status & appends to timeline with strict user ownership enforcement
 */
const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status, remarks } = req.body
    const userId = req.user._id

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ success: false, message: 'Application not found.' })
    }

    const validStatuses = [
      'Applied', 'Resume Reviewed', 'Assessment',
      'Technical Interview', 'HR Interview', 'Offer', 'Rejected', 'Withdrawn'
    ]

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` })
    }

    // Enforce strict ownership check
    const app = await JobApplication.findOne({ _id: id, user: userId })
    if (!app) {
      return res.status(404).json({ success: false, message: 'Application not found.' })
    }

    const now = new Date()
    app.status = status
    app.lastUpdated = now
    app.timeline.push({
      status,
      updatedAt: now,
      remarks: remarks || `Status updated to ${status}`
    })

    await app.save()

    return res.status(200).json({
      success: true,
      message: `Application status updated to ${status}`,
      application: app
    })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

/**
 * GET /api/jobs/:jobId/application-status
 * Return { applied: true/false, status } for the authenticated student
 */
const getApplicationStatus = async (req, res) => {
  try {
    const { jobId } = req.params
    const userId = req.user._id

    if (!jobId || !mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(200).json({
        success: true,
        applied: false
      })
    }

    const application = await JobApplication.findOne({ user: userId, job: jobId }).lean()

    if (application) {
      return res.status(200).json({
        success: true,
        applied: true,
        status: application.status,
        appliedAt: application.appliedAt
      })
    }

    return res.status(200).json({
      success: true,
      applied: false
    })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

/**
 * GET /api/applications/me/analytics
 * Return comprehensive placement analytics and skill gap recommendations
 */
const getApplicationAnalytics = async (req, res) => {
  try {
    const userId = req.user._id
    const analyticsData = await getUserApplicationAnalytics(userId)

    return res.status(200).json({
      success: true,
      ...analyticsData
    })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

module.exports = {
  applyForJob,
  getMyApplications,
  getMyApplicationStats,
  getApplicationAnalytics,
  getApplicationById,
  updateApplicationStatus,
  getApplicationStatus
}