const path = require('path')
const os = require('os')
const fs = require('fs')
const multer = require('multer')
const Resume = require('../models/Resume')
const { parseResumeWithRChilli } = require('../services/resume/rchilliResumeService')
const { normalizeRChilliData } = require('../services/resume/resumeNormalizationService')
const atsProvider = require('../services/resume/providers/atsProvider')
const { generateResumeOptimization } = require('../services/resume/resumeOptimizationService')
const careerProfileService = require('../services/careerProfileService')

// Configure Multer for temporary disk storage
const upload = multer({
  dest: path.join(os.tmpdir(), 'zenscore_resumes'),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
})

/**
 * POST /api/resume/upload
 * Multi-part resume upload using RChilli REST API provider, normalization, ATS analysis, Phase 6 optimization, and StudentProfile sync.
 */
async function uploadResume(req, res) {
  try {
    const userId = req.user._id || req.user.id
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a PDF or DOCX resume file.' })
    }

    // 1. Send file to RChilli Resume Parser Provider API
    const rchilliResult = await parseResumeWithRChilli(req.file)

    // Handle missing environment credentials or provider status
    if (rchilliResult?.status === 'credentials_missing') {
      return res.status(200).json({
        success: false,
        status: 'credentials_missing',
        message: 'RChilli API credentials (RCHILLI_USER_KEY) are missing in backend environment variables. Please configure RCHILLI_USER_KEY in .env.'
      })
    }

    if (!rchilliResult?.success || !rchilliResult?.rchilliData) {
      return res.status(200).json({
        success: false,
        status: rchilliResult?.status || 'failed',
        message: rchilliResult?.message || 'RChilli resume parsing failed.'
      })
    }

    // 2. Normalize RChilli proprietary JSON payload to ZenScore standard schema
    const parsedData = normalizeRChilliData(rchilliResult.rchilliData)

    // 3. Fetch student target career role & profile
    let targetCareer = req.body.targetCareer || req.body.selectedRole || 'Full Stack Developer'
    const jobDescription = req.body.jobDescription || null
    let studentProfile = null
    try {
      studentProfile = await careerProfileService.getOrCreateProfile(userId)
      if (studentProfile?.careerGoal?.targetCareer) {
        targetCareer = studentProfile.careerGoal.targetCareer
      }
    } catch (e) {
      console.info('[ResumeController] Target career fetch fallback notice:', e?.message)
    }

    // 4. Run External/Internal ATS Provider Analysis via Factory Dispatcher
    const fullAnalysis = await atsProvider.analyzeResume({
      filePath: req.file.path,
      rawText: parsedData.rawText,
      parsedResume: parsedData,
      targetCareer,
      jobDescription
    })

    // 5. Generate Phase 6 Resume Optimization Report
    const optimization = generateResumeOptimization(parsedData, studentProfile, fullAnalysis, targetCareer)

    // 6. Mark previous user resumes as isCurrent = false
    await Resume.updateMany({ user: userId }, { isCurrent: false })

    // 7. Save new Resume document in MongoDB
    const ext = path.extname(req.file.originalname || '').replace('.', '').toLowerCase() || 'pdf'
    const newResume = new Resume({
      user: userId,
      fileName: req.file.originalname || 'resume',
      fileType: ext === 'docx' ? 'docx' : 'pdf',
      fileSize: req.file.size || 0,
      uploadedAt: new Date(),
      parsedAt: new Date(),

      candidate: parsedData.candidate,
      summary: parsedData.summary,
      education: parsedData.education,
      experience: parsedData.experience,
      internships: parsedData.internships,
      projects: parsedData.projects,
      skills: parsedData.skills,
      certifications: parsedData.certifications,
      achievements: parsedData.achievements,
      languages: parsedData.languages,

      rawText: parsedData.rawText,
      analysis: fullAnalysis,
      optimization,
      status: 'parsed',
      isCurrent: true,
      parserVersion: 'RChilli_v8'
    })

    await newResume.save()

    // 8. Synchronize summary & ATS score to StudentProfile / CareerProfile
    const versionStr = `v${await Resume.countDocuments({ user: userId })}`
    await careerProfileService.syncResume(userId, {
      atsScore: fullAnalysis.atsScore,
      version: versionStr,
      status: 'Verified',
      resumeUploaded: true,
      resumeATSProvider: fullAnalysis.provider,
      resumeCareerMatchScore: fullAnalysis.careerMatch?.score || 0,
      resumeKeywordCoverage: optimization.keywordAnalysis?.keywordCoverage || 0,
      resumeCompleteness: fullAnalysis.completeness || 0,
      resumeSkillsDetected: fullAnalysis.skillsDetected || [],
      resumeMissingSkills: fullAnalysis.careerMatch?.missingSkills || [],
      resumeTopIssues: optimization.topIssues || [],
      resumeLastAnalyzedAt: fullAnalysis.analyzedAt || new Date(),
      resumeOptimizationStatus: 'available'
    }).catch(e => console.warn('[ResumeController] CareerProfile sync warning:', e?.message))

    // Prepare clean response (excluding rawText)
    const resDoc = newResume.toObject()
    delete resDoc.rawText

    return res.status(200).json({
      success: true,
      status: 'parsed',
      provider: fullAnalysis.provider,
      fallbackNotice: fullAnalysis.fallbackNotice || null,
      optimizationStatus: 'available',
      resume: resDoc
    })

  } catch (err) {
    console.error('[ResumeController] Resume upload error:', err)
    return res.status(500).json({
      success: false,
      message: err.message || 'An error occurred while processing the resume file via RChilli.'
    })
  }
}

