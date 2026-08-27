/**
 * internalAtsProvider.js
 * =========================================================================
 * Internal Deterministic ATS Analysis Provider for ZenScore AI.
 * Wraps resumeAnalysisService to provide structured, target-career-aware
 * ATS analysis according to the Phase 4 normalized schema.
 */

const { analyzeATS, analyzeCareerMatch, generateRecommendations } = require('../resumeAnalysisService')

/**
 * Analyzes resume data using ZenScore internal deterministic scoring engine.
 *
 * @param {Object} params
 * @param {Object} params.parsedResume - Structured parsed resume data (candidate, skills, etc.)
 * @param {String} params.targetCareer - Canonical target career goal
 * @param {String} [params.jobDescription] - Optional job description text
 * @returns {Object} Normalized ATS Analysis Result
 */
async function analyzeResume({ parsedResume = {}, targetCareer = 'Full Stack Developer', jobDescription = null }) {
  const atsResult = analyzeATS(parsedResume)
  const careerMatch = analyzeCareerMatch(parsedResume.skills || [], targetCareer)
  const recommendations = generateRecommendations(parsedResume, careerMatch)

  const atsScore = atsResult.atsScore || 0
  const completeness = atsResult.completeness || 0
  const scoringReasons = atsResult.scoringReasons || []

  // Derived sub-scores for normalized ATS schema
  const keywordMatch = careerMatch.matchScore || 0
  const formattingScore = atsScore >= 80 ? 92 : (atsScore >= 60 ? 76 : 60)
  const contentScore = completeness
  const sectionScore = Math.round((completeness + atsScore) / 2)

  const strengths = scoringReasons.filter(r => r.includes('+'))
  const weaknesses = scoringReasons.filter(r => r.includes('0/') || r.includes('Missing') || r.includes('No '))

  // Extract keywords matching/missing if jobDescription provided or fallback to careerMatch
  let matchingKeywords = careerMatch.matchingSkills || []
  let missingKeywords = careerMatch.missingSkills || []

  if (jobDescription && typeof jobDescription === 'string') {
    const jdLower = jobDescription.toLowerCase()
    const allSkills = parsedResume.skills || []
    matchingKeywords = allSkills.filter(s => jdLower.includes(s.toLowerCase()))
    missingKeywords = careerMatch.missingSkills.filter(s => jdLower.includes(s.toLowerCase()))
  }

  return {
    provider: 'internal',
    atsScore,
    keywordMatch,
    formattingScore,
    contentScore,
    sectionScore,
    completeness,
    skillsDetected: parsedResume.skills || [],
    matchingKeywords,
    missingKeywords,
    missingSections: atsResult.missingSections || [],
    formatIssues: atsResult.formatIssues || [],
    recommendations,
    strengths,
    weaknesses,
    scoringReasons,
    careerMatch,
    rawProviderResponse: { source: 'ZenScore Internal ATS Engine v1' },
    analyzedAt: new Date()
  }
}

module.exports = {
  analyzeResume
}
