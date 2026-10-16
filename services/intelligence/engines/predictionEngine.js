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
const {
  DEFAULT_TOTAL_DEGREE_CREDITS,
  CONFIDENCE_THRESHOLDS
} = require('../../../constants/academicConstants')

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
 * Calculates sample standard deviation of past SGPAs.
 * @param {Array<number>} sgpaList
 * @returns {number|null} Standard deviation or null if fewer than 2 data points
 */
const calculateSGPAStandardDeviation = (sgpaList) => {
  if (!Array.isArray(sgpaList) || sgpaList.length < 2) return null
  const n = sgpaList.length
  const mean = sgpaList.reduce((sum, v) => sum + v, 0) / n
  const variance = sgpaList.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (n - 1)
  return Math.sqrt(Math.max(0, variance))
}

/**
 * Computes scenario projection (low / expected / high) for remaining semesters and graduation CGPA.
 * @param {Object} params
 * @returns {Object} Scenario projection object
 */
const calculateScenarioProjection = ({
  semesters = [],
  currentCGPA,
  completedCredits,
  remainingCredits,
  totalDegreeCredits = DEFAULT_TOTAL_DEGREE_CREDITS,
  predictedNextSGPA,
  predictedCGPA
}) => {
  const validSemesters = (semesters || [])
    .filter(sem => (sem.sgpa || 0) > 0 && Array.isArray(sem.subjects) && sem.subjects.length > 0)
    .sort((a, b) => a.semesterNumber - b.semesterNumber)

  const pastSGPAs = validSemesters.map(s => parseFloat(s.sgpa))
  const dataRichCount = pastSGPAs.length

  // Edge Case: 0 remaining credits (Degree Completed)
  if (remainingCredits <= 0) {
    const finalVal = parseFloat(currentCGPA.toFixed(2))
    return {
      status: 'completed',
      flag: null,
      hasHistory: dataRichCount >= 2,
      standardDeviation: dataRichCount >= 2 ? parseFloat((calculateSGPAStandardDeviation(pastSGPAs) || 0).toFixed(4)) : null,
      baseline: finalVal,
      low: finalVal,
      expected: finalVal,
      high: finalVal,
      sgpaNext: {
        low: finalVal,
        expected: finalVal,
        high: finalVal
      }
    }
  }

  // Edge Case: Fewer than 2 semesters of history -> return baseline only and flag "insufficient history"
  if (dataRichCount < 2) {
    return {
      status: 'insufficient history',
      flag: 'insufficient history',
      hasHistory: false,
      standardDeviation: null,
      baseline: predictedCGPA,
      low: predictedCGPA,
      expected: predictedCGPA,
      high: predictedCGPA,
      sgpaNext: {
        low: predictedNextSGPA,
        expected: predictedNextSGPA,
        high: predictedNextSGPA
      }
    }
  }

  // Scenario projection using past SGPA history & standard deviation
  const sd = calculateSGPAStandardDeviation(pastSGPAs) || 0
  const sgpaExpected = predictedNextSGPA
  const sgpaLow = parseFloat(Math.min(10.0, Math.max(0.0, sgpaExpected - sd)).toFixed(2))
  const sgpaHigh = parseFloat(Math.min(10.0, Math.max(0.0, sgpaExpected + sd)).toFixed(2))

  // Scenario CGPAs at graduation:
  // Baseline / Expected: (C_cur * E_comp + SGPAnext * E_rem) / 160
  const rawExpectedCGPA = ((currentCGPA * completedCredits) + (sgpaExpected * remainingCredits)) / totalDegreeCredits
  const expectedCGPA = parseFloat(Math.min(10.0, Math.max(0.0, rawExpectedCGPA)).toFixed(2))

  // Low Scenario
  const rawLowCGPA = ((currentCGPA * completedCredits) + (sgpaLow * remainingCredits)) / totalDegreeCredits
  const lowCGPA = parseFloat(Math.min(10.0, Math.max(0.0, rawLowCGPA)).toFixed(2))

  // High Scenario
  const rawHighCGPA = ((currentCGPA * completedCredits) + (sgpaHigh * remainingCredits)) / totalDegreeCredits
  const highCGPA = parseFloat(Math.min(10.0, Math.max(0.0, rawHighCGPA)).toFixed(2))

  return {
    status: 'sufficient history',
    flag: null,
    hasHistory: true,
    standardDeviation: parseFloat(sd.toFixed(4)),
    baseline: predictedCGPA,
    low: lowCGPA,
    expected: expectedCGPA,
    high: highCGPA,
    sgpaNext: {
      low: sgpaLow,
      expected: sgpaExpected,
      high: sgpaHigh
    }
  }
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
      insight: 'Upload your first semester memo to unlock CGPA projections and next-semester SGPA targets.',
      scenarioProjection: {
        status: 'insufficient history',
        flag: 'insufficient history',
        hasHistory: false,
        baseline: null,
        low: null,
        expected: null,
        high: null,
        standardDeviation: null,
        sgpaNext: { low: null, expected: null, high: null }
      }
    }
  }

  const currentCGPA = parseFloat(calculateCGPA(semesters).toFixed(2))

  // Degree already complete
  if (C_remaining === 0) {
    const scenario = calculateScenarioProjection({
      semesters,
      currentCGPA,
      completedCredits: C_completed,
      remainingCredits: 0,
      totalDegreeCredits: C_total,
      predictedNextSGPA: currentCGPA,
      predictedCGPA: currentCGPA
    })

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
      confidenceLabel: CONFIDENCE_THRESHOLDS.details.high.label,
      insight: 'Degree complete. Final CGPA: ' + currentCGPA.toFixed(2) + '.',
      scenarioProjection: scenario
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

  // Overall forecasted CGPA at graduation (Baseline: CGPApred = (Ccur*Ecomp + SGPAnext*Erem)/160)
  const predictedRaw = ((currentCGPA * C_completed) + (expectedFutureSGPA * C_remaining)) / C_total
  const predictedCGPA = parseFloat(Math.min(10.0, Math.max(0.0, predictedRaw)).toFixed(2))

  // Scenario projection calculation (Low / Expected / High range)
  const scenarioProjection = calculateScenarioProjection({
    semesters,
    currentCGPA,
    completedCredits: C_completed,
    remainingCredits: C_remaining,
    totalDegreeCredits: C_total,
    predictedNextSGPA,
    predictedCGPA
  })

  // Required SGPA in upcoming semesters to hit Target CGPA (if set)
  let requiredNextSGPA = null
  let isTargetAchievable = null

  if (targetCGPA != null && C_remaining > 0) {
    const rawReq = ((targetCGPA * C_total) - (currentCGPA * C_completed)) / C_remaining
    requiredNextSGPA = parseFloat(Math.max(0, rawReq).toFixed(2))
    isTargetAchievable = requiredNextSGPA <= 10.0
  }

  // Confidence rating using centralized CONFIDENCE_THRESHOLDS constants
  let confidenceLabel = CONFIDENCE_THRESHOLDS.details.low.label
  if (dataRichSemesters >= CONFIDENCE_THRESHOLDS.high) {
    confidenceLabel = CONFIDENCE_THRESHOLDS.details.high.label
  } else if (dataRichSemesters >= CONFIDENCE_THRESHOLDS.medium) {
    confidenceLabel = CONFIDENCE_THRESHOLDS.details.medium.label
  }

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
    insight,
    scenarioProjection
  }
}

module.exports = {
  calculatePrediction,
  calculateScenarioProjection,
  calculateSGPAStandardDeviation,
  sumCompletedCredits,
  countDataRichSemesters
}
