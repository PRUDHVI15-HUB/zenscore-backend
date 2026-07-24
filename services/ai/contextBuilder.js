/**
 * Generates an optimized, token-efficient academic context from the student's records.
 * Removes duplicate fields, compresses nested structures, and includes internal metadata versioning.
 *
 * @param {Object} record - The student's AcademicRecord mongoose document/object
 * @param {Object} analytics - The generated Academic Analytics payload
 * @returns {Object} Optimized structured context object
 */
const buildContext = (record, analytics) => {
  if (!record || !analytics) {
    return {
      metadata: {
        contextVersion: "1.1",
        generatedAt: new Date().toISOString(),
        studentRecordVersion: "0"
      },
      cgpa: { current: 0, target: 0 },
      health: { score: 0, status: 'NEEDS IMPROVEMENT' },
      subjects: { highRisk: [], medRisk: [], strongest: null, weakest: null },
      stats: { attendance: 0, completedCredits: 0, remainingCredits: 160 },
      recs: []
    }
  }

  // 1. Compress risk arrays
  const riskScores = analytics.riskScores || []
  const highRisk = riskScores.filter(r => r.level === 'HIGH').map(r => r.subject)
  const medRisk = riskScores.filter(r => r.level === 'MEDIUM').map(r => r.subject)

  // 2. Compress recommendations to remove duplicates and verbose details
  const recommendations = analytics.recommendations || []
  const recList = [...new Set(recommendations.map(r => r.description))]

  return {
    metadata: {
      contextVersion: "1.1",
      generatedAt: new Date().toISOString(),
      studentRecordVersion: record.updatedAt ? new Date(record.updatedAt).getTime().toString() : "1.0"
    },
    cgpa: {
      current: record.currentCGPA || 0,
      target: record.targetCGPA || 0
    },
    health: {
      score: analytics.healthScore?.score || 0,
      status: analytics.healthScore?.status || 'NEEDS IMPROVEMENT'
    },
    subjects: {
      highRisk,
      medRisk,
      strongest: analytics.insights?.strongestSubject || null,
      weakest: analytics.insights?.weakestSubject || null
    },
    stats: {
      attendance: analytics.insights?.averageAttendance || 0,
      completedCredits: analytics.insights?.creditsCompleted || 0,
      remainingCredits: analytics.insights?.creditsRemaining !== undefined ? analytics.insights.creditsRemaining : 160
    },
    recs: recList
  }
}

module.exports = {
  buildContext
}
