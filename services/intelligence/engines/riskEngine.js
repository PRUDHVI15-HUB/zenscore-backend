/**
 * Upgraded Rule-Based Subject Risk Score Engine.
 * Evaluates individual subject metrics (attendance, grades, credit weights)
 * to output risk classifications, scores, and explainable reasons.
 *
 * Formulas:
 * - Attendance Risk (40%): 0 if >= 85%, 100 if < 75%, scaled between.
 * - Grade Risk (40%): 0 if >= 8.5, 100 if < 6.0, scaled between.
 * - Credit Risk (20%): (credits / 6) * 100.
 *
 * @param {Array<Object>} subjects - List of all subjects across semesters
 * @returns {Array<Object>} List of subject risk objects
 */
const calculateRisk = (subjects = []) => {
  return subjects.map(sub => {
    const reasons = []

    // 1. Attendance Risk (40% weight)
    const attendance = sub.attendance !== undefined && sub.attendance !== null ? sub.attendance : 100
    let attendanceRisk = 0
    if (attendance < 75) {
      attendanceRisk = 100
      reasons.push('Attendance below 75%')
    } else if (attendance < 85) {
      attendanceRisk = ((85 - attendance) / 10) * 100
      reasons.push('Attendance below 85%')
    }

    // 2. Grade Risk (40% weight)
    const grade = sub.finalGrade !== undefined && sub.finalGrade !== null ? sub.finalGrade : 0
    let gradeRisk = 0
    if (grade < 6.0) {
      gradeRisk = 100
      reasons.push('Grade below 6')
    } else if (grade < 8.5) {
      gradeRisk = ((8.5 - grade) / 2.5) * 100
      reasons.push('Grade below 8.5')
    }

    // 3. Credit Risk (20% weight)
    const credits = sub.credits || 3
    const creditRisk = (credits / 6) * 100

    // Compute overall weighted risk score
    const rawScore = (0.40 * attendanceRisk) + (0.40 * gradeRisk) + (0.20 * creditRisk)
    const score = Math.round(rawScore)

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
  calculateRisk
}
