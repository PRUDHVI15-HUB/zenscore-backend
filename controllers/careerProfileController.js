const careerProfileService = require('../services/careerProfileService')

/**
 * CareerProfile Controller (Stage 1: Unified Career Foundation)
 * Exposes protected REST API endpoints for single student CareerProfile.
 */

// GET /api/careers/profile
exports.getCareerProfile = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id
    const profile = await careerProfileService.getOrCreateProfile(userId)
    return res.status(200).json({
      success: true,
      message: 'Career profile retrieved successfully',
      data: profile
    })
  } catch (err) {
    next(err)
  }
}

// POST /api/careers/profile
exports.createCareerProfile = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id
    const profile = await careerProfileService.getOrCreateProfile(userId, req.body)
    return res.status(201).json({
      success: true,
      message: 'Career profile initialized successfully',
      data: profile
    })
  } catch (err) {
    next(err)
  }
}

// POST /api/careers/profile/complete — Onboarding Completion Endpoint
exports.completeOnboarding = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id
    const profile = await careerProfileService.completeOnboarding(userId, req.body)
    return res.status(200).json({
      success: true,
      message: 'Career onboarding completed successfully',
      data: profile
    })
  } catch (err) {
    next(err)
  }
}

// PUT /api/careers/profile
exports.updateCareerProfile = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id
    const updatedProfile = await careerProfileService.updateProfile(userId, req.body)
    return res.status(200).json({
      success: true,
      message: 'Career profile updated successfully',
      data: updatedProfile
    })
  } catch (err) {
    next(err)
  }
}

// POST /api/careers/profile/sync
exports.syncCareerProfile = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id
    await careerProfileService.syncAcademics(userId)
    await careerProfileService.syncSkills(userId)
    await careerProfileService.syncJobs(userId)
    const syncedProfile = await careerProfileService.recalculateReadiness(userId)

    return res.status(200).json({
      success: true,
      message: 'Career profile cross-module sync completed',
      data: syncedProfile
    })
  } catch (err) {
    next(err)
  }
}

// POST /api/careers/profile/readiness/refresh
exports.refreshReadiness = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id
    const refreshedProfile = await careerProfileService.recalculateReadiness(userId)
    return res.status(200).json({
      success: true,
      message: 'Career readiness recalculated successfully',
      data: refreshedProfile
    })
  } catch (err) {
    next(err)
  }
}
