/**
 * Shared Career Context Builder (Backend)
 * Gathers and normalizes real student profile, career profile, resume, skills,
 * and academic context in parallel using Promise.allSettled.
 * Provides a single source of truth for all Career AI subsystems.
 */

const mongoose = require('mongoose')
const CareerProfile = require('../../models/CareerProfile')
const StudentProfile = require('../../models/StudentProfile')
const Resume = require('../../models/Resume')
const UserSkillProgress = require('../../models/UserSkillProgress')
const AcademicRecord = require('../../models/AcademicRecord')

/**
 * Builds a standardized, compact context object for AI services.
 * @param {string|ObjectId} userId - The authenticated user's ID.
 * @returns {Promise<Object>} Unified career context.
 */
async function buildCareerContext(userId) {
  if (!userId) {
    return getAnonymousFallbackContext()
  }

  try {
    const userObjectId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId
    const userStringId = String(userId)

    const results = await Promise.allSettled([
      CareerProfile.findOne({ $or: [{ user: userObjectId }, { user: userStringId }] }).lean(),
      StudentProfile.findOne({ $or: [{ userId: userStringId }, { userId: userObjectId }] }).lean(),
      Resume.findOne({ $or: [{ user: userObjectId }, { user: userStringId }] }).lean().sort({ updatedAt: -1 }),
      UserSkillProgress.find({ $or: [{ user: userObjectId }, { user: userStringId }] }).lean(),
      AcademicRecord.findOne({ $or: [{ user: userObjectId }, { user: userStringId }] }).lean()
    ])

    const careerProfile = results[0].status === 'fulfilled' ? results[0].value : null
    const studentProfile = results[1].status === 'fulfilled' ? results[1].value : null
    const currentResume = results[2].status === 'fulfilled' ? results[2].value : null
    const userSkills = results[3].status === 'fulfilled' ? (results[3].value || []) : []
    const academicRecord = results[4].status === 'fulfilled' ? results[4].value : null

    // Determine target role
    const targetCareer = studentProfile?.careerProfile?.data?.selectedCareerGoal ||
      careerProfile?.careerGoal?.targetCareer ||
      'Software Engineer'

    // Verified skills
    const verifiedSkills = userSkills
      .filter(s => s.status === 'VERIFIED' || s.status === 'completed' || s.completionPercentage >= 80)
      .map(s => s.skillName || s.name || s.skillId)

    const inProgressSkills = userSkills
      .filter(s => (s.status === 'IN_PROGRESS' || s.status === 'in-progress' || (s.completionPercentage > 0 && s.completionPercentage < 80)))
      .map(s => s.skillName || s.name || s.skillId)

    // Resume insights
    const atsScore = currentResume?.analysis?.atsScore || careerProfile?.resumeSummary?.atsScore || 0
    const resumeSkills = currentResume?.skills || []

    // Academics
    const currentCGPA = academicRecord?.currentCGPA ||
      studentProfile?.academicSummary?.data?.currentCGPA ||
      careerProfile?.academicsSummary?.currentCGPA ||
      null

    // Readiness metrics
    const readinessPct = careerProfile?.readinessEngine?.overallReadinessPct || 0
    const interviewCount = careerProfile?.interviewActivity?.mockInterviews || 0
    const interviewAvg = careerProfile?.interviewActivity?.averageScore || 0

    return {
      userId: userStringId,
      targetCareer,
      experienceLevel: careerProfile?.careerGoal?.experienceLevel || 'Student / Fresher',
      readinessPct,
      currentCGPA,
      verifiedSkills: verifiedSkills.length > 0 ? verifiedSkills : (careerProfile?.skillsSummary?.completedSkills || []),
      inProgressSkills: inProgressSkills.length > 0 ? inProgressSkills : (careerProfile?.skillsSummary?.skillsInProgress || []),
      resumeSkills,
      atsScore,
      hasUploadedResume: Boolean(currentResume || careerProfile?.resumeSummary?.resumeUploaded),
      interviewStats: {
        completedCount: interviewCount,
        averageScore: interviewAvg
      },
      learningProgressPct: careerProfile?.learningProgress?.learningProgressPct || 0,
      timestamp: new Date().toISOString()
    }
  } catch (err) {
    console.warn('[CareerContextBuilder] Error generating context:', err.message)
    return getAnonymousFallbackContext()
  }
}

function getAnonymousFallbackContext() {
  return {
    userId: null,
    targetCareer: 'Software Engineer',
    experienceLevel: 'Student / Entry Level',
    readinessPct: 0,
    currentCGPA: null,
    verifiedSkills: [],
    inProgressSkills: [],
    resumeSkills: [],
    atsScore: 0,
    hasUploadedResume: false,
    interviewStats: { completedCount: 0, averageScore: 0 },
    learningProgressPct: 0,
    timestamp: new Date().toISOString()
  }
}

module.exports = {
  buildCareerContext
}
