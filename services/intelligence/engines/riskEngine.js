/**
 * Upgraded Rule-Based Subject Risk Score Engine.
 * Evaluates individual subject metrics (attendance, grades, credit weights)
 * to output risk classifications, scores, and explainable reasons.
 *
 * Formulas:
 * - Ra = 100 if attendance < 75; 100*(85 - a)/10 if 75 <= a <= 85; 0 if a > 85.
 * - Rg = 100 if g < 6.0; 100*(8.5 - g)/2.5 if 6.0 <= g < 8.5; 0 if g >= 8.5.
 * - Rc = min(100, 100*credits/6).
 * - Overall Risk = min(100, max(0, 0.40*Ra + 0.40*Rg + 0.20*Rc)).
 */

const computeAttendanceRisk = (attendance) => {
  const a = attendance !== undefined && attendance !== null ? attendance : 100
  if (a < 75) return 100
  if (a <= 85) return Math.min(100, Math.max(0, (100 * (85 - a)) / 10))
  return 0
}

const computeGradeRisk = (grade) => {
  const g = grade !== undefined && grade !== null ? grade : 0
  if (g < 6.0) return 100
  if (g < 8.5) return Math.min(100, Math.max(0, (100 * (8.5 - g)) / 2.5))
  return 0
}

const computeCreditRisk = (credits) => {
  const c = credits || 3
  return Math.min(100, Math.max(0, (100 * c) / 6))
}

/**
 * @param {Array<Object>} subjects - List of all subjects across semesters
 * @returns {Array<Object>} List of subject risk objects
 */
const calculateRisk = (subjects = []) => {
  return subjects.map(sub => {
    const reasons = []

    // 1. Attendance Risk (40% weight)
    const attendance = sub.attendance !== undefined && sub.attendance !== null ? sub.attendance : 100
    const attendanceRisk = computeAttendanceRisk(attendance)
    if (attendance < 75) {
      reasons.push('Attendance below 75%')
    } else if (attendance < 85) {
      reasons.push('Attendance below 85%')
    }

    // 2. Grade Risk (40% weight)
    const grade = sub.finalGrade !== undefined && sub.finalGrade !== null ? sub.finalGrade : 0
    const gradeRisk = computeGradeRisk(grade)
    if (grade < 6.0) {
      reasons.push('Grade below 6')
    } else if (grade < 8.5) {
      reasons.push('Grade below 8.5')
    }

    // 3. Credit Risk (20% weight)
    const credits = sub.credits !== undefined && sub.credits !== null ? sub.credits : 3
    const creditRisk = computeCreditRisk(credits)

    // Compute overall weighted risk score strictly clamped to [0, 100]
    const rawScore = (0.40 * attendanceRisk) + (0.40 * gradeRisk) + (0.20 * creditRisk)
    const clampedScore = Math.min(100, Math.max(0, rawScore))
    const score = Math.round(clampedScore)

    // Classify risk status level and color mapping
    let level = 'LOW'
    let color = 'green'
    if (score >= 70) {
      level = 'HIGH'
      color = 'red'
    } else if (score >= 35) {
      level = 'MEDIUM'
      color = 'yellow'
    }

    return {
      subjectId: String(sub._id || sub.id || ''),
      subject: sub.name || '',
      score,
      level,
      color,
      reasons
    }
  })
}

module.exports = {
  calculateRisk,
  computeAttendanceRisk,
  computeGradeRisk,
  computeCreditRisk
}
