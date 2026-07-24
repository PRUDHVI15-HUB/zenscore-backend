/**
 * Shared academic GPA calculation utilities.
 * Calculates SGPA (Semester Grade Point Average) and CGPA (Cumulative Grade Point Average).
 */

/**
 * Calculates SGPA for a semester using credit weights.
 * Formula: SGPA = Σ(finalGrade × credits) / Σ(credits)
 * @param {Array} subjects - List of subjects in a semester
 * @returns {Number} Calculated SGPA (rounded to 2 decimals)
 */
const calculateSGPA = (subjects) => {
  if (!subjects || subjects.length === 0) return 0
  let totalGradePoints = 0
  let totalCredits = 0

  subjects.forEach(sub => {
    totalGradePoints += (sub.finalGrade || 0) * (sub.credits || 0)
    totalCredits += (sub.credits || 0)
  })

  return totalCredits > 0 ? parseFloat((totalGradePoints / totalCredits).toFixed(2)) : 0
}

/**
 * Calculates CGPA across all semesters using credit weights.
 * Formula: CGPA = Σ(all semester grade points) / Σ(all semester credits)
 * @param {Array} semesters - List of semesters in the academic record
 * @returns {Number} Calculated CGPA (rounded to 2 decimals)
 */
const calculateCGPA = (semesters) => {
  if (!semesters || semesters.length === 0) return 0
  let totalGradePoints = 0
  let totalCredits = 0

  semesters.forEach(sem => {
    if (sem.subjects && sem.subjects.length > 0) {
      sem.subjects.forEach(sub => {
        totalGradePoints += (sub.finalGrade || 0) * (sub.credits || 0)
        totalCredits += (sub.credits || 0)
      })
    }
  })

  return totalCredits > 0 ? parseFloat((totalGradePoints / totalCredits).toFixed(2)) : 0
}

module.exports = {
  calculateSGPA,
  calculateCGPA
}
