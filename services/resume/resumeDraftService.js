/**
 * resumeDraftService.js
 * =========================================================================
 * Manages non-destructive Resume Drafts and Versioning for ZenScore AI.
 * Ensures original uploaded files are never overwritten.
 */

const Resume = require('../../models/Resume')
const atsProvider = require('./providers/atsProvider')
const { generateResumeOptimization } = require('./resumeOptimizationService')
const careerProfileService = require('../careerProfileService')

/**
 * Creates an editable resume draft document from parent resume.
 */
async function createResumeDraft({ userId, parentResumeId }) {
  if (!userId) throw new Error('User ID is required.')

  let parent = null
  if (parentResumeId) {
    parent = await Resume.findOne({ _id: parentResumeId, user: userId })
  }
  if (!parent) {
    parent = await Resume.findOne({ user: userId, isCurrent: true }) || await Resume.findOne({ user: userId }).sort({ uploadedAt: -1 })
  }
  if (!parent) throw new Error('No base resume found to create draft.')

  // Check if unfinalized draft already exists for this parent
  let existingDraft = await Resume.findOne({ user: userId, parentResume: parent._id, isDraft: true })
  if (existingDraft) {
    return existingDraft
  }

  const versionNum = (parent.version || 1) + 1
  const draft = new Resume({
    user: userId,
    parentResume: parent._id,
    fileName: parent.fileName,
    fileType: parent.fileType,
    fileSize: parent.fileSize,
    uploadedAt: parent.uploadedAt,
    parsedAt: new Date(),

    candidate: JSON.parse(JSON.stringify(parent.candidate || {})),
    summary: parent.summary,
    education: JSON.parse(JSON.stringify(parent.education || [])),
    experience: JSON.parse(JSON.stringify(parent.experience || [])),
    internships: JSON.parse(JSON.stringify(parent.internships || [])),
    projects: JSON.parse(JSON.stringify(parent.projects || [])),
    skills: JSON.parse(JSON.stringify(parent.skills || [])),
    certifications: JSON.parse(JSON.stringify(parent.certifications || [])),
    achievements: JSON.parse(JSON.stringify(parent.achievements || [])),
    languages: JSON.parse(JSON.stringify(parent.languages || [])),

    rawText: parent.rawText,
    analysis: parent.analysis,
    optimization: parent.optimization,
    status: 'parsed',

    isCurrent: false,
    isDraft: true,
    version: versionNum,
    versionLabel: `ATS Optimized v${versionNum} (Draft)`,
    createdFrom: 'optimization',
    modifiedSections: [],
    contentSource: 'draft'
  })

  await draft.save()
  return draft
}

/**
 * Updates editable fields of a draft.
 */
async function updateResumeDraft({ userId, draftId, updatedData = {} }) {
  const draft = await Resume.findOne({ _id: draftId, user: userId, isDraft: true })
  if (!draft) throw new Error('Active draft not found or unauthorized.')

  const editableFields = ['candidate', 'summary', 'skills', 'education', 'experience', 'internships', 'projects', 'certifications', 'achievements']
  const modified = new Set(draft.modifiedSections || [])

  editableFields.forEach(field => {
    if (updatedData[field] !== undefined) {
      draft[field] = updatedData[field]
      modified.add(field)
    }
  })

  draft.modifiedSections = Array.from(modified)
  await draft.save()
  return draft
}

/**
 * Gets draft for user/parent.
 */
async function getResumeDraft({ userId, parentResumeId }) {
  if (parentResumeId) {
    const draft = await Resume.findOne({ user: userId, parentResume: parentResumeId, isDraft: true })
    if (draft) return draft
  }
  return await Resume.findOne({ user: userId, isDraft: true }).sort({ updatedAt: -1 })
}

/**
 * Finalizes draft into a new active version and re-runs ATS & Optimization analysis.
 */
async function finalizeResumeVersion({ userId, draftId, targetCareer = 'Full Stack Developer' }) {
  const draft = await Resume.findOne({ _id: draftId, user: userId, isDraft: true })
  if (!draft) throw new Error('Draft not found or already finalized.')

  // Synthesize readable rawText from draft sections for ATS parser
  const synthText = synthesizeRawTextFromDraft(draft)
  draft.rawText = synthText

  // Re-run ATS Provider & Optimization Analysis on modified content
  const fullAnalysis = await atsProvider.analyzeResume({
    rawText: synthText,
    parsedResume: draft,
    targetCareer
  })

  const studentProfile = await careerProfileService.getOrCreateProfile(userId).catch(() => ({}))
  const optimization = generateResumeOptimization(draft, studentProfile, fullAnalysis, targetCareer)

  // Mark all previous user resumes as non-current
  await Resume.updateMany({ user: userId }, { isCurrent: false })

  // Finalize draft properties
  draft.isDraft = false
  draft.isCurrent = true
  draft.analysis = fullAnalysis
  draft.optimization = optimization
  draft.versionLabel = `ATS Optimized v${draft.version}`
  draft.status = 'analyzed'

  await draft.save()

  // Sync with StudentProfile
  await careerProfileService.syncResume(userId, {
    atsScore: fullAnalysis.atsScore,
    version: `v${draft.version}`,
    status: 'Verified',
    resumeUploaded: true,
    resumeATSProvider: fullAnalysis.provider,
    resumeCareerMatchScore: fullAnalysis.careerMatch?.score || 0,
    resumeKeywordCoverage: optimization.keywordAnalysis?.keywordCoverage || 0,
    resumeCompleteness: fullAnalysis.completeness || 0,
    resumeSkillsDetected: fullAnalysis.skillsDetected || draft.skills || [],
    resumeMissingSkills: fullAnalysis.careerMatch?.missingSkills || [],
    resumeTopIssues: optimization.topIssues || [],
    resumeLastAnalyzedAt: new Date(),
    resumeOptimizationStatus: 'available'
  }).catch(e => console.warn('[ResumeDraftService] Sync warning:', e?.message))

  return draft
}

/**
 * Discards unfinalized draft.
 */
async function discardResumeDraft({ userId, draftId }) {
  const draft = await Resume.findOne({ _id: draftId, user: userId, isDraft: true })
  if (!draft) return false
  await draft.deleteOne()
  return true
}

/**
 * Gets family of versions for a resume.
 */
async function getResumeVersions({ userId }) {
  return await Resume.find({ user: userId, isDraft: false }).sort({ version: -1 })
}

function synthesizeRawTextFromDraft(draft) {
  const parts = []
  if (draft.candidate?.name) parts.push(draft.candidate.name)
  if (draft.candidate?.email) parts.push(draft.candidate.email)
  if (draft.summary) parts.push(`SUMMARY:\n${draft.summary}`)
  if (draft.skills && draft.skills.length > 0) parts.push(`SKILLS:\n${draft.skills.join(', ')}`)

  if (draft.experience && draft.experience.length > 0) {
    parts.push('EXPERIENCE:')
    draft.experience.forEach(exp => {
      parts.push(`${exp.role || ''} at ${exp.company || ''}`)
      if (exp.highlights && exp.highlights.length > 0) {
        parts.push(exp.highlights.join('\n'))
      }
    })
  }

  if (draft.projects && draft.projects.length > 0) {
    parts.push('PROJECTS:')
    draft.projects.forEach(p => {
      parts.push(`${p.title || ''}: ${p.description || ''}`)
    })
  }

  return parts.join('\n\n')
}

module.exports = {
  createResumeDraft,
  updateResumeDraft,
  getResumeDraft,
  finalizeResumeVersion,
  discardResumeDraft,
  getResumeVersions
}
