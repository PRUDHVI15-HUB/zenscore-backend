/**
 * predictionEngine.js
 * Deterministic, on-demand CGPA & Next Semester prediction engine for ZenScore AI.
 *
 * Design contract:
 *  - NEVER stores results — always calculates from live AcademicRecord data
 *  - Uses DEFAULT_TOTAL_DEGREE_CREDITS (configurable, default 160)
 *  - Returns null when data insufficient (new user with 0 memos)
 *  - Computes upcoming semester forecast and required SGPA if target is set
 */

const { calculateCGPA } = require('../../../utils/gpaUtils')
const { DEFAULT_TOTAL_DEGREE_CREDITS } = require('../../../constants/academicConstants')

const countDataRichSemesters = (semesters) => {
  if (!Array.isArray(semesters)) return 0
  return semesters.filter(sem =>
    Array.isArray(sem.subjects) &&
    sem.subjects.some(s => s.finalGrade != null && (s.credits || 0) > 0)
  ).length
}

const sumCompletedCredits = (semesters) => {
  if (!Array.isArray(semesters)) return 0
  let total = 0
  semesters.forEach(sem => {
    if (Array.isArray(sem.subjects)) {
      sem.subjects.forEach(sub => { total += (sub.credits || 0) })
    }
  })
  return total
}

const recentSGPAAverage = (semesters, n) => {
  const count = n || 2
  if (!Array.isArray(semesters) || semesters.length === 0) return null
  const sorted = semesters
    .filter(sem => (sem.sgpa || 0) > 0)
    .sort((a, b) => a.semesterNumber - b.semesterNumber)
  if (sorted.length === 0) return null
  const recent = sorted.slice(-count)
  const avg = recent.reduce((sum, sem) => sum + (sem.sgpa || 0), 0) / recent.length
  return parseFloat(avg.toFixed(4))
}

/**
 * Main prediction function — single source of truth for predictedCGPA and next semester forecast.
 * @param {Object} record - AcademicRecord (plain JS object or Mongoose doc)
 * @param {number} [totalDegreeCreditsOverride] - Optional override for program credit ceiling
 * @returns {Object} Prediction result
 */
