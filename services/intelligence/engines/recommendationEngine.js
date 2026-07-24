/**
 * Upgraded Pure Rule-Based Academic Recommendation Engine.
 * Evaluates AcademicRecord datasets to generate sorted, prioritized,
 * and merged explainable student performance recommendations.
 *
 * Priority levels: HIGH -> MEDIUM -> LOW
 * Categories: ATTENDANCE, PERFORMANCE, ACADEMIC, REVISION
 * Types: critical, warning, suggestion
 *
 * @param {Object} record - AcademicRecord document or plain JS object
 * @returns {Array<Object>} List of merged recommendations sorted by priority
 */
const generateRecommendations = (record) => {
  if (!record || !record.semesters || record.semesters.length === 0) {
    return []
  }

  const rawRecs = []
  const allSubjects = []
  let totalAttendanceSum = 0
  let totalAttendanceCount = 0

  // Helper to compute risk score locally to avoid importing other engines
  const getSubjectRiskScore = (sub) => {
    const attendance = sub.attendance !== undefined && sub.attendance !== null ? sub.attendance : 100
    let attendanceRisk = 0
    if (attendance < 75) {
      attendanceRisk = 100
    } else if (attendance < 85) {
      attendanceRisk = ((85 - attendance) / 10) * 100
    }

    const grade = sub.finalGrade !== undefined && sub.finalGrade !== null ? sub.finalGrade : 0
    let gradeRisk = 0
    if (grade < 6.0) {
      gradeRisk = 100
    } else if (grade < 8.5) {
      gradeRisk = ((8.5 - grade) / 2.5) * 100
    }

    const credits = sub.credits || 3
    const creditRisk = (credits / 6) * 100

    return Math.round((0.40 * attendanceRisk) + (0.40 * gradeRisk) + (0.20 * creditRisk))
  }

  // Helper to generate a unique deterministic ID
  const generateId = (category, subject) => {
    const cleanSubject = String(subject)
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
    return `${category.toLowerCase()}-${cleanSubject}`
  }

  // Extract subjects and calculate attendance aggregates
  record.semesters.forEach(sem => {
    if (sem.subjects) {
      sem.subjects.forEach(sub => {
        const subData = {
          name: sub.name || 'Unnamed Subject',
          credits: Number(sub.credits) || 3,
          finalGrade: sub.finalGrade !== undefined && sub.finalGrade !== null ? Number(sub.finalGrade) : null,
          attendance: sub.attendance !== undefined && sub.attendance !== null ? Number(sub.attendance) : null
        }
        allSubjects.push(subData)

        if (subData.attendance !== null) {
          totalAttendanceSum += subData.attendance
          totalAttendanceCount++
        }
      })
    }
  })

  // Evaluate Rules per Subject
  allSubjects.forEach(sub => {
    const riskScore = getSubjectRiskScore(sub)

    // Rule 1: Attendance below 80% (HIGH Priority)
    if (sub.attendance !== null && sub.attendance < 80) {
      rawRecs.push({
        priority: 'HIGH',
        category: 'ATTENDANCE',
        subject: sub.name,
        title: 'Attendance Critical',
        message: 'Attendance is below 80%.',
        action: 'Attend every remaining class this semester.',
        reason: 'Attendance below 80%',
        estimatedImpact: '+0.25 CGPA',
        confidence: 95
      })
    }

    // Rule 2: High Risk Subject (HIGH Priority)
    if (riskScore >= 70) {
      rawRecs.push({
        priority: 'HIGH',
        category: 'PERFORMANCE',
        subject: sub.name,
        title: 'Performance Risk',
        message: 'Academic performance risk is high.',
        action: 'Schedule study hours and revise key topics.',
        reason: 'High performance risk',
        estimatedImpact: '+0.30 CGPA',
        confidence: 90
      })
    }

    // Rule 3: High Credits Weight (>= 4) and Grade < 8.0 (MEDIUM Priority)
    if (sub.finalGrade !== null && sub.credits >= 4 && sub.finalGrade < 8.0) {
      rawRecs.push({
        priority: 'MEDIUM',
        category: 'ACADEMIC',
        subject: sub.name,
        title: 'Heavy Credit Target',
        message: 'High credit subject is affecting cumulative standing.',
        action: 'Focus on assignments and seek tutoring if needed.',
        reason: 'High credit subject',
        estimatedImpact: '+0.15 CGPA',
        confidence: 85
      })
    }

    // Rule 4: Grade below 7.0 (LOW Priority)
    if (sub.finalGrade !== null && sub.finalGrade < 7.0) {
      rawRecs.push({
        priority: 'LOW',
        category: 'REVISION',
        subject: sub.name,
        title: 'Revision Needed',
        message: 'Grade is below target threshold.',
        action: 'Review core lectures and practice past exams.',
        reason: 'Grade below 7.0',
        estimatedImpact: '+0.08 CGPA',
        confidence: 70
      })
    }
  })

  // Rule 5: Average Attendance < 85% (MEDIUM Priority)
  const averageAttendance = totalAttendanceCount > 0 ? (totalAttendanceSum / totalAttendanceCount) : 100
  if (averageAttendance < 85) {
    rawRecs.push({
      priority: 'MEDIUM',
      category: 'ATTENDANCE',
      subject: 'All Subjects',
      title: 'Attendance Warning',
      message: 'Overall attendance is below 85%.',
      action: 'Raise overall attendance average above 85% to clear basic academic eligibility.',
      reason: 'Overall attendance below 85%',
      estimatedImpact: '+0.10 CGPA',
      confidence: 80
    })
  }

  // Priority Weights & Impact Mapping for Merging
  const priorityWeights = { HIGH: 3, MEDIUM: 2, LOW: 1 }
  const typeMapping = { HIGH: 'critical', MEDIUM: 'warning', LOW: 'suggestion' }
  const impactValue = {
    '+0.30 CGPA': 30,
    '+0.25 CGPA': 25,
    '+0.15 CGPA': 15,
    '+0.10 CGPA': 10,
    '+0.08 CGPA': 8
  }

  // Group by Subject to Merge duplicates
  const grouped = {}
  rawRecs.forEach(rec => {
    if (!grouped[rec.subject]) {
      grouped[rec.subject] = []
    }
    grouped[rec.subject].push(rec)
  })

  const mergedRecs = []

  Object.keys(grouped).forEach(subjectName => {
    const group = grouped[subjectName]

    // Sort group recommendations to find the base item (highest priority weight, then highest impact)
    group.sort((a, b) => {
      const priorityDiff = priorityWeights[b.priority] - priorityWeights[a.priority]
      if (priorityDiff !== 0) return priorityDiff
      return (impactValue[b.estimatedImpact] || 0) - (impactValue[a.estimatedImpact] || 0)
    })

    const base = group[0]

    // Compile max values and distinct reasons
    const maxConfidence = Math.max(...group.map(r => r.confidence))
    
    // Find the estimated impact corresponding to the maximum value
    let maxImpactStr = base.estimatedImpact
    let maxVal = -1
    group.forEach(r => {
      const val = impactValue[r.estimatedImpact] || 0
      if (val > maxVal) {
        maxVal = val
        maxImpactStr = r.estimatedImpact
      }
    })

    const uniqueReasons = [...new Set(group.map(r => r.reason))]

    mergedRecs.push({
      id: generateId(base.category, base.subject),
      priority: base.priority,
      type: typeMapping[base.priority],
      category: base.category,
      subject: base.subject,
      title: base.title,
      message: base.message,
      action: base.action,
      reasons: uniqueReasons,
      estimatedImpact: maxImpactStr,
      confidence: maxConfidence
    })
  })

  // Final deterministic sort: Priority weight descending, then impact value descending, then subject alphabetically
  mergedRecs.sort((a, b) => {
    const priorityDiff = priorityWeights[b.priority] - priorityWeights[a.priority]
    if (priorityDiff !== 0) return priorityDiff
    
    const impactDiff = (impactValue[b.estimatedImpact] || 0) - (impactValue[a.estimatedImpact] || 0)
    if (impactDiff !== 0) return impactDiff

    return a.subject.localeCompare(b.subject)
  })

  return mergedRecs
}

module.exports = {
  generateRecommendations
}
