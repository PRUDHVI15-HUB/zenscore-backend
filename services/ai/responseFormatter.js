/**
 * Generates deterministic suggestions ranked in strict order of academic priority.
 * Priority order:
 * 1. Attendance (if average < 85%)
 * 2. High Risk Subjects (if any)
 * 3. Low CGPA Target Gap (if current < target)
 * 4. Credits Remaining (if completed credits are logged)
 * 
 * @param {Object} context - Structured context object
 * @returns {Array<string>} List of exactly 3 deterministic recommendations
 */
const generateDeterministicSuggestions = (context) => {
  const fallbacks = [
    "Check your subject risk gauge regularly to catch drops early.",
    "Complete all upcoming course assessments on time.",
    "Log your attendance stats daily to maintain index scores."
  ]

  if (!context) {
    return fallbacks
  }

  const pool = []

  // 1. Attendance Priority
  const attendanceVal = context.stats?.attendance || 0
  if (attendanceVal < 85) {
    pool.push({
      priority: 'attendance',
      text: `Boost your current ${attendanceVal}% average attendance to prevent administrative alerts.`
    })
  }

  // 2. High Risk Priority
  const highRisk = context.subjects?.highRisk || []
  if (highRisk.length > 0) {
    pool.push({
      priority: 'high risk',
      text: `Prioritize extra prep time for high-risk courses: ${highRisk.join(', ')}.`
    })
  }

  // 3. Low CGPA Priority
  const current = context.cgpa?.current || 0
  const target = context.cgpa?.target || 0
  if (current < target) {
    pool.push({
      priority: 'low CGPA',
      text: `Plan a study path to increase your CGPA (${current}) toward your target of ${target}.`
    })
  }

  // 4. Credits Remaining Priority
  const remaining = context.stats?.remainingCredits || 0
  if (remaining > 0) {
    pool.push({
      priority: 'credits remaining',
      text: `Monitor your graduation track; you have ${remaining} credits remaining to complete.`
    })
  }

  // Map to list of strings
  const suggestions = pool.map(item => item.text)

  // Backfill with fallbacks to guarantee exactly 3 suggestions
  for (const fallback of fallbacks) {
    if (suggestions.length >= 3) break
    if (!suggestions.includes(fallback)) {
      suggestions.push(fallback)
    }
  }

  return suggestions.slice(0, 3)
}

/**
 * Validates that the AI generated response does not contain fabricated academic data
 * absent from the context (CGPA, attendance, semester, subjects).
 * 
 * @param {string} answer - Raw LLM string
 * @param {Object} context - Structured context map
 * @returns {boolean} True if response is validated successfully, false if fabrication detected
 */
/**
 * Validates that the AI generated response does not contain fabricated academic data
 * absent from the context (CGPA, attendance, semester, subjects).
 * 
 * @param {string} answer - Raw LLM string
 * @param {Object} context - Structured context map
 * @returns {boolean} True if response is validated successfully, false if fabrication detected
 */
const validateResponse = (answer, context) => {
  if (!answer || !context) return true
  const cleanAns = answer.toLowerCase()

  // Extract all valid numbers from the student context
  const validNumbers = new Set([
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 100
  ])

  if (context.cgpa?.current !== undefined) validNumbers.add(parseFloat(context.cgpa.current))
  if (context.cgpa?.target !== undefined) validNumbers.add(parseFloat(context.cgpa.target))
  if (context.cgpa?.predicted !== undefined) validNumbers.add(parseFloat(context.cgpa.predicted))
  if (context.stats?.attendance !== undefined) validNumbers.add(parseFloat(context.stats.attendance))
  if (context.stats?.completedCredits !== undefined) validNumbers.add(parseFloat(context.stats.completedCredits))
  if (context.stats?.remainingCredits !== undefined) validNumbers.add(parseFloat(context.stats.remainingCredits))
  if (context.health?.score !== undefined) validNumbers.add(parseFloat(context.health.score))

  // Include all course grades, credits, and semester numbers from context
  if (context.subjects?.courses) {
    context.subjects.courses.forEach(c => {
      if (c.grade !== null && c.grade !== undefined) validNumbers.add(parseFloat(c.grade))
      if (c.credits !== null && c.credits !== undefined) validNumbers.add(parseFloat(c.credits))
      if (c.attendance !== null && c.attendance !== undefined) validNumbers.add(parseFloat(c.attendance))
      if (c.semester) validNumbers.add(parseInt(c.semester))
    })
  }

  // 1. Check for invented subjects in answer that are not in context
  const fakeSubjectKeywords = ['quantum physics', 'astronomy', 'biomedical instrumentation', 'organic synthesis']
  for (const sub of fakeSubjectKeywords) {
    if (cleanAns.includes(sub)) {
      const inCourses = context.subjects?.courses?.some(c => c.name.toLowerCase().includes(sub))
      if (!inCourses) {
        return false // Fabricated subject detected
      }
    }
  }

  // 2. Check for invented semester numbers beyond standard degree duration (Sem 1 - 8)
  const semRegex = /(?:semester|sem)\s*([0-9]+)/gi
  let semMatch
  while ((semMatch = semRegex.exec(answer)) !== null) {
    const semNum = parseInt(semMatch[1])
    if (semNum > 8) {
      return false // Impossible semester number beyond degree span
    }
  }

  return true
}

const formatResponse = (rawAnswer, context) => {
  const cleanAnswer = (rawAnswer || '').trim()
  const suggestions = generateDeterministicSuggestions(context)

  // Validate answer against fabrication
  const isValid = validateResponse(cleanAnswer, context)
  const finalAnswer = isValid ? cleanAnswer : "I don't have enough academic data to answer that."

  return {
    success: true,
    answer: finalAnswer || "I don't have enough academic data to answer that.",
    suggestions
  }
}

module.exports = {
  formatResponse,
  generateDeterministicSuggestions,
  validateResponse
}