/**
 * GET /api/resume
 * Retrieves resume history for authenticated student.
 */
async function getResumeHistory(req, res) {
  try {
    if (require('mongoose').connection.readyState !== 1) {
      return res.status(200).json({ success: true, resumes: [], isOffline: true })
    }
    const userId = req.user._id || req.user.id
    const resumes = await Resume.find({ user: userId })
      .select('-rawText')
      .sort({ uploadedAt: -1 })
      .lean()

    return res.status(200).json({
      success: true,
      resumes
    })
  } catch (err) {
    console.info('[ResumeController] Disconnected mode notice:', err?.message)
    return res.status(200).json({ success: true, resumes: [], isOffline: true })
  }
}

/**
 * GET /api/resume/:id
 * Retrieves detailed parsed resume document by ID.
 */
async function getResumeById(req, res) {
  try {
    if (require('mongoose').connection.readyState !== 1) {
      return res.status(404).json({ success: false, message: 'Resume service offline.' })
    }
    const userId = req.user._id || req.user.id
    const resume = await Resume.findOne({ _id: req.params.id, user: userId })
      .select('-rawText')
      .lean()

    if (!resume) {
      return res.status(404).json({ success: false, message: 'Resume not found.' })
    }

    return res.status(200).json({
      success: true,
      resume
    })
  } catch (err) {
    console.info('[ResumeController] Get resume notice:', err?.message)
    return res.status(404).json({ success: false, message: 'Failed to retrieve resume.' })
  }
}

/**
 * DELETE /api/resume/:id
 * Deletes specific resume for authenticated user and updates fallback current resume.
 */
