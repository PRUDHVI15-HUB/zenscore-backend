let idCounter = 1

/**
 * Resets the factory's subject ID counter (useful for unit test runs).
 */
const resetIdCounter = () => {
  idCounter = 1
}

/**
 * Normalizes subject names (trims, collapses multiple spaces, removes trailing punctuation).
 * Does not title-case, uppercase, or rename.
 */
const normalizeSubjectName = (name) => {
  if (!name) return ''
  return name
    .replace(/\s+/g, ' ')
    .replace(/[:\-\,\.\/]+$/, '')
    .trim()
}

/**
 * Unified subject object instantiation.
 * Generates temporary subject IDs, preserves rawCredit strings, and duplicate assertions.
 */
const createSubject = ({ 
  name, 
  rawCredits, 
  rawGrade, 
  duplicate = false, 
  duplicateGroup = null, 
  confidence = 100, 
  originalLine = "" 
}) => {
  const cleanName = normalizeSubjectName(name)
  const id = `subject_${idCounter++}`
  
  let credits = null
  if (rawCredits !== undefined && rawCredits !== null) {
    const parsed = parseFloat(rawCredits)
    if (!isNaN(parsed)) {
      credits = parsed
    }
  }

  return {
    id,
    name: cleanName,
    rawCredits: rawCredits ? String(rawCredits).trim() : null,
    credits,
    rawGrade: rawGrade ? String(rawGrade).trim() : '',
    finalGrade: null,
    duplicate,
    duplicateGroup,
    confidence: typeof confidence === 'number' ? confidence : 100,
    originalLine: originalLine ? String(originalLine).trim() : ""
  }
}

module.exports = {
  createSubject,
  resetIdCounter,
  normalizeSubjectName
}
