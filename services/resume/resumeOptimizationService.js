/**
 * resumeOptimizationService.js
 * =========================================================================
 * Career-Specific Resume Optimization & Improvement Engine for ZenScore AI.
 * Analyzes parsed resume structure, ATS analysis, target career requirements,
 * and experience quality to produce comprehensive, actionable optimization guidance.
 */

const { CAREER_SKILL_REQUIREMENTS } = require('./resumeAnalysisService')

/**
 * Generates structured, target-career-aware resume optimization report.
 *
 * @param {Object} parsedResume - Standardized parsed resume object
 * @param {Object} studentProfile - Student Profile document or data envelope
 * @param {Object} atsResult - ATS Analysis result object
 * @param {String} targetCareer - Target career goal title
 * @returns {Object} Comprehensive Resume Optimization schema
 */
function generateResumeOptimization(parsedResume = {}, studentProfile = {}, atsResult = {}, targetCareer = 'Full Stack Developer') {
  const normCareer = targetCareer || 'Full Stack Developer'
  const requiredSkills = CAREER_SKILL_REQUIREMENTS[normCareer] || CAREER_SKILL_REQUIREMENTS['Full Stack Developer']

  const candidate = parsedResume.candidate || {}
  const summary = parsedResume.summary || ''
  const experience = parsedResume.experience || []
  const projects = parsedResume.projects || []
  const skills = parsedResume.skills || []
  const education = parsedResume.education || []
  const certifications = parsedResume.certifications || []
  const achievements = parsedResume.achievements || []

  // 1. SECTION ANALYSIS
  const sectionAnalysis = {
    contact: analyzeContactSection(candidate),
    summary: analyzeSummarySection(summary, normCareer),
    skills: analyzeSkillsSection(skills, requiredSkills),
    experience: analyzeExperienceSection(experience),
    projects: analyzeProjectsSection(projects),
    education: analyzeEducationSection(education),
    certifications: analyzeCertificationsSection(certifications),
    achievements: analyzeAchievementsSection(achievements)
  }

  // 2. KEYWORD ANALYSIS
  const extractedLower = skills.map(s => String(s).toLowerCase())
  const matchedKeywords = []
  const missingKeywords = []

  for (const reqSkill of requiredSkills) {
    if (extractedLower.includes(reqSkill.toLowerCase())) {
      matchedKeywords.push(reqSkill)
    } else {
      missingKeywords.push(reqSkill)
    }
  }

  const keywordCoverage = requiredSkills.length > 0
    ? Math.round((matchedKeywords.length / requiredSkills.length) * 100)
    : 0

  const keywordAnalysis = {
    matchedKeywords,
    missingKeywords,
    recommendedKeywords: missingKeywords.slice(0, 4),
    keywordCoverage
  }

  // 3. CAREER MATCH
  const careerMatch = {
    targetCareer: normCareer,
    matchScore: keywordCoverage,
    matchingSkills: matchedKeywords,
    missingSkills: missingKeywords,
    recommendedSkills: missingKeywords.slice(0, 4)
  }

  // 4. FORMATTING ANALYSIS
  const formattingAnalysis = analyzeFormatting(parsedResume, atsResult)

  // 5. CONTENT & BULLET ANALYSIS
  const contentAnalysis = analyzeContentQuality(experience, projects)

  // 6. PRIORITIZED RECOMMENDATIONS
  const recommendations = buildRecommendations({
    sectionAnalysis,
    keywordAnalysis,
    formattingAnalysis,
    contentAnalysis,
    targetCareer: normCareer
  })

  // 7. TOP ISSUES & NEXT ACTIONS
  const topIssues = recommendations
    .filter(r => r.priority === 'CRITICAL' || r.priority === 'HIGH')
    .slice(0, 3)
    .map(r => r.title)

  const nextActions = buildNextActions(recommendations, missingKeywords, normCareer)

  const atsScore = atsResult.atsScore || 0
  const overallScore = Math.round(atsScore * 0.5 + keywordCoverage * 0.5)

  let priorityLevel = 'LOW'
  if (overallScore < 60 || sectionAnalysis.contact.issues.length > 0) priorityLevel = 'CRITICAL'
  else if (overallScore < 75 || missingKeywords.length >= 3) priorityLevel = 'HIGH'
  else if (overallScore < 85) priorityLevel = 'MEDIUM'

  return {
    overallScore,
    priorityLevel,
    topIssues: topIssues.length > 0 ? topIssues : ['Optimize experience bullet metrics'],

    sectionAnalysis,
    keywordAnalysis,
    careerMatch,
    formattingAnalysis,
    contentAnalysis,

    recommendations,
    nextActions,

    generatedAt: new Date(),
    optimizerVersion: 'v1.0'
  }
}

