const { DEFAULT_TOTAL_DEGREE_CREDITS, WEAK_SUBJECT_GRADE_THRESHOLD, WEAK_SUBJECT_ATTENDANCE_THRESHOLD, EXCELLENT_GRADE_THRESHOLD } = require('../../constants/academicConstants')

/**
 * Generates an optimized, token-efficient academic and student context.
 * Combines AcademicRecord, AcademicAnalytics, and optional StudentProfile/CareerProfile.
 *
 * @param {Object} record - AcademicRecord document/object
 * @param {Object} analytics - Academic Analytics payload
 * @param {Object} [profiles] - Optional { studentProfile, careerProfile }
 * @returns {Object} Structured context object
 */
const buildContext = (record, analytics, profiles = {}) => {
  const { studentProfile, careerProfile } = profiles

  if (!record) {
    return {
      metadata: {
        contextVersion: "2.0",
        generatedAt: new Date().toISOString()
      },
      cgpa: { current: 0, target: 8.0 },
      health: { score: 0, status: 'NEEDS IMPROVEMENT' },
      subjects: { all: [], highRisk: [], medRisk: [], strongest: null, weakest: null },
      stats: { attendance: 0, completedCredits: 0, remainingCredits: DEFAULT_TOTAL_DEGREE_CREDITS },
      career: null,
      recs: []
    }
  }

  // Extract all subjects list with detailed performance
  const allSubjects = []
  const highRisk = []
  const medRisk = []
  const strongSubjects = []
  let totalCredits = 0

  if (record.semesters) {
    record.semesters.forEach(sem => {
      if (sem.subjects) {
        sem.subjects.forEach(sub => {
          const credits = sub.credits || 0
          totalCredits += credits
          const grade = sub.finalGrade !== undefined && sub.finalGrade !== null ? Number(sub.finalGrade) : null
          const att = sub.attendance !== undefined && sub.attendance !== null ? Number(sub.attendance) : null

          const item = {
            name: sub.name,
            semester: sem.semesterNumber,
            credits,
            grade,
            attendance: att
          }
          allSubjects.push(item)

          if ((grade !== null && grade < WEAK_SUBJECT_GRADE_THRESHOLD) || (att !== null && att < WEAK_SUBJECT_ATTENDANCE_THRESHOLD)) {
            highRisk.push(sub.name)
          } else if (grade !== null && grade < 7.5) {
            medRisk.push(sub.name)
          }
          if (grade !== null && grade >= EXCELLENT_GRADE_THRESHOLD) {
            strongSubjects.push(sub.name)
          }
        })
      }
    })
  }

  // Risk scores & recommendations from analytics if present
  const recommendations = analytics?.recommendations || []
  const recList = [...new Set(recommendations.map(r => r.description || r.recommendation || r))]

  // Career profile context
  const targetCareerRole = careerProfile?.selectedCareerGoal || studentProfile?.careerGoal || careerProfile?.targetRole || null

  return {
    metadata: {
      contextVersion: "2.0",
      generatedAt: new Date().toISOString(),
      studentRecordVersion: record.updatedAt ? new Date(record.updatedAt).getTime().toString() : "1.0"
    },
    cgpa: {
      current: record.currentCGPA !== undefined ? Number(record.currentCGPA) : 0,
      target: record.targetCGPA !== undefined ? Number(record.targetCGPA) : 8.0,
      predicted: record.predictedCGPA !== undefined ? Number(record.predictedCGPA) : 0
    },
    health: {
      score: analytics?.healthScore?.score || 85,
      status: analytics?.healthScore?.status || 'HEALTHY'
    },
    subjects: {
      totalCount: allSubjects.length,
      highRisk: [...new Set(highRisk)],
      medRisk: [...new Set(medRisk)],
      strongest: strongSubjects.length > 0 ? strongSubjects.slice(0, 3) : (analytics?.insights?.strongestSubject ? [analytics.insights.strongestSubject] : []),
      weakest: highRisk.length > 0 ? highRisk.slice(0, 3) : (analytics?.insights?.weakestSubject ? [analytics.insights.weakestSubject] : []),
      courses: allSubjects.slice(0, 25) // Keep token size optimal
    },
    stats: {
      attendance: analytics?.insights?.averageAttendance || 100,
      completedCredits: totalCredits,
      remainingCredits: Math.max(0, DEFAULT_TOTAL_DEGREE_CREDITS - totalCredits)
    },
    career: targetCareerRole ? {
      targetRole: targetCareerRole,
      notes: `Target role ${targetCareerRole} requires solid core grades (7.5+ CGPA) and verified skills.`
    } : null,
    recs: recList.slice(0, 5)
  }
}

module.exports = {
  buildContext
}
