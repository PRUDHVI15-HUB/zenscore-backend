const careerIntelligenceService = require('../services/careerIntelligenceService')

/**
 * CareerIntelligenceController (Stage 3: Career Intelligence Engine)
 * Exposes endpoints for executing full career intelligence evaluation and automatic recalculations.
 */

// GET /api/careers/intelligence
exports.getCareerIntelligence = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id
    const intelligenceReport = await careerIntelligenceService.evaluateCareerIntelligence(userId)
    return res.status(200).json({
      success: true,
      message: 'Career intelligence report generated successfully',
      data: intelligenceReport
    })
  } catch (err) {
    next(err)
  }
}

// POST /api/careers/intelligence/recalculate
exports.recalculateCareerIntelligence = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id
    const updatedReport = await careerIntelligenceService.evaluateCareerIntelligence(userId)
    return res.status(200).json({
      success: true,
      message: 'Career intelligence engine recalculated successfully',
      data: updatedReport
    })
  } catch (err) {
    next(err)
  }
}
