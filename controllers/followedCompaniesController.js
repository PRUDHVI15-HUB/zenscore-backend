const FollowedCompany = require('../models/FollowedCompany')
const JobListing = require('../models/JobListing')
const { getCompanyActivitySummary } = require('../services/jobs/companyActivityService')

/**
 * POST /api/companies/:company/follow
 * Follow a company to build personalized company watchlist
 */
const followCompany = async (req, res) => {
  try {
    const { company } = req.params
    const userId = req.user._id
    const companyNameClean = decodeURIComponent(company).trim()

    // Find sample logo if available
    const sampleJob = await JobListing.findOne({ company: { $regex: new RegExp(`^${companyNameClean}$`, 'i') } }).lean()
    const logo = sampleJob?.logo || '🏢'

    const existing = await FollowedCompany.findOne({
      user: userId,
      companyName: { $regex: new RegExp(`^${companyNameClean}$`, 'i') }
    })

    if (existing) {
      return res.status(200).json({
        success: true,
        following: true,
        message: `You are already following ${companyNameClean}.`,
        followedCompany: existing
      })
    }

    const newFollow = await FollowedCompany.create({
      user: userId,
      companyName: companyNameClean,
      companyLogo: logo,
      notificationsEnabled: true,
      followedAt: new Date()
    })

    return res.status(201).json({
      success: true,
      following: true,
      message: `You are now following ${companyNameClean}.`,
      followedCompany: newFollow
    })
  } catch (err) {
    if (err.code === 11000) {
      return res.status(200).json({
        success: true,
        following: true,
        message: 'Already following company.'
      })
    }
    return res.status(500).json({ success: false, message: err.message })
  }
}

/**
 * DELETE /api/companies/:company/follow
 * Unfollow a company
 */
const unfollowCompany = async (req, res) => {
  try {
    const { company } = req.params
    const userId = req.user._id
    const companyNameClean = decodeURIComponent(company).trim()

    const result = await FollowedCompany.findOneAndDelete({
      user: userId,
      companyName: { $regex: new RegExp(`^${companyNameClean}$`, 'i') }
    })

    if (!result) {
      return res.status(404).json({ success: false, message: 'Follow record not found.' })
    }

    return res.status(200).json({
      success: true,
      following: false,
      message: `Unfollowed ${companyNameClean} successfully.`
    })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

/**
 * GET /api/companies/following
 * Return all followed companies for the authenticated student
 */
const getFollowedCompanies = async (req, res) => {
  try {
    const userId = req.user._id
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit) || 12))
    const skip = (page - 1) * limit

    const total = await FollowedCompany.countDocuments({ user: userId })

    const followedDocs = await FollowedCompany.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    // Enrich each followed company with active job count
    const companies = await Promise.all(
      followedDocs.map(async (item) => {
        const activeJobsCount = await JobListing.countDocuments({
          company: { $regex: new RegExp(`^${item.companyName.trim()}$`, 'i') },
          isActive: true
        })

        return {
          id: item._id,
          companyName: item.companyName,
          companyLogo: item.companyLogo || '🏢',
          companyWebsite: item.companyWebsite,
          notificationsEnabled: item.notificationsEnabled,
          followedAt: item.followedAt,
          activeJobs: activeJobsCount,
          hiringStatus: activeJobsCount > 0 ? 'Actively Hiring' : 'Passively Hiring'
        }
      })
    )

    const totalPages = Math.ceil(total / limit) || 1

    return res.status(200).json({
      success: true,
      companies,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

/**
 * GET /api/companies/:company/is-following
 * Check if the student is following a specific company
 */
const isFollowingCompany = async (req, res) => {
  try {
    const { company } = req.params
    const userId = req.user._id
    const companyNameClean = decodeURIComponent(company).trim()

    const record = await FollowedCompany.findOne({
      user: userId,
      companyName: { $regex: new RegExp(`^${companyNameClean}$`, 'i') }
    }).lean()

    return res.status(200).json({
      success: true,
      following: !!record,
      notificationsEnabled: record ? record.notificationsEnabled : false
    })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

/**
 * PATCH /api/companies/:company/notifications
 * Enable or disable hiring notifications for a followed company
 */
const toggleCompanyNotifications = async (req, res) => {
  try {
    const { company } = req.params
    const userId = req.user._id
    const companyNameClean = decodeURIComponent(company).trim()

    const record = await FollowedCompany.findOne({
      user: userId,
      companyName: { $regex: new RegExp(`^${companyNameClean}$`, 'i') }
    })

    if (!record) {
      return res.status(404).json({ success: false, message: 'You are not following this company.' })
    }

    record.notificationsEnabled = !record.notificationsEnabled
    await record.save()

    return res.status(200).json({
      success: true,
      notificationsEnabled: record.notificationsEnabled,
      message: `Notifications ${record.notificationsEnabled ? 'enabled' : 'disabled'} for ${companyNameClean}.`
    })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

/**
 * GET /api/companies/:company/profile
 * Return complete company profile & active job openings
 */
const getCompanyProfile = async (req, res) => {
  try {
    const { company } = req.params
    const companyNameClean = decodeURIComponent(company).trim()

    const activitySummary = await getCompanyActivitySummary(companyNameClean)

    return res.status(200).json({
      success: true,
      profile: activitySummary
    })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

module.exports = {
  followCompany,
  unfollowCompany,
  getFollowedCompanies,
  isFollowingCompany,
  toggleCompanyNotifications,
  getCompanyProfile
}
