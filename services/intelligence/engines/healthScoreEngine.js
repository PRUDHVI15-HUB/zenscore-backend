/**
 * Pure rule-based Academic Health Score Engine.
 * Calculates overall health index (0-100) using weighted metrics:
 * - Attendance (30%)
 * - Grades (30%)
 * - Cumulative GPA (25%)
 * - Subject Risk (15%)
 *
 * Exposes calculateHealthScore(record, riskScores) pure function.
 */
const calculateHealthScore = (record, riskScores = []) => {
  const defaultResult = {
    score: 0,
    status: 'NEEDS IMPROVEMENT',
    color: 'red',
    trend: {
      direction: 'STABLE',
      delta: 0,
      percentage: 0,
      reason: 'No academic records found.'
    },
    breakdown: {
      attendance: 0,
      grades: 0,
      cgpa: 0,
      risk: 0
    },
    explanation: {
      summary: 'Academic standing requires improvement. Focused target goals are recommended to address risks and grades.',
      strengths: ['Basic academic parameters are within operational limits.'],
      improvements: ['Urgent attention is needed to improve class attendance and address critical grade levels.']
    }
  }

  if (!record || !record.semesters || record.semesters.length === 0) {
    return defaultResult
  }

  // 1. Helper to fetch Mean Risk Score locally
  const getMeanRisk = (subjects, scoresList) => {
    if (!subjects || subjects.length === 0) return 0
    let totalRisk = 0
    let count = 0
    subjects.forEach(sub => {
      const match = scoresList.find(r => 
        r.subjectId === String(sub._id || sub.id || '') || 
        r.subject.toLowerCase() === (sub.name || '').toLowerCase()
      )
      totalRisk += match ? match.score : 0
      count++
    })
    return count > 0 ? (totalRisk / count) : 0
  }

  // 2. Helper to compute overall metrics for a given subset of semesters and CGPA
  const computeMetrics = (semestersList, currentCgpa) => {
    const allSubjects = []
    semestersList.forEach(sem => {
      if (sem.subjects) {
        sem.subjects.forEach(sub => {
          allSubjects.push(sub)
        })
      }
    })

    // Attendance Score (30%)
    const attSubjects = allSubjects.filter(s => s.attendance !== undefined && s.attendance !== null && !isNaN(s.attendance))
    const meanAttendance = attSubjects.length > 0
      ? attSubjects.reduce((sum, s) => sum + s.attendance, 0) / attSubjects.length
      : 100

    // Grade Score (30%)
    const gradeSubjects = allSubjects.filter(s => s.finalGrade !== undefined && s.finalGrade !== null && !isNaN(s.finalGrade))
    const meanGrade = gradeSubjects.length > 0
      ? gradeSubjects.reduce((sum, s) => sum + s.finalGrade, 0) / gradeSubjects.length
      : 0
    const gradeScore = (meanGrade / 10) * 100

    // CGPA Score (25%)
    const cgpaScore = (currentCgpa / 10) * 100

    // Risk Score (15%)
    const meanRisk = getMeanRisk(allSubjects, riskScores)
    const riskScore = Math.max(0, 100 - meanRisk)

    // Weighted Formula
    const rawHealth = (0.30 * meanAttendance) + (0.30 * gradeScore) + (0.25 * cgpaScore) + (0.15 * riskScore)
    const healthScore = parseFloat(rawHealth.toFixed(2))

    return {
      score: healthScore,
      breakdown: {
        attendance: parseFloat(meanAttendance.toFixed(2)),
        grades: parseFloat(gradeScore.toFixed(2)),
        cgpa: parseFloat(cgpaScore.toFixed(2)),
        risk: parseFloat(riskScore.toFixed(2))
      }
    }
  }

  // 3. Helper to reconstruct historical CGPA dynamically
  const getPrecedingCGPA = (precedingSems) => {
    let totalGradePoints = 0
    let totalCredits = 0
    precedingSems.forEach(sem => {
      if (sem.subjects) {
        sem.subjects.forEach(sub => {
          totalGradePoints += (sub.finalGrade || 0) * (sub.credits || 0)
          totalCredits += (sub.credits || 0)
        })
      }
    })
    return totalCredits > 0 ? parseFloat((totalGradePoints / totalCredits).toFixed(2)) : 0
  }

  // Calculate current score parameters
  const currentCgpa = record.currentCGPA || record.cgpa || 0
  const current = computeMetrics(record.semesters, currentCgpa)

  // 4. Calculate trend comparing latest vs previous semesters history
  const sortedSems = [...record.semesters].sort((a, b) => (a.semesterNumber || 0) - (b.semesterNumber || 0))
  let direction = 'STABLE'
  let delta = 0
  let percentage = 0
  let reason = 'Stable performance or insufficient semester history exists.'

  if (sortedSems.length > 1) {
    const healthCurr = current.score

    const precedingSems = sortedSems.slice(0, sortedSems.length - 1)
    const prevCgpa = getPrecedingCGPA(precedingSems)
    const prevMetrics = computeMetrics(precedingSems, prevCgpa)
    const healthPrev = prevMetrics.score

    delta = parseFloat((healthCurr - healthPrev).toFixed(2))
    
    if (healthPrev > 0) {
      percentage = parseFloat(((delta / healthPrev) * 100).toFixed(2))
    }

    if (delta > 0) {
      direction = 'UP'
      reason = 'Academic health score improved compared to the previous semester.'
    } else if (delta < 0) {
      direction = 'DOWN'
      reason = 'Academic health score declined compared to the previous semester.'
    } else {
      direction = 'STABLE'
      reason = 'Academic health score remained unchanged.'
    }
  }

  // 5. Status mapping classification
  let status = 'NEEDS IMPROVEMENT'
  let color = 'red'
  let summary = 'Academic standing requires improvement. Focused target goals are recommended to address risks and grades.'

  if (current.score >= 90) {
    status = 'EXCELLENT'
    color = 'green'
    summary = 'Outstanding overall academic standing with excellent grades, high attendance, and minimal risk.'
  } else if (current.score >= 75) {
    status = 'GOOD'
    color = 'blue'
    summary = 'Good overall academic standing with steady grades and positive attendance consistency.'
  } else if (current.score >= 60) {
    status = 'FAIR'
    color = 'yellow'
    summary = 'Fair overall academic standing, with potential areas of improvement in exam performance and class attendance.'
  }

  // 6. Generate explainable deterministic strengths and improvements lists
  const strengths = []
  if (current.breakdown.attendance >= 85) {
    strengths.push('Healthy attendance rate above 85%.')
  }
  if (current.breakdown.grades >= 75) {
    strengths.push('Solid average grades above 7.5.')
  }
  if (current.breakdown.cgpa >= 75) {
    strengths.push('Strong cumulative standing (CGPA >= 7.5).')
  }
  if (current.breakdown.risk >= 80) {
    strengths.push('Low overall subject risk index.')
  }
  if (direction === 'UP') {
    strengths.push('Positive academic improvement trajectory.')
  }
  if (strengths.length === 0) {
    strengths.push('Basic academic parameters are within operational limits.')
  }

  const improvements = []
  if (current.breakdown.attendance < 85) {
    improvements.push('Improve attendance in low-attendance courses.')
  }
  if (current.breakdown.grades < 75) {
    improvements.push('Boost course exam scores to optimize grade levels.')
  }
  if (current.breakdown.cgpa < 75) {
    improvements.push('Focus on high-credit subjects to raise cumulative standing.')
  }
  if (current.breakdown.risk < 80) {
    improvements.push('Dedicate weekly study hours to high-risk subjects.')
  }
  if (direction === 'DOWN') {
    improvements.push('Address recent GPA declines to stabilize performance.')
  }
  if (improvements.length === 0) {
    improvements.push('Continue monitoring course attendance and grades to maintain standings.')
  }

  return {
    score: current.score,
    status,
    color,
    trend: {
      direction,
      delta,
      percentage,
      reason
    },
    breakdown: current.breakdown,
    explanation: {
      summary,
      strengths,
      improvements
    }
  }
}

module.exports = {
  calculateHealthScore
}
