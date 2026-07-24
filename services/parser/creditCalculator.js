/**
 * Credit Calculator
 * Computes semester-level academic summary from the parsed subjects array.
 *
 * Calculates: totalCredits, earnedCredits, failedCredits,
 * passedSubjects, failedSubjects, semesterStatus, completionPercent,
 * sgpa, and cgpa.
 */
const { PASS_GRADE_THRESHOLD } = require('./utils/constants')
const { calculateSGPA } = require('../../utils/gpaUtils')

/**
 * Calculates semester credit summary from an array of parsed subjects.
 *
 * @param {Object[]} subjects - Parsed subject objects with credits and finalGrade
 * @param {string} [rawText] - Optional raw extracted text for SGPA/CGPA extraction
 * @returns {{
 *   totalCredits: number,
 *   earnedCredits: number,
 *   failedCredits: number,
 *   passedSubjects: number,
 *   failedSubjects: number,
 *   semesterStatus: string,
 *   completionPercent: number,
 *   sgpa: number|null,
 *   cgpa: number|null
 * }}
 */
const calculateCredits = (subjects, rawText = '') => {
  if (!subjects || subjects.length === 0) {
    return {
      totalCredits: 0,
      earnedCredits: 0,
      failedCredits: 0,
      passedSubjects: 0,
      failedSubjects: 0,
      semesterStatus: 'Unknown',
      completionPercent: 0,
      sgpa: null,
      cgpa: null
    }
  }

  let totalCredits = 0
  let earnedCredits = 0
  let failedCredits = 0
  let passedSubjects = 0
  let failedSubjects = 0

  subjects.forEach(sub => {
    const credits = typeof sub.credits === 'number' && !isNaN(sub.credits) ? sub.credits : 0
    const grade   = typeof sub.finalGrade === 'number' ? sub.finalGrade : -1

    totalCredits += credits

    const isPassed = grade >= PASS_GRADE_THRESHOLD
    const isFailed = grade >= 0 && grade < PASS_GRADE_THRESHOLD

    if (isPassed) {
      earnedCredits += credits
      passedSubjects++
    } else if (isFailed) {
      failedCredits += credits
      failedSubjects++
    }
  })

  // Semester status determination
  let semesterStatus
  if (failedSubjects === 0 && passedSubjects === subjects.length) {
    semesterStatus = 'Completed'
  } else if (failedSubjects > 0 && passedSubjects > 0) {
    semesterStatus = 'Partial'
  } else if (failedSubjects === subjects.length) {
    semesterStatus = 'Failed'
  } else {
    semesterStatus = 'Unknown'
  }

  const completionPercent = totalCredits > 0
    ? Math.round((earnedCredits / totalCredits) * 100)
    : 0

  // SGPA computation
  let sgpa = calculateSGPA(subjects)
  let cgpa = null

  // Raw text extraction overrides / supplements
  if (rawText && typeof rawText === 'string') {
    const sgpaMatch = rawText.match(/(?:sgpa|semester\s*grade\s*point\s*average)[^0-9\n]*([0-9]+\.[0-9]+)/i)
    if (sgpaMatch) {
      const parsedSgpa = parseFloat(sgpaMatch[1])
      if (!isNaN(parsedSgpa) && parsedSgpa >= 0 && parsedSgpa <= 10) {
        sgpa = parsedSgpa
      }
    }

    const cgpaMatch = rawText.match(/(?:cgpa|cumulative\s*grade\s*point\s*average)[^0-9\n]*([0-9]+\.[0-9]+)/i)
    if (cgpaMatch) {
      const parsedCgpa = parseFloat(cgpaMatch[1])
      if (!isNaN(parsedCgpa) && parsedCgpa >= 0 && parsedCgpa <= 10) {
        cgpa = parsedCgpa
      }
    }
  }

  return {
    totalCredits,
    earnedCredits,
    failedCredits,
    passedSubjects,
    failedSubjects,
    semesterStatus,
    completionPercent,
    sgpa,
    cgpa
  }
}

module.exports = {
  calculateCredits
}
