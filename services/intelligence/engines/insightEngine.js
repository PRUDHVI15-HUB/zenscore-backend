/**
 * Pure rule-based Insight Engine with explainability and data quality auditing.
 * Evaluates AcademicRecord datasets to extract strongest/weakest courses,
 * semester standings, credit accumulations, averages, and SGPA progression trends.
 *
 * @param {Object} record - The AcademicRecord Mongoose document or plain JS object
 * @returns {Object} Structured insights object
 */
const generateInsights = (record) => {
  const defaultResult = {
    strongestSubject: null,
    weakestSubject: null,
    bestSemester: null,
    worstSemester: null,
    creditsCompleted: 0,
    creditsRemaining: 160,
    averageAttendance: 0,
    averageGrade: 0,
    improvementTrend: {
      direction: 'STABLE',
      delta: 0,
      percentage: 0,
      reason: 'No academic semester records found.'
    },
    dataQuality: {
      totalSemesters: 0,
      totalSubjects: 0,
      completedCredits: 0,
      missingAttendanceCount: 0,
      missingGradesCount: 0,
      completionPercentage: 0
    }
  }

  if (!record || !record.semesters || record.semesters.length === 0) {
    return defaultResult
  }

  const totalSemesters = record.semesters.length
  let totalSubjects = 0
  let completedCredits = 0
  let missingAttendanceCount = 0
  let missingGradesCount = 0

  const allSubjects = []
  record.semesters.forEach(sem => {
    if (sem.subjects) {
      sem.subjects.forEach(sub => {
        totalSubjects++

        const hasGrade = sub.finalGrade !== undefined && sub.finalGrade !== null && !isNaN(sub.finalGrade)
        const hasAttendance = sub.attendance !== undefined && sub.attendance !== null && !isNaN(sub.attendance)
        const hasCredits = sub.credits !== undefined && sub.credits !== null && !isNaN(sub.credits)

        if (!hasGrade) missingGradesCount++
        if (!hasAttendance) missingAttendanceCount++

        const creditsVal = hasCredits ? Number(sub.credits) : 0
        completedCredits += creditsVal

        allSubjects.push({
          subjectId: sub._id || sub.id || null,
          semester: sem.semesterNumber || 0,
          name: sub.name || 'Unnamed Subject',
          credits: creditsVal,
          finalGrade: hasGrade ? Number(sub.finalGrade) : null,
          attendance: hasAttendance ? Number(sub.attendance) : null
        })
      })
    }
  })

  // 1. Strongest Subject (Highest finalGrade, tie-breaker: higher credits)
  let strongestSubject = null
  allSubjects.forEach(sub => {
    if (sub.finalGrade === null) return
    if (!strongestSubject) {
      strongestSubject = sub
    } else {
      if (sub.finalGrade > strongestSubject.finalGrade) {
        strongestSubject = sub
      } else if (sub.finalGrade === strongestSubject.finalGrade) {
        if (sub.credits > strongestSubject.credits) {
          strongestSubject = sub
        }
      }
    }
  })

  // 2. Weakest Subject (Lowest finalGrade, tie-breaker: higher credits)
  let weakestSubject = null
  allSubjects.forEach(sub => {
    if (sub.finalGrade === null) return
    if (!weakestSubject) {
      weakestSubject = sub
    } else {
      if (sub.finalGrade < weakestSubject.finalGrade) {
        weakestSubject = sub
      } else if (sub.finalGrade === weakestSubject.finalGrade) {
        if (sub.credits > weakestSubject.credits) {
          weakestSubject = sub
        }
      }
    }
  })

  // 3. Best Semester (Highest SGPA)
  let bestSemester = null
  record.semesters.forEach(sem => {
    const sgpaVal = sem.sgpa || 0
    if (!bestSemester || sgpaVal > bestSemester.sgpa) {
      bestSemester = {
        semesterId: sem._id || sem.id || null,
        semester: sem.semesterNumber || 0,
        sgpa: sgpaVal
      }
    }
  })

  // 4. Worst Semester (Lowest SGPA)
  let worstSemester = null
  record.semesters.forEach(sem => {
    const sgpaVal = sem.sgpa || 0
    if (!worstSemester || sgpaVal < worstSemester.sgpa) {
      worstSemester = {
        semesterId: sem._id || sem.id || null,
        semester: sem.semesterNumber || 0,
        sgpa: sgpaVal
      }
    }
  })

  // 5. Credits Completed and Remaining
  const creditsRemaining = Math.max(0, 160 - completedCredits)

  // 6. Average Attendance
  const validAttendance = allSubjects.filter(s => s.attendance !== null)
  const totalAttendance = validAttendance.reduce((sum, s) => sum + s.attendance, 0)
  const averageAttendance = validAttendance.length > 0
    ? parseFloat((totalAttendance / validAttendance.length).toFixed(2))
    : 0

  // 7. Average Grade
  const validGrades = allSubjects.filter(s => s.finalGrade !== null)
  const totalGrade = validGrades.reduce((sum, s) => sum + s.finalGrade, 0)
  const averageGrade = validGrades.length > 0
    ? parseFloat((totalGrade / validGrades.length).toFixed(2))
    : 0

  // 8. Improvement Trend and Reason
  const sortedSems = [...record.semesters].sort((a, b) => (a.semesterNumber || 0) - (b.semesterNumber || 0))
  let direction = 'STABLE'
  let delta = 0
  let percentage = 0
  let reason = 'Stable performance or insufficient semester history exists.'

  if (sortedSems.length > 1) {
    const latestSem = sortedSems[sortedSems.length - 1]
    const prevSem = sortedSems[sortedSems.length - 2]
    const latestSGPA = latestSem.sgpa || 0
    const prevSGPA = prevSem.sgpa || 0

    delta = parseFloat((latestSGPA - prevSGPA).toFixed(2))

    if (prevSGPA > 0) {
      percentage = parseFloat(((delta / prevSGPA) * 100).toFixed(2))
    } else {
      percentage = 0
    }

    if (delta > 0) {
      direction = 'UP'
      reason = 'Latest semester SGPA improved compared to the previous semester.'
    } else if (delta < 0) {
      direction = 'DOWN'
      reason = 'Latest semester SGPA declined compared to the previous semester.'
    } else {
      direction = 'STABLE'
      reason = 'Latest semester SGPA remained unchanged.'
    }
  }

  const improvementTrend = {
    direction,
    delta,
    percentage,
    reason
  }

  // Format Helper with Explainability
  const formatSubject = (sub, isStrongest) => {
    if (!sub) return null
    return {
      subjectId: sub.subjectId ? String(sub.subjectId) : null,
      semester: sub.semester,
      name: sub.name,
      credits: sub.credits,
      finalGrade: sub.finalGrade,
      attendance: sub.attendance,
      explanation: isStrongest
        ? 'Highest final grade across all completed subjects.'
        : 'Lowest final grade across all completed subjects.'
    }
  }

  const completionPercentage = parseFloat(((completedCredits / 160) * 100).toFixed(2))

  return {
    strongestSubject: formatSubject(strongestSubject, true),
    weakestSubject: formatSubject(weakestSubject, false),
    bestSemester: bestSemester ? {
      ...bestSemester,
      explanation: 'Semester with the highest SGPA.'
    } : null,
    worstSemester: worstSemester ? {
      ...worstSemester,
      explanation: 'Semester with the lowest SGPA.'
    } : null,
    creditsCompleted: completedCredits,
    creditsRemaining,
    averageAttendance,
    averageGrade,
    improvementTrend,
    dataQuality: {
      totalSemesters,
      totalSubjects,
      completedCredits,
      missingAttendanceCount,
      missingGradesCount,
      completionPercentage
    }
  }
}

module.exports = {
  generateInsights
}