const calculatePrediction = (record, totalDegreeCreditsOverride) => {
  const C_total = totalDegreeCreditsOverride || DEFAULT_TOTAL_DEGREE_CREDITS
  const semesters = (record && record.semesters) ? record.semesters : []
  const targetCGPA = record?.targetCGPA != null ? parseFloat(record.targetCGPA) : null
  const dataRichSemesters = countDataRichSemesters(semesters)
  const C_completed = sumCompletedCredits(semesters)
  const C_remaining = Math.max(0, C_total - C_completed)
  const nextSemesterNumber = Math.min(8, dataRichSemesters + 1)

  // Empty state: No semesters / memos uploaded
  if (dataRichSemesters === 0 || C_completed === 0) {
    return {
      isAvailable: false,
      predictedCGPA: null,
      predictedNextSGPA: null,
      requiredNextSGPA: null,
      isTargetAchievable: null,
      currentCGPA: null,
      targetCGPA,
      completedCredits: 0,
      remainingCredits: C_total,
      totalDegreeCredits: C_total,
      basedOnSemesters: 0,
      nextSemesterNumber: 1,
      trajectory: 'none',
      confidenceLabel: 'Unavailable',
      insight: 'Upload your first semester memo to unlock CGPA projections and next-semester SGPA targets.'
    }
  }

  const currentCGPA = parseFloat(calculateCGPA(semesters).toFixed(2))

  // Degree already complete
  if (C_remaining === 0) {
    return {
      isAvailable: true,
      predictedCGPA: currentCGPA,
      predictedNextSGPA: currentCGPA,
      requiredNextSGPA: null,
      isTargetAchievable: targetCGPA != null ? currentCGPA >= targetCGPA : null,
      currentCGPA,
      targetCGPA,
      completedCredits: C_completed,
      remainingCredits: 0,
      totalDegreeCredits: C_total,
      basedOnSemesters: dataRichSemesters,
      nextSemesterNumber: null,
      trajectory: 'stable',
      confidenceLabel: 'High',
      insight: 'Degree complete. Final CGPA: ' + currentCGPA.toFixed(2) + '.'
    }
  }

  // Trajectory & velocity estimation
  let expectedFutureSGPA = currentCGPA
  let trajectory = 'single'

  if (dataRichSemesters >= 2) {
    const recent = recentSGPAAverage(semesters, 2)
    if (recent !== null) {
      const rawVelocity = (0.6 * currentCGPA) + (0.4 * recent)
      expectedFutureSGPA = parseFloat(Math.min(10.0, Math.max(0.0, rawVelocity)).toFixed(4))

      const sortedValid = semesters
        .filter(sem => (sem.sgpa || 0) > 0)
        .sort((a, b) => a.semesterNumber - b.semesterNumber)
      if (sortedValid.length >= 2) {
        const latestSGPA = sortedValid[sortedValid.length - 1].sgpa || 0
        const prevSGPA = sortedValid[sortedValid.length - 2].sgpa || 0
        if (latestSGPA > prevSGPA + 0.05) trajectory = 'improving'
        else if (latestSGPA < prevSGPA - 0.05) trajectory = 'declining'
        else trajectory = 'stable'
      }
    }
  }

  // Projected upcoming semester SGPA
  const predictedNextSGPA = parseFloat(expectedFutureSGPA.toFixed(2))

  // Overall forecasted CGPA at graduation
  const predictedRaw = ((currentCGPA * C_completed) + (expectedFutureSGPA * C_remaining)) / C_total
  const predictedCGPA = parseFloat(Math.min(10.0, Math.max(0.0, predictedRaw)).toFixed(2))

  // Required SGPA in upcoming semesters to hit Target CGPA (if set)
  let requiredNextSGPA = null
  let isTargetAchievable = null

  if (targetCGPA != null && C_remaining > 0) {
    const rawReq = ((targetCGPA * C_total) - (currentCGPA * C_completed)) / C_remaining
    requiredNextSGPA = parseFloat(Math.max(0, rawReq).toFixed(2))
    isTargetAchievable = requiredNextSGPA <= 10.0
  }

  // Confidence rating
  let confidenceLabel = 'Low'
  if (dataRichSemesters >= 4) confidenceLabel = 'High'
  else if (dataRichSemesters >= 2) confidenceLabel = 'Medium'

  // Dynamic explainable insights
  let insight = ''
  if (targetCGPA != null) {
    if (isTargetAchievable) {
      if (requiredNextSGPA <= currentCGPA) {
        insight = `Target ${targetCGPA.toFixed(2)}: Maintain ~${requiredNextSGPA.toFixed(2)} SGPA across remaining semesters to achieve your goal.`
      } else {
        insight = `Target ${targetCGPA.toFixed(2)}: Aim for ${requiredNextSGPA.toFixed(2)} SGPA in Semester ${nextSemesterNumber} and beyond to hit your goal.`
      }
    } else {
      insight = `Target ${targetCGPA.toFixed(2)} exceeds mathematical max (requires ${requiredNextSGPA.toFixed(2)} SGPA). Consider adjusting target.`
    }
  } else {
    if (trajectory === 'single') {
      insight = `Semester 1 logged with ${currentCGPA.toFixed(2)} CGPA. Set your Target CGPA to get customized semester goals.`
    } else if (trajectory === 'improving') {
      insight = `Upward trajectory! Projected ~${predictedNextSGPA.toFixed(2)} SGPA in Semester ${nextSemesterNumber}.`
    } else {
      insight = `Performance stable. Forecasted ~${predictedNextSGPA.toFixed(2)} SGPA for Semester ${nextSemesterNumber}.`
    }
  }

  return {
    isAvailable: true,
    predictedCGPA,
    predictedNextSGPA,
    requiredNextSGPA,
    isTargetAchievable,
    currentCGPA,
    targetCGPA,
    completedCredits: C_completed,
    remainingCredits: C_remaining,
    totalDegreeCredits: C_total,
    basedOnSemesters: dataRichSemesters,
    nextSemesterNumber,
    trajectory,
    confidenceLabel,
    insight
  }
}

module.exports = {
  calculatePrediction,
  sumCompletedCredits,
  countDataRichSemesters
}
