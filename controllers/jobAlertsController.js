const JobAlert = require('../models/JobAlert')

/**
 * POST /api/job-alerts
 * Create a new job alert rule for the authenticated student
 */
const createJobAlert = async (req, res) => {
  try {
    const userId = req.user._id
    const {
      name,
      keywords,
      categories,
      companies,
      locations,
      workModes,
      employmentTypes,
      minimumSalary,
      notifyEmail,
      notifyInApp
    } = req.body

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Alert name is required.' })
    }

    const alert = await JobAlert.create({
      user: userId,
      name: name.trim(),
      keywords: Array.isArray(keywords) ? keywords : (keywords ? keywords.split(',').map(s => s.trim()) : []),
      categories: Array.isArray(categories) ? categories : (categories ? [categories] : []),
      companies: Array.isArray(companies) ? companies : (companies ? [companies] : []),
      locations: Array.isArray(locations) ? locations : (locations ? [locations] : []),
      workModes: Array.isArray(workModes) ? workModes : (workModes ? [workModes] : []),
      employmentTypes: Array.isArray(employmentTypes) ? employmentTypes : (employmentTypes ? [employmentTypes] : []),
      minimumSalary: parseInt(minimumSalary) || 0,
      notifyEmail: notifyEmail !== undefined ? Boolean(notifyEmail) : true,
      notifyInApp: notifyInApp !== undefined ? Boolean(notifyInApp) : true,
      isActive: true,
      lastCheckedAt: new Date()
    })

    return res.status(201).json({
      success: true,
      message: 'Job alert created successfully.',
      alert
    })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

/**
 * GET /api/job-alerts
 * Return all job alerts for the authenticated student
 */
const getJobAlerts = async (req, res) => {
  try {
    const userId = req.user._id
    const alerts = await JobAlert.find({ user: userId }).sort({ createdAt: -1 }).lean()

    return res.status(200).json({
      success: true,
      alerts
    })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

/**
 * PATCH /api/job-alerts/:id
 * Update an existing job alert
 */
const updateJobAlert = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user._id

    const alert = await JobAlert.findOne({ _id: id, user: userId })
    if (!alert) {
      return res.status(404).json({ success: false, message: 'Job alert not found.' })
    }

    const fields = req.body || {}
    if (fields.name) alert.name = fields.name.trim()
    if (fields.keywords !== undefined) alert.keywords = Array.isArray(fields.keywords) ? fields.keywords : fields.keywords.split(',').map(s => s.trim())
    if (fields.categories !== undefined) alert.categories = Array.isArray(fields.categories) ? fields.categories : [fields.categories]
    if (fields.companies !== undefined) alert.companies = Array.isArray(fields.companies) ? fields.companies : [fields.companies]
    if (fields.locations !== undefined) alert.locations = Array.isArray(fields.locations) ? fields.locations : [fields.locations]
    if (fields.workModes !== undefined) alert.workModes = Array.isArray(fields.workModes) ? fields.workModes : [fields.workModes]
    if (fields.employmentTypes !== undefined) alert.employmentTypes = Array.isArray(fields.employmentTypes) ? fields.employmentTypes : [fields.employmentTypes]
    if (fields.minimumSalary !== undefined) alert.minimumSalary = parseInt(fields.minimumSalary) || 0
    if (fields.notifyEmail !== undefined) alert.notifyEmail = Boolean(fields.notifyEmail)
    if (fields.notifyInApp !== undefined) alert.notifyInApp = Boolean(fields.notifyInApp)
    if (fields.isActive !== undefined) alert.isActive = Boolean(fields.isActive)

    await alert.save()

    return res.status(200).json({
      success: true,
      message: 'Job alert updated successfully.',
      alert
    })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

/**
 * DELETE /api/job-alerts/:id
 * Delete a job alert
 */
const deleteJobAlert = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user._id

    const alert = await JobAlert.findOneAndDelete({ _id: id, user: userId })
    if (!alert) {
      return res.status(404).json({ success: false, message: 'Job alert not found.' })
    }

    return res.status(200).json({
      success: true,
      message: 'Job alert deleted successfully.'
    })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

/**
 * PATCH /api/job-alerts/:id/toggle
 * Enable or pause a job alert
 */
const toggleJobAlert = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user._id

    const alert = await JobAlert.findOne({ _id: id, user: userId })
    if (!alert) {
      return res.status(404).json({ success: false, message: 'Job alert not found.' })
    }

    alert.isActive = !alert.isActive
    await alert.save()

    return res.status(200).json({
      success: true,
      message: `Job alert ${alert.isActive ? 'enabled' : 'paused'} successfully.`,
      alert
    })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

module.exports = {
  createJobAlert,
  getJobAlerts,
  updateJobAlert,
  deleteJobAlert,
  toggleJobAlert
}
