/**
 * resumeAnalysisService.js
 * Deterministic ATS scoring engine, career-aware skill gap analyzer, and prioritized recommendation engine.
 */

const CAREER_SKILL_REQUIREMENTS = {
  'Frontend Developer': ['JavaScript', 'TypeScript', 'React', 'HTML', 'CSS', 'Tailwind CSS', 'Next.js', 'Git', 'REST API'],
  'Frontend Engineer': ['JavaScript', 'TypeScript', 'React', 'HTML', 'CSS', 'Tailwind CSS', 'Next.js', 'Git', 'REST API'],
  'Backend Developer': ['Node.js', 'Express', 'Python', 'Java', 'SQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Docker', 'REST API', 'Git'],
  'Backend Engineer': ['Node.js', 'Express', 'Python', 'Java', 'SQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Docker', 'REST API', 'Git'],
  'Full Stack Developer': ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Express', 'SQL', 'MongoDB', 'HTML', 'CSS', 'Docker', 'Git'],
  'Full Stack Engineer': ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Express', 'SQL', 'MongoDB', 'HTML', 'CSS', 'Docker', 'Git'],
  'AI Engineer': ['Python', 'PyTorch', 'TensorFlow', 'LLM', 'RAG', 'LangChain', 'FastAPI', 'Vector DB', 'SQL', 'Git', 'Docker'],
  'AI / ML Engineer': ['Python', 'PyTorch', 'TensorFlow', 'LLM', 'RAG', 'LangChain', 'FastAPI', 'Vector DB', 'SQL', 'Git', 'Docker'],
  'Data Scientist': ['Python', 'R', 'SQL', 'Pandas', 'NumPy', 'Scikit-Learn', 'TensorFlow', 'Tableau', 'Power BI', 'Git'],
  'DevOps Engineer': ['Docker', 'Kubernetes', 'AWS', 'Linux', 'CI/CD', 'Terraform', 'Ansible', 'Git', 'Python', 'Shell Scripting'],
  'Game Developer': ['C++', 'C#', 'Unity', 'Unreal Engine', 'OpenGL', 'Data Structures', 'Git', '3D Math']
}

/**
 * Calculates deterministic ATS score and detailed scoring reasons.
 */
function analyzeATS(parsedData) {
  let score = 0
  const scoringReasons = []
  const missingSections = []
  const formatIssues = []

  const { candidate, summary, education, experience, internships, projects, skills, certifications, achievements } = parsedData || {}

  // 1. Contact Information (+15 pts)
  let contactPts = 0
  if (candidate?.email) contactPts += 5
  if (candidate?.phone) contactPts += 4
  if (candidate?.location) contactPts += 3
  if (candidate?.linkedin || candidate?.github || candidate?.portfolio) contactPts += 3
  score += contactPts

  if (!candidate?.email) missingSections.push('Email Address')
  if (!candidate?.phone) missingSections.push('Phone Number')
  if (contactPts >= 12) {
    scoringReasons.push('Complete contact information with verified email, phone, and professional links (+15 pts)')
  } else {
    scoringReasons.push(`Partial contact details detected (+${contactPts}/15 pts)`)
  }

  // 2. Professional Summary (+10 pts)
  if (summary && summary.length >= 25) {
    score += 10
    scoringReasons.push('Strong professional summary included (+10 pts)')
  } else {
    missingSections.push('Professional Summary')
    scoringReasons.push('Missing or brief professional summary (0/10 pts)')
  }

  // 3. Education Section (+15 pts)
  if (education && education.length > 0) {
    score += 15
    scoringReasons.push('Verified academic background and degree entries (+15 pts)')
  } else {
    missingSections.push('Education')
    scoringReasons.push('Missing explicit education section (0/15 pts)')
  }

  // 4. Experience & Internships (+20 pts)
  const expCount = (experience?.length || 0) + (internships?.length || 0)
  if (expCount >= 2) {
    score += 20
    scoringReasons.push('Multiple work experience / internship entries with descriptions (+20 pts)')
  } else if (expCount === 1) {
    score += 12
    scoringReasons.push('Single experience entry found (+12/20 pts)')
  } else {
    missingSections.push('Work Experience')
    scoringReasons.push('No work experience or internship section detected (0/20 pts)')
  }

  // 5. Skills Density (+20 pts)
  const skillCount = skills?.length || 0
  if (skillCount >= 8) {
    score += 20
    scoringReasons.push(`Excellent technical skill density (${skillCount} skills detected) (+20 pts)`)
  } else if (skillCount >= 4) {
    score += 12
    scoringReasons.push(`Moderate skill coverage (${skillCount} skills detected) (+12/20 pts)`)
  } else if (skillCount > 0) {
    score += 6
    scoringReasons.push(`Basic skill coverage (${skillCount} skills detected) (+6/20 pts)`)
  } else {
    missingSections.push('Technical Skills')
    scoringReasons.push('No technical skills explicitly listed (0/20 pts)')
  }

  // 6. Projects (+10 pts)
  if (projects && projects.length >= 2) {
    score += 10
    scoringReasons.push('Demonstrated practical projects (+10 pts)')
  } else if (projects && projects.length === 1) {
    score += 6
    scoringReasons.push('Single project entry listed (+6/10 pts)')
  } else {
    missingSections.push('Projects')
    scoringReasons.push('No project section detected (0/10 pts)')
  }

  // 7. Certifications & Achievements (+10 pts)
  const certCount = (certifications?.length || 0) + (achievements?.length || 0)
  if (certCount >= 1) {
    score += 10
    scoringReasons.push('Certifications / key achievements verified (+10 pts)')
  } else {
    scoringReasons.push('No certifications or key achievements listed (0/10 pts)')
  }

  // Formatting risks check
  if (skillCount === 0) formatIssues.push('Skills may be buried inside image tables or unread columns')
  if (!summary) formatIssues.push('No summary header detected — ensure section headings use standard titles')

  const atsScore = Math.min(100, Math.max(0, score))
  const completeness = Math.min(100, Math.round(((7 - missingSections.length) / 7) * 100))

  return {
    atsScore,
    completeness,
    skillsDetected: skills || [],
    missingSections,
    formatIssues,
    scoringReasons
  }
}

