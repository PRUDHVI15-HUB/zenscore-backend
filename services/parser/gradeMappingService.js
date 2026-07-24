// Centralized Immutable Mappings Registry
const LETTER_GRADE_MAP = Object.freeze({
  'O': 10.0,
  'S': 10.0,
  'A+': 9.0,
  'A': 8.0,
  'B+': 7.0,
  'B': 6.0,
  'C': 5.0,
  'P': 4.0,
  'F': 0.0
})

/**
 * Strips all whitespaces, converts to uppercase, and cleans raw input strings.
 * E.g., "a+" -> "A+", "A + " -> "A+".
 * @param {string} rawGrade - Raw grade input
 * @returns {string} Cleaned normalized string
 */
const cleanGrade = (rawGrade) => {
  if (rawGrade === undefined || rawGrade === null) return ''
  return String(rawGrade)
    .toUpperCase()
    .replace(/\s+/g, '')
    .trim()
}

/**
 * Checks letter grade mappings.
 * @param {string} gradeStr - Cleaned grade string
 * @returns {Object|null} Mapped GPA and source tag
 */
const mapLetterGrade = (gradeStr) => {
  return LETTER_GRADE_MAP[gradeStr] !== undefined
    ? { finalGrade: LETTER_GRADE_MAP[gradeStr], source: 'LETTER' }
    : null
}

/**
 * Mappings for percentage scales (e.g. 85% -> 8.5).
 * @param {string} gradeStr - Cleaned grade string
 * @returns {Object|null} Mapped GPA and source tag
 */
const mapPercentage = (gradeStr) => {
  const match = gradeStr.match(/^(\d+(?:\.\d+)?)\s*%$/)
  if (!match) return null

  const percentage = parseFloat(match[1])
  if (isNaN(percentage) || percentage < 0 || percentage > 100) {
    return null
  }

  return {
    finalGrade: parseFloat((percentage / 10).toFixed(2)),
    source: 'PERCENTAGE'
  }
}

/**
 * Mappings for fraction scores (e.g. 540/600 -> 9.0).
 * @param {string} gradeStr - Cleaned grade string
 * @returns {Object|null} Mapped GPA and source tag
 */
const mapFraction = (gradeStr) => {
  const match = gradeStr.match(/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/)
  if (!match) return null

  const obtained = parseFloat(match[1])
  const max = parseFloat(match[2])

  if (isNaN(obtained) || isNaN(max) || max <= 0 || obtained < 0 || obtained > max) {
    return null
  }

  return {
    finalGrade: parseFloat(((obtained / max) * 10).toFixed(2)),
    source: 'FRACTION'
  }
}

/**
 * Validates and limits numeric GPA values (0.00 - 10.00).
 * @param {string} gradeStr - Cleaned grade string
 * @returns {Object|null} Mapped GPA and source tag
 */
const mapNumeric = (gradeStr) => {
  if (!/^\d+(?:\.\d+)?$/.test(gradeStr)) {
    return null
  }

  const score = parseFloat(gradeStr)
  if (isNaN(score) || score < 0 || score > 10) {
    return null
  }

  return {
    finalGrade: parseFloat(score.toFixed(2)),
    source: 'NUMERIC'
  }
}

/**
 * Normalizes any rawGrade string using letter, percent, fraction, or decimal tests.
 * @param {string} rawGrade - Input raw grade
 * @returns {Object} Standardized finalGrade and source tag
 */
const normalizeGrade = (rawGrade) => {
  const cleaned = cleanGrade(rawGrade)
  if (!cleaned) {
    return { finalGrade: null, source: 'UNKNOWN' }
  }

  // 1. Check letter grades registry
  const letterVal = mapLetterGrade(cleaned)
  if (letterVal !== null) return letterVal

  // 2. Check percentage scales
  const percentageVal = mapPercentage(cleaned)
  if (percentageVal !== null) return percentageVal

  // 3. Check fraction parameters
  const fractionVal = mapFraction(cleaned)
  if (fractionVal !== null) return fractionVal

  // 4. Validate decimal GPAs
  const numericVal = mapNumeric(cleaned)
  if (numericVal !== null) return numericVal

  return { finalGrade: null, source: 'UNKNOWN' }
}

/**
 * Main Grade Mapping Service Entry.
 * Clones, checks validation rules, maps grades, and sets gradeSource.
 * @param {Object} sharedContract - Pipeline shared object
 * @returns {Object} Mapped data contract
 */
const mapGrades = (sharedContract) => {
  if (!sharedContract) return null

  // Enforce pipeline immutability (always clone)
  const contract = JSON.parse(JSON.stringify(sharedContract))

  if (contract.subjects && Array.isArray(contract.subjects)) {
    contract.subjects.forEach(sub => {
      // Skip mapping if finalGrade already exists and is valid
      const existingGrade = parseFloat(sub.finalGrade)
      const hasValidGrade = !isNaN(existingGrade) && existingGrade >= 0 && existingGrade <= 10

      if (hasValidGrade) {
        sub.finalGrade = parseFloat(existingGrade.toFixed(2))
        if (!sub.gradeSource) {
          sub.gradeSource = 'NUMERIC'
        }
        return
      }

      // Normalize rawGrade
      const { finalGrade, source } = normalizeGrade(sub.rawGrade)
      sub.finalGrade = finalGrade
      sub.gradeSource = source
    })
  }

  return contract
}

module.exports = {
  mapGrades,
  normalizeGrade,
  cleanGrade,
  LETTER_GRADE_MAP
}