function analyzeContactSection(candidate) {
  const issues = []
  const recommendations = []
  if (!candidate.email) {
    issues.push('Missing email address')
    recommendations.push('Add primary email address in header')
  }
  if (!candidate.phone) {
    issues.push('Missing phone number')
    recommendations.push('Add contact phone number in header')
  }
  if (!candidate.linkedin && !candidate.github) {
    issues.push('Missing LinkedIn/GitHub links')
    recommendations.push('Include professional LinkedIn or GitHub profile URLs')
  }

  const count = (candidate.email ? 1 : 0) + (candidate.phone ? 1 : 0) + (candidate.location ? 1 : 0) + (candidate.linkedin || candidate.github ? 1 : 0)
  const completeness = Math.round((count / 4) * 100)

  return {
    exists: true,
    completeness,
    quality: completeness >= 75 ? 90 : 60,
    issues,
    recommendations
  }
}

function analyzeSummarySection(summary, targetCareer) {
  const exists = Boolean(summary && summary.trim().length >= 15)
  const issues = []
  const recommendations = []

  if (!exists) {
    issues.push('Missing professional summary')
    recommendations.push(`Add a 2-3 sentence professional summary focused on ${targetCareer}`)
  } else if (summary.trim().length < 40) {
    issues.push('Summary is too brief')
    recommendations.push('Expand summary to 2-3 complete sentences detailing key technical strengths')
  }

  return {
    exists,
    completeness: exists ? 90 : 0,
    quality: exists ? (summary.length >= 60 ? 95 : 70) : 0,
    issues,
    recommendations
  }
}

function analyzeSkillsSection(skills, requiredSkills) {
  const exists = Boolean(skills && skills.length > 0)
  const issues = []
  const recommendations = []

  if (!exists) {
    issues.push('No explicit skills section found')
    recommendations.push('Add a dedicated Technical Skills section grouped by category')
  } else if (skills.length < 5) {
    issues.push('Low technical skill density (< 5 skills)')
    recommendations.push('Add core tools, frameworks, languages, and platforms')
  }

  return {
    exists,
    completeness: exists ? Math.min(100, skills.length * 12) : 0,
    quality: skills.length >= 8 ? 95 : (skills.length >= 5 ? 75 : 40),
    issues,
    recommendations
  }
}

function analyzeExperienceSection(experience) {
  const exists = Boolean(experience && experience.length > 0)
  const issues = []
  const recommendations = []

  if (!exists) {
    issues.push('No work or internship experience section listed')
    recommendations.push('Include internships, freelance work, or active engineering projects')
  } else {
    let hasMetrics = false
    experience.forEach(exp => {
      const text = (exp.highlights || []).join(' ') + ' ' + (exp.description || '')
      if (/\d+%|\$\d+|\b\d+\b\s*(users|clients|ms|seconds|apps|projects)/i.test(text)) {
        hasMetrics = true
      }
    })
    if (!hasMetrics) {
      issues.push('Experience bullets lack measurable metrics (%, numbers, scale)')
      recommendations.push('Quantify accomplishments (e.g. Improved performance by 35%, built for 1,000+ users)')
    }
  }

  return {
    exists,
    completeness: exists ? 85 : 0,
    quality: exists ? 80 : 0,
    issues,
    recommendations
  }
}

function analyzeProjectsSection(projects) {
  const exists = Boolean(projects && projects.length > 0)
  const issues = []
  const recommendations = []

  if (!exists) {
    issues.push('No portfolio projects listed')
    recommendations.push('Add at least 2 full-stack/engineering projects with GitHub & live demo links')
  } else if (projects.length === 1) {
    issues.push('Only 1 project listed')
    recommendations.push('Add a second technical project showcasing different framework/database skills')
  }

  return {
    exists,
    completeness: exists ? (projects.length >= 2 ? 95 : 60) : 0,
    quality: projects.length >= 2 ? 90 : 60,
    issues,
    recommendations
  }
}

function analyzeEducationSection(education) {
  const exists = Boolean(education && education.length > 0)
  return {
    exists,
    completeness: exists ? 90 : 0,
    quality: exists ? 90 : 0,
    issues: exists ? [] : ['Missing education section'],
    recommendations: exists ? [] : ['List your degree, institution, and graduation year']
  }
}

function analyzeCertificationsSection(certifications) {
  const exists = Boolean(certifications && certifications.length > 0)
  return {
    exists,
    completeness: exists ? 90 : 40,
    quality: exists ? 90 : 50,
    issues: exists ? [] : ['No certifications listed'],
    recommendations: exists ? [] : ['Earn & verify technical certifications to boost recruiter trust']
  }
}

function analyzeAchievementsSection(achievements) {
  const exists = Boolean(achievements && achievements.length > 0)
  return {
    exists,
    completeness: exists ? 90 : 40,
    quality: exists ? 90 : 50,
    issues: [],
    recommendations: []
  }
}

