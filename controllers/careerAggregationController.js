const careerAggregationService = require('../services/careerAggregationService')

/**
 * CareerAggregationController (Stage 2: Unified Career APIs & Data Synchronization Layer)
 * Exposes production-ready REST endpoints powering every Careers page from a single aggregated CareerProfile.
 */

// GET /api/careers/dashboard
exports.getDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id
    const data = await careerAggregationService.getDashboard(userId)
    return res.status(200).json({
      success: true,
      message: 'Career dashboard data retrieved successfully',
      data
    })
  } catch (err) {
    next(err)
  }
}

// GET /api/careers/learning
exports.getLearningHub = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id
    const data = await careerAggregationService.getLearningHub(userId)
    return res.status(200).json({
      success: true,
      message: 'Learning hub data retrieved successfully',
      data
    })
  } catch (err) {
    next(err)
  }
}

// GET /api/careers/resume
exports.getResumeCenter = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id
    const data = await careerAggregationService.getResumeCenter(userId)
    return res.status(200).json({
      success: true,
      message: 'Resume center data retrieved successfully',
      data
    })
  } catch (err) {
    next(err)
  }
}

// GET /api/careers/opportunities
exports.getOpportunities = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id
    const data = await careerAggregationService.getOpportunities(userId)
    return res.status(200).json({
      success: true,
      message: 'Career opportunities data retrieved successfully',
      data
    })
  } catch (err) {
    next(err)
  }
}

// GET /api/careers/interview
exports.getInterviewCenter = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id
    const data = await careerAggregationService.getInterviewCenter(userId)
    return res.status(200).json({
      success: true,
      message: 'Interview center data retrieved successfully',
      data
    })
  } catch (err) {
    next(err)
  }
}

// GET /api/careers/copilot/context
exports.getCopilotContext = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id
    const data = await careerAggregationService.getCopilotContext(userId)
    return res.status(200).json({
      success: true,
      message: 'AI Copilot context built successfully',
      data
    })
  } catch (err) {
    next(err)
  }
}

// POST /api/careers/sync/:module
exports.syncModule = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id
    const { module: moduleName } = req.params
    const updatedProfile = await careerAggregationService.syncModule(userId, moduleName, req.body)
    return res.status(200).json({
      success: true,
      message: `Career profile synced for ${moduleName}`,
      data: updatedProfile
    })
  } catch (err) {
    next(err)
  }
}