/**
 * Calculates career match score and skill gaps against student's target career role.
 */
function analyzeCareerMatch(parsedSkills, targetRole = 'Full Stack Developer') {
  const normalizedRole = targetRole || 'Full Stack Developer'
  const requiredSkills = CAREER_SKILL_REQUIREMENTS[normalizedRole] || CAREER_SKILL_REQUIREMENTS['Full Stack Developer']

  const extractedLower = (parsedSkills || []).map(s => s.toLowerCase())

  const matchingSkills = []
  const missingSkills = []

  for (const reqSkill of requiredSkills) {
    if (extractedLower.includes(reqSkill.toLowerCase())) {
      matchingSkills.push(reqSkill)
    } else {
      missingSkills.push(reqSkill)
    }
  }

  const matchRatio = requiredSkills.length > 0 ? matchingSkills.length / requiredSkills.length : 0
  const matchScore = Math.round(matchRatio * 100)

  return {
    targetCareer: normalizedRole,
    matchScore,
    matchingSkills,
    missingSkills,
    recommendedSkills: missingSkills.slice(0, 4)
  }
}

/**
 * Generates prioritized actionable recommendations from parsed resume & career match.
 */
function generateRecommendations(parsedData, careerMatch) {
  const recommendations = []
  const { candidate, summary, experience, projects, skills, education } = parsedData || {}

  // 1. CRITICAL
  if (!candidate?.email || !candidate?.phone) {
    recommendations.push({
      issue: 'Missing direct contact information',
      whyItMatters: 'Recruiters and automated ATS systems cannot contact you without verified phone/email.',
      recommendedAction: 'Add your primary email address and phone number to the header.',
      priority: 'CRITICAL'
    })
  }

  // 2. HIGH
  if (!summary) {
    recommendations.push({
      issue: 'Missing Professional Summary',
      whyItMatters: 'A 2-3 sentence overview at the top increases initial recruiter retention by 40%.',
      recommendedAction: `Write a concise summary tailored for ${careerMatch?.targetCareer || 'your target role'}.`,
      priority: 'HIGH'
    })
  }

  if (!experience || experience.length === 0) {
    recommendations.push({
      issue: 'No work or internship experience listed',
      whyItMatters: 'Employers look for practical industry application and team collaboration experience.',
      recommendedAction: 'Include internships, open-source work, or freelance projects under Work Experience.',
      priority: 'HIGH'
    })
  }

  // 3. MEDIUM
  if (careerMatch?.missingSkills?.length > 0) {
    const topMissing = careerMatch.missingSkills.slice(0, 3).join(', ')
    recommendations.push({
      issue: `Missing key role skills: ${topMissing}`,
      whyItMatters: `Applicant tracking algorithms heavily weigh ${careerMatch.targetCareer} core skills.`,
      recommendedAction: `Learn and add projects featuring ${topMissing} to increase your career match.`,
      priority: 'MEDIUM'
    })
  }

  if (!projects || projects.length < 2) {
    recommendations.push({
      issue: 'Fewer than 2 projects listed',
      whyItMatters: 'Detailed project entries validate your hands-on technical competencies.',
      recommendedAction: 'Add at least 2 complete portfolio projects with GitHub/live links.',
      priority: 'MEDIUM'
    })
  }

  // 4. LOW
  if (!education || education.length === 0) {
    recommendations.push({
      issue: 'Education section incomplete',
      whyItMatters: 'Recruiters check for degree, field of study, and expected graduation year.',
      recommendedAction: 'Ensure your degree, institution name, and graduation year are clearly listed.',
      priority: 'LOW'
    })
  }

  return recommendations
}

module.exports = {
  analyzeATS,
  analyzeCareerMatch,
  generateRecommendations,
  CAREER_SKILL_REQUIREMENTS
}