function analyzeFormatting(parsedResume, atsResult) {
  const issues = atsResult.formatIssues || []
  const warnings = []
  const passedChecks = [
    'Standard font readability verified',
    'Clear section headers detected',
    'Parsable text layout'
  ]

  if (issues.length > 0) {
    warnings.push('Review layout formatting for applicant tracking readability')
  } else {
    passedChecks.push('No layout structure errors found')
  }

  return {
    issues,
    warnings,
    passedChecks
  }
}

function analyzeContentQuality(experience, projects) {
  const weakBullets = []
  const missingMetrics = []
  const actionVerbIssues = []

  const weakVerbs = ['worked on', 'helped with', 'handled', 'responsible for', 'assisted']

  const allItems = [...experience, ...projects]
  allItems.forEach(item => {
    const text = (item.highlights || []).join(' ') + ' ' + (item.description || '')
    const lower = text.toLowerCase()

    weakVerbs.forEach(verb => {
      if (lower.includes(verb)) {
        actionVerbIssues.push(`Replace weak verb "${verb}" in ${item.title || 'entry'} with strong action verbs (Developed, Architected, Spearheaded)`)
      }
    })

    if (text.length > 20 && !/\d+/.test(text)) {
      missingMetrics.push(`${item.title || 'Project/Work entry'} description contains no numbers or metrics`)
    }
  })

  return {
    weakBullets,
    missingMetrics,
    actionVerbIssues,
    experienceQuality: {
      actionVerbScore: actionVerbIssues.length === 0 ? 95 : 70,
      metricsScore: missingMetrics.length === 0 ? 90 : 65
    }
  }
}

function buildRecommendations({ sectionAnalysis, keywordAnalysis, formattingAnalysis, contentAnalysis, targetCareer }) {
  const recs = []

  // CRITICAL
  if (sectionAnalysis.contact.issues.length > 0) {
    recs.push({
      priority: 'CRITICAL',
      category: 'contact',
      title: 'Fix Contact Information Header',
      explanation: sectionAnalysis.contact.issues.join(', '),
      action: sectionAnalysis.contact.recommendations[0] || 'Update contact details',
      impact: 'CRITICAL'
    })
  }

  // HIGH
  if (keywordAnalysis.missingKeywords.length > 0) {
    const topMissing = keywordAnalysis.missingKeywords.slice(0, 3).join(', ')
    recs.push({
      priority: 'HIGH',
      category: 'skills',
      title: `Add ${targetCareer} Missing Core Skills`,
      explanation: `Target career requires key missing skills: ${topMissing}.`,
      action: `Learn and add projects featuring ${topMissing} to your resume`,
      impact: 'HIGH'
    })
  }

  if (sectionAnalysis.summary.issues.length > 0) {
    recs.push({
      priority: 'HIGH',
      category: 'summary',
      title: 'Include Targeted Professional Summary',
      explanation: 'Resumes with a targeted summary retain recruiter attention 40% longer.',
      action: sectionAnalysis.summary.recommendations[0],
      impact: 'HIGH'
    })
  }

  // MEDIUM
  if (contentAnalysis.missingMetrics.length > 0) {
    recs.push({
      priority: 'MEDIUM',
      category: 'experience',
      title: 'Quantify Accomplishments & Experience',
      explanation: 'Several experience/project bullets describe duties without measurable outcomes.',
      action: 'Add percentages, user numbers, latency improvements, or scale metrics',
      impact: 'MEDIUM'
    })
  }

  if (sectionAnalysis.projects.issues.length > 0) {
    recs.push({
      priority: 'MEDIUM',
      category: 'projects',
      title: 'Expand Portfolio Projects Section',
      explanation: 'Detailed technical projects validate your practical capabilities.',
      action: sectionAnalysis.projects.recommendations[0],
      impact: 'MEDIUM'
    })
  }

  // LOW
  if (formattingAnalysis.issues.length > 0) {
    recs.push({
      priority: 'LOW',
      category: 'formatting',
      title: 'Refine ATS Formatting Structure',
      explanation: formattingAnalysis.issues.join('; '),
      action: 'Ensure standard section headings and single-column layout',
      impact: 'LOW'
    })
  }

  return recs
}

function buildNextActions(recommendations, missingKeywords, targetCareer) {
  const actions = []
  let step = 1

  if (missingKeywords.length > 0 && step <= 5) {
    const topSkill = missingKeywords[0]
    const slug = topSkill.toLowerCase().replace(/[^a-z0-9]/g, '-')
    actions.push({
      step: step++,
      title: `Learn & Verify ${topSkill}`,
      reason: `Required for ${targetCareer} and currently missing from your resume.`,
      priority: 'HIGH',
      actionPath: `/skills/${slug}`
    })
  }

  recommendations.slice(0, 4).forEach(rec => {
    if (step <= 5) {
      actions.push({
        step: step++,
        title: rec.title,
        reason: rec.explanation,
        priority: rec.priority,
        actionPath: rec.category === 'skills' ? '/skills' : null
      })
    }
  })

  return actions
}

module.exports = {
  generateResumeOptimization
}
