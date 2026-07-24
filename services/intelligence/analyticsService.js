const { calculateRisk } = require('./engines/riskEngine')
const { generateInsights } = require('./engines/insightEngine')
const { generateRecommendations } = require('./engines/recommendationEngine')
const { calculateHealthScore } = require('./engines/healthScoreEngine')

/**
 * Orchestrator service combining Subject Risk, Insights, Recommendations,
 * and Health Score engines into one unified Academic Intelligence payload.
 *
 * @param {Object} record - The AcademicRecord Mongoose document or plain JS object
 * @returns {Object} Unified academic intelligence payload
 */
const generateAcademicAnalytics = async (record) => {
  const defaultPayload = {
    healthScore: {
      score: 0,
      status: 'NEEDS IMPROVEMENT',
      color: 'red',
      trend: { direction: 'STABLE', delta: 0, percentage: 0, reason: 'No academic records found.' },
      breakdown: { attendance: 0, grades: 0, cgpa: 0, risk: 0 },
      explanation: { summary: '', strengths: [], improvements: [] }
    },
    insights: {
      strongestSubject: null,
      weakestSubject: null,
      bestSemester: null,
      worstSemester: null,
      creditsCompleted: 0,
      creditsRemaining: 160,
      averageAttendance: 0,
      averageGrade: 0,
      improvementTrend: { direction: 'STABLE', delta: 0, percentage: 0, reason: 'No academic records found.' },
      dataQuality: { totalSemesters: 0, totalSubjects: 0, completedCredits: 0, missingAttendanceCount: 0, missingGradesCount: 0, completionPercentage: 0 }
    },
    riskScores: [],
    recommendations: [],
    summary: {
      overallStatus: 'NEEDS IMPROVEMENT',
      totalSubjects: 0,
      totalSemesters: 0,
      highRiskSubjects: 0,
      mediumRiskSubjects: 0,
      lowRiskSubjects: 0,
      totalRecommendations: 0,
      strongestArea: 'Attendance',
      weakestArea: 'Grades',
      overallRemark: 'Academic trajectory requires intervention. Please review recommendation logs.'
    },
    metadata: {
      generatedAt: new Date().toISOString(),
      engine: 'Academic Intelligence',
      version: '1.0'
    }
  }

  if (!record) {
    return defaultPayload
  }

  try {
    // 1. Gather all subjects from semesters list
    const allSubjects = []
    const semesters = record.semesters || []
    semesters.forEach(sem => {
      if (sem.subjects) {
        sem.subjects.forEach(sub => {
          allSubjects.push(sub)
        })
      }
    })

    // 2. Execute Risk Score Engine
    const riskScores = calculateRisk(allSubjects)

    // 3. Execute Insights Engine
    const insights = generateInsights(record)

    // 4. Execute Recommendation Engine
    const recommendations = generateRecommendations(record)

    // 5. Execute Health Score Engine
    const healthScore = calculateHealthScore(record, riskScores)

    // 6. Risk counts summary compilation
    let highRiskSubjects = 0
    let mediumRiskSubjects = 0
    let lowRiskSubjects = 0
    riskScores.forEach(r => {
      if (r.level === 'HIGH') highRiskSubjects++
      else if (r.level === 'MEDIUM') mediumRiskSubjects++
      else lowRiskSubjects++
    })

    // 7. Strongest and Weakest dimension search mapping
    const breakdown = healthScore.breakdown
    const dimensions = [
      { key: 'Attendance', val: breakdown.attendance },
      { key: 'Grades', val: breakdown.grades },
      { key: 'CGPA', val: breakdown.cgpa },
      { key: 'Subject Risk', val: breakdown.risk }
    ]

    // Sort to determine strongest and weakest
    dimensions.sort((a, b) => b.val - a.val)
    const strongestArea = dimensions[0].key

    dimensions.sort((a, b) => a.val - b.val)
    const weakestArea = dimensions[0].key

    // Determine deterministic overall remark string
    let overallRemark = 'Academic trajectory requires intervention. Please review recommendation logs.'
    if (healthScore.status === 'EXCELLENT') {
      overallRemark = 'Academic progress is exemplary. Keep maintaining these high standards.'
    } else if (healthScore.status === 'GOOD') {
      overallRemark = 'Academic standing is strong. A few targeted improvements will optimize standings.'
    } else if (healthScore.status === 'FAIR') {
      overallRemark = 'A balanced standing. Focus on attendance and key subject revisions is advised.'
    }

    const summary = {
      overallStatus: healthScore.status,
      totalSubjects: allSubjects.length,
      totalSemesters: semesters.length,
      highRiskSubjects,
      mediumRiskSubjects,
      lowRiskSubjects,
      totalRecommendations: recommendations.length,
      strongestArea,
      weakestArea,
      overallRemark
    }

    return {
      healthScore,
      insights,
      riskScores,
      recommendations,
      summary,
      metadata: {
        generatedAt: new Date().toISOString(),
        engine: 'Academic Intelligence',
        version: '1.0'
      }
    }
  } catch (error) {
    console.error('Failed to generate academic intelligence analytics:', error)
    return defaultPayload
  }
}

module.exports = {
  generateAcademicAnalytics
}
