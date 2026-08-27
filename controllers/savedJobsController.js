const { createNotificationIfNotExists } = require('../services/notificationService')
﻿const mongoose = require('mongoose')
const SavedJob = require('../models/SavedJob')
const JobListing = require('../models/JobListing')

/**
 * POST /api/jobs/:jobId/save
 * Bookmark/save a job for the authenticated student
 */
const saveJob = async (req, res) => {
  try {
    const { jobId } = req.params
    const userId = req.user._id

    if (!jobId || !mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(404).json({ success: false, message: 'Job listing not found.' })
    }

    // 1. Verify job exists
    const jobExists = await JobListing.findById(jobId)
    if (!jobExists) {
      return res.status(404).json({ success: false, message: 'Job listing not found.' })
    }

    // 2. Check if already saved
    const existing = await SavedJob.findOne({ user: userId, job: jobId })
    if (existing) {
      return res.status(200).json({
        success: true,
        saved: true,
        message: 'Already Saved'
      })
    }

    // 3. Create new saved job entry
    await SavedJob.create({
      user: userId,
      job: jobId,
      savedAt: new Date()
    })

    try {
      createNotificationIfNotExists({
        userId,
        type: 'job',
        eventKey: `job-save-${savedJob._id}`,
        title: 'Job Saved',
        message: `Saved ${job.title} at ${job.company} to your bookmarked jobs.`,
        icon: '⭐',
        route: '/jobs/saved',
        entityId: savedJob._id,
        metadata: { jobId: job._id, title: job.title, company: job.company }
      }).catch(() => {})
    } catch (_) {}
    return res.status(201).json({
      success: true,
      saved: true,
      message: 'Job saved successfully'
    })
  } catch (err) {
    if (err.code === 11000) {
      return res.status(200).json({
        success: true,
        saved: true,
        message: 'Already Saved'
      })
    }
    return res.status(500).json({ success: false, message: err.message })
  }
}

/**
 * DELETE /api/jobs/:jobId/save
 * Remove bookmark for a job
 */
const removeSavedJob = async (req, res) => {
  try {
    const { jobId } = req.params
    const userId = req.user._id

    if (!jobId || !mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(404).json({ success: false, message: 'Job listing not found.' })
    }

    const result = await SavedJob.deleteOne({ user: userId, job: jobId })

    return res.status(200).json({
      success: true,
      removed: result.deletedCount > 0,
      message: result.deletedCount > 0 ? 'Job removed from saved jobs' : 'Job was not saved'
    })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

/**
 * GET /api/jobs/saved
 * Return all saved jobs for the authenticated student with pagination and populated JobListing
 */
const getSavedJobs = async (req, res) => {
  try {
    const userId = req.user._id
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit) || 12))
    const skip = (page - 1) * limit

    const total = await SavedJob.countDocuments({ user: userId })

    const savedRecords = await SavedJob.find({ user: userId })
      .sort({ savedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('job')
      .lean()

    // Map and filter out any orphaned records if job was removed
    const jobs = savedRecords
      .filter(record => record.job && record.job.isActive !== false)
      .map(record => {
        const jobDoc = record.job
        return {
          ...jobDoc,
          id: jobDoc._id,
          savedAt: record.savedAt,
          notes: record.notes
        }
      })

    const totalPages = Math.ceil(total / limit) || 1

    return res.status(200).json({
      success: true,
      jobs,
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
 * GET /api/jobs/:jobId/is-saved
 * Returns { saved: true/false } for the authenticated student
 */
const isJobSaved = async (req, res) => {
  try {
    const { jobId } = req.params
    const userId = req.user._id

    if (!jobId || !mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(200).json({ success: true, saved: false })
    }

    const exists = await SavedJob.exists({ user: userId, job: jobId })

    return res.status(200).json({
      success: true,
      saved: !!exists
    })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

module.exports = {
  saveJob,
  removeSavedJob,
  getSavedJobs,
  isJobSaved
}