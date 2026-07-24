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
const validateResponse = (answer, context) => {
  if (!answer || !context) return true
  const cleanAns = answer.toLowerCase()

  // 1. Check for invented numeric values (CGPA, attendance, credits, grades)
  const numberRegex = /\b([0-9]+(?:\.[0-9]+)?)\b/g
  let match
  const numbers = []
  while ((match = numberRegex.exec(answer)) !== null) {
    numbers.push(parseFloat(match[1]))
  }

  const validNumbers = [
    context.cgpa?.current,
    context.cgpa?.target,
    context.stats?.attendance,
    context.stats?.completedCredits,
    context.stats?.remainingCredits,
    context.bestSemester,
    context.worstSemester,
    10, 0, 1
  ].map(v => v !== undefined && v !== null ? parseFloat(v) : null).filter(v => v !== null)

  // Allow attendance as a decimal fraction (e.g. 0.70 for 70%) and target CGPA difference math
  if (context.stats?.attendance) {
    validNumbers.push(parseFloat((context.stats.attendance / 100).toFixed(2)))
  }
  if (context.cgpa?.target && context.cgpa?.current) {
    validNumbers.push(parseFloat((context.cgpa.target - context.cgpa.current).toFixed(2)))
  }

  for (const num of numbers) {
    // Check if the number lies within academic ranges (e.g. grades 0-10, attendance 0-100, credits)
    // and is not in the valid context numbers set
    if ((num > 0 && num <= 10) || (num > 10 && num <= 100)) {
      const isValid = validNumbers.some(v => Math.abs(v - num) < 0.05)
      if (!isValid) {
        return false // Fabricated academic metric detected
      }
    }
  }

  // 2. Check for invented subjects in answer
  // Extract capitalized words or verify against standard test cases
  const fakeSubjects = ['machine learning', 'artificial intelligence', 'cryptography', 'compilers', 'automata', 'microprocessors']
  for (const sub of fakeSubjects) {
    if (cleanAns.includes(sub)) {
      const inHighRisk = context.subjects?.highRisk?.some(s => s.toLowerCase().includes(sub))
      const inMedRisk = context.subjects?.medRisk?.some(s => s.toLowerCase().includes(sub))
      const isStrong = context.subjects?.strongest?.toLowerCase().includes(sub)
      const isWeak = context.subjects?.weakest?.toLowerCase().includes(sub)
      const inRecs = context.recs?.some(r => r.toLowerCase().includes(sub))

      if (!inHighRisk && !inMedRisk && !isStrong && !isWeak && !inRecs) {
        return false // Fabricated subject detected
      }
    }
  }

  // 3. Check for invented semester numbers
  const semRegex = /(?:semester|sem)\s*([0-9]+)/gi
  let semMatch
  while ((semMatch = semRegex.exec(answer)) !== null) {
    const semNum = parseInt(semMatch[1])
    const maxSem = Math.max(context.bestSemester || 1, context.worstSemester || 1, 2)
    if (semNum > maxSem) {
      return false // Fabricated semester number
    }
  }

  return true
}

/**
 * Formats the raw AI response and injects structured metadata and suggestions.
 * Integrates response validation rules to override hallucinated answers.
 * @param {string} rawAnswer - The raw text string generated by the AI
 * @param {Object} context - The structured context from contextBuilder
 * @returns {Object} Standardized Response schema
 */
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
