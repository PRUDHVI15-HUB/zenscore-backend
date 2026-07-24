/**
 * Subject Confidence Scorer
 *
 * Computes a per-subject confidence score (0–100) based on
 * extraction quality signals. Only subjects below CONFIDENCE_THRESHOLD
 * are sent to Groq for field-level verification.
 */
const { CONFIDENCE_THRESHOLD, PASS_GRADE_THRESHOLD } = require('./utils/constants')

/**
 * Computes a confidence score for a single parsed subject.
 *
 * @param {Object} subject - Parsed subject object
 * @param {Object} [ctx={}] - Parsing context flags from ruleParser
 * @returns {number} Confidence score 0–100
 */
const scoreSubject = (subject, ctx = {}) => {
  let score = 0

  // --- Positive signals ---

  // Course code present and non-empty (+30)
  if (subject.code && subject.code.length >= 4) {
    score += 30
  }

  // Grade (point or letter) found and mapped (+25)
  if ((ctx.gradePointFound || ctx.gradeLetterFound) && subject.finalGrade !== null && subject.finalGrade !== undefined) {
    score += 25
  } else if (subject.rawGrade || subject.finalGrade !== null) {
    score += 15
  }

  // Credits parsed to a valid integer (+25)
  if (subject.credits !== null && Number.isInteger(subject.credits) && subject.credits >= 0 && subject.credits <= 6) {
    score += 25
  }

  // Subject name quality (+17 for 3+ words, +12 for 2 words, +8 for 1 word)
  const nameWords = subject.name ? subject.name.trim().split(/\s+/).filter(w => w.length > 0) : []
  if (nameWords.length >= 3) {
    score += 17
  } else if (nameWords.length >= 2) {
    score += 12
  } else if (nameWords.length >= 1) {
    score += 8
  }

  // --- Deductions ---
  if (ctx.usedCreditHeuristic) {
    score -= 5
  }
  if (ctx.usedFuzzyCredit) {
    score -= 3
  }
  if (ctx.usedNameFragment) {
    score -= 2
  }
  if (subject.name && subject.name.trim().length < 3) {
    score -= 10
  }

  return Math.max(0, Math.min(100, score))
}

/**
 * Computes the overall pipeline confidence as a mean of subject scores.
 *
 * @param {Array<Object>} subjects - Array of subjects with .confidence field set
 * @returns {number} Overall confidence 0–100
 */
const computeOverallConfidence = (subjects) => {
  if (!subjects || subjects.length === 0) return 0
  const total = subjects.reduce((sum, s) => sum + (s.confidence || 0), 0)
  return Math.round(total / subjects.length)
}

/**
 * Splits subjects into high-confidence and low-confidence groups.
 *
 * @param {Array<Object>} subjects
 * @returns {{ highConfidence: Object[], lowConfidence: Object[] }}
 */
const partitionByConfidence = (subjects) => {
  const highConfidence = subjects.filter(s => (s.confidence || 0) >= CONFIDENCE_THRESHOLD)
  const lowConfidence  = subjects.filter(s => (s.confidence || 0) <  CONFIDENCE_THRESHOLD)
  return { highConfidence, lowConfidence }
}

/**
 * Adds a `result` field ("PASS" | "FAIL") to each subject based on finalGrade.
 *
 * @param {Array<Object>} subjects
 * @returns {Array<Object>} Subjects with result field added
 */
const addResultFlags = (subjects) => {
  return subjects.map(sub => ({
    ...sub,
    result: (sub.finalGrade !== null && sub.finalGrade >= PASS_GRADE_THRESHOLD) ? 'PASS' : 'FAIL'
  }))
}

module.exports = {
  scoreSubject,
  computeOverallConfidence,
  partitionByConfidence,
  addResultFlags,
  CONFIDENCE_THRESHOLD
}