async function deleteResume(req, res) {
  try {
    const userId = req.user._id || req.user.id
    const resume = await Resume.findOne({ _id: req.params.id, user: userId })

    if (!resume) {
      return res.status(404).json({ success: false, message: 'Resume not found or unauthorized.' })
    }

    const wasCurrent = resume.isCurrent
    await resume.deleteOne()

    // If deleted resume was current, pick the newest remaining resume as current
    if (wasCurrent) {
      const newestRemaining = await Resume.findOne({ user: userId }).sort({ uploadedAt: -1 })
      if (newestRemaining) {
        newestRemaining.isCurrent = true
        await newestRemaining.save()
        await careerProfileService.syncResume(userId, {
          atsScore: newestRemaining.analysis?.atsScore || 0,
          version: 'v1.0',
          status: 'Verified'
        }).catch(() => null)
      } else {
        // Reset profile resume state if no resumes remain
        const profile = await careerProfileService.getOrCreateProfile(userId)
        if (profile?.resumeSummary) {
          profile.resumeSummary.resumeUploaded = false
          profile.resumeSummary.atsScore = 0
          profile.resumeSummary.resumeReadinessPct = 0
          profile.resumeSummary.resumeStatus = 'Not Uploaded'
          await profile.save().catch(() => null)
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Resume deleted successfully.'
    })
  } catch (err) {
    console.error('[ResumeController] Delete resume error:', err)
    return res.status(500).json({ success: false, message: 'Failed to delete resume.' })
  }
}

/**
 * POST /api/resume/job-match
 * Compares authenticated student's active resume against a target job description text.
 */
async function matchJobDescription(req, res) {
  try {
    const userId = req.user._id || req.user.id
    const { resumeId, jobDescription, targetCareer: reqTargetCareer } = req.body || {}

    if (!jobDescription || typeof jobDescription !== 'string' || jobDescription.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide a valid job description text to compare.' })
    }

    // Load active or specified resume
    let resume = null
    if (resumeId) {
      resume = await Resume.findOne({ _id: resumeId, user: userId })
    }
    if (!resume) {
      resume = await Resume.findOne({ user: userId, isCurrent: true }) || await Resume.findOne({ user: userId }).sort({ uploadedAt: -1 })
    }

    let targetCareer = reqTargetCareer
    if (!targetCareer && resume?.analysis?.careerMatch?.targetCareer) {
      targetCareer = resume.analysis.careerMatch.targetCareer
    }
    if (!targetCareer) {
      try {
        const profile = await careerProfileService.getOrCreateProfile(userId)
        targetCareer = profile?.careerGoal?.targetCareer || 'Full Stack Developer'
      } catch (e) {
        targetCareer = 'Full Stack Developer'
      }
    }

    // Build parsed payload from resume
    const parsedResume = resume ? {
      candidate: resume.candidate,
      summary: resume.summary,
      experience: resume.experience,
      education: resume.education,
      projects: resume.projects,
      skills: resume.skills
    } : { skills: [] }

    // Run ATS Provider with jobDescription parameter
    const jobAnalysis = await atsProvider.analyzeResume({
      rawText: resume?.rawText || '',
      parsedResume,
      targetCareer,
      jobDescription
    })

    const matchingKeywords = jobAnalysis.matchingKeywords || []
    const missingKeywords = jobAnalysis.missingKeywords || []
    const matchingSkills = jobAnalysis.careerMatch?.matchingSkills || []
    const missingSkills = jobAnalysis.careerMatch?.missingSkills || []

    return res.status(200).json({
      success: true,
      jobMatch: {
        targetCareer,
        matchScore: jobAnalysis.keywordMatch || jobAnalysis.atsScore || 0,
        matchingKeywords,
        missingKeywords,
        matchingSkills,
        missingSkills,
        recommendations: jobAnalysis.recommendations || [],
        analyzedAt: new Date()
      }
    })

  } catch (err) {
    console.error('[ResumeController] Job match error:', err)
    return res.status(500).json({ success: false, message: 'Failed to complete job description match.' })
  }
}

// ── PHASE 7 DRAFT & VERSIONING HANDLERS ──

const resumeDraftService = require('../services/resume/resumeDraftService')
const { generateResumeImprovementSuggestions } = require('../services/resume/resumeImprovementService')

async function createDraft(req, res) {
  try {
    const userId = req.user._id || req.user.id
    const parentResumeId = req.params.id || req.body.parentResumeId
    const draft = await resumeDraftService.createResumeDraft({ userId, parentResumeId })
    return res.status(200).json({ success: true, draft })
  } catch (err) {
    console.error('[ResumeController] Create draft error:', err)
    return res.status(500).json({ success: false, message: err?.message || 'Failed to create resume draft.' })
  }
}

async function updateDraft(req, res) {
  try {
    const userId = req.user._id || req.user.id
    const draftId = req.params.id
    const draft = await resumeDraftService.updateResumeDraft({ userId, draftId, updatedData: req.body })
    return res.status(200).json({ success: true, draft })
  } catch (err) {
    console.error('[ResumeController] Update draft error:', err)
    return res.status(500).json({ success: false, message: err?.message || 'Failed to update draft.' })
  }
}

async function getDraft(req, res) {
  try {
    const userId = req.user._id || req.user.id
    const parentResumeId = req.params.id
    const draft = await resumeDraftService.getResumeDraft({ userId, parentResumeId })
    return res.status(200).json({ success: true, draft: draft || null })
  } catch (err) {
    console.error('[ResumeController] Get draft error:', err)
    return res.status(500).json({ success: false, message: 'Failed to retrieve draft.' })
  }
}

async function improveDraftSection(req, res) {
  try {
    const { section, content, targetCareer } = req.body || {}
    const result = generateResumeImprovementSuggestions({ section, content, targetCareer })
    return res.status(200).json({ success: true, improvement: result })
  } catch (err) {
    console.error('[ResumeController] Improve section error:', err)
    return res.status(500).json({ success: false, message: 'Failed to generate improvement suggestion.' })
  }
}

async function finalizeDraft(req, res) {
  try {
    const userId = req.user._id || req.user.id
    const draftId = req.params.id
    const { targetCareer } = req.body || {}
    const finalized = await resumeDraftService.finalizeResumeVersion({ userId, draftId, targetCareer })
    return res.status(200).json({ success: true, resume: finalized })
  } catch (err) {
    console.error('[ResumeController] Finalize draft error:', err)
    return res.status(500).json({ success: false, message: err?.message || 'Failed to finalize resume draft.' })
  }
}

async function discardDraft(req, res) {
  try {
    const userId = req.user._id || req.user.id
    const draftId = req.params.id
    const ok = await resumeDraftService.discardResumeDraft({ userId, draftId })
    return res.status(200).json({ success: ok })
  } catch (err) {
    console.error('[ResumeController] Discard draft error:', err)
    return res.status(500).json({ success: false, message: 'Failed to discard draft.' })
  }
}

async function getResumeVersions(req, res) {
  try {
    const userId = req.user._id || req.user.id
    const versions = await resumeDraftService.getResumeVersions({ userId })
    return res.status(200).json({ success: true, versions })
  } catch (err) {
    console.error('[ResumeController] Get versions error:', err)
    return res.status(500).json({ success: false, message: 'Failed to retrieve version history.' })
  }
}

module.exports = {
  uploadMiddleware: upload.single('resume'),
  uploadResume,
  getResumeHistory,
  getResumeById,
  deleteResume,
  matchJobDescription,
  createDraft,
  updateDraft,
  getDraft,
  improveDraftSection,
  finalizeDraft,
  discardDraft,
  getResumeVersions
}
