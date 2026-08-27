const { createNotification, createNotificationIfNotExists } = require('../services/notificationService')
const AcademicRecord = require('../models/AcademicRecord')
const User = require('../models/User')
const StudentProfile = require('../models/StudentProfile')
const CareerProfile = require('../models/CareerProfile')
const analyticsService = require('../services/intelligence/analyticsService')
const { calculateSGPA, calculateCGPA } = require('../utils/gpaUtils')
const { computeSubjectHealth, isWeakSubject } = require('../services/intelligence/subjectHealthService')
const { DEFAULT_TOTAL_DEGREE_CREDITS, WEAK_SUBJECT_GRADE_THRESHOLD, WEAK_SUBJECT_ATTENDANCE_THRESHOLD } = require('../constants/academicConstants')
const { queryCopilot } = require('../services/ai/academicCopilotService')
const { calculatePrediction } = require('../services/intelligence/engines/predictionEngine')
const { chatWithCopilot } = require('./copilotController')

// ==========================================
// 1. REUSABLE CALCULATION UTILITIES
// ==========================================

/**
 * Calculates the percentage of marks earned in a subject.
 */
const calculateSubjectPercentage = (subject) => {
  if (subject.assessments && subject.assessments.length > 0) {
    let totalScore = 0
    let totalMaxScore = 0
    let hasWeightedAssessments = subject.assessments.some(a => a.weightage > 0)

    if (hasWeightedAssessments) {
      let weightedSum = 0
      let totalWeight = 0
      subject.assessments.forEach(a => {
        const weight = a.weightage || 0
        weightedSum += (a.score / a.maxScore) * weight
        totalWeight += weight
      })
      return totalWeight > 0 ? parseFloat(((weightedSum / totalWeight) * 100).toFixed(2)) : 0
    }

    subject.assessments.forEach(a => {
      totalScore += a.score
      totalMaxScore += a.maxScore
    })
    return totalMaxScore > 0 ? parseFloat(((totalScore / totalMaxScore) * 100).toFixed(2)) : 0
  }
  return parseFloat(((subject.finalGrade || 0) * 10).toFixed(2))
}

/**
 * Helper to enrich AcademicRecord object with dynamic subject health and legacy properties.
 */
const enrichRecord = (record) => {
  if (!record) return null
  const recordObj = record.toObject ? record.toObject() : JSON.parse(JSON.stringify(record))
  
  recordObj.cgpa = recordObj.currentCGPA || 0
  recordObj.predictedNextGPA = recordObj.predictedCGPA || 0
  
  const weak = []
  if (recordObj.semesters) {
    recordObj.semesters.forEach(sem => {
      if (sem.subjects) {
        sem.subjects.forEach(sub => {
          sub.health = computeSubjectHealth(sub, sem.status || 'Completed')
          sub.grade = sub.finalGrade || 0

          const gStr = String(sub.grade || '').toUpperCase()
          const isFail = sub.isFailed === true || sub.result === 'FAIL' || gStr === 'F' || gStr === 'FAIL' || gStr === 'FAILED' || gStr === 'AB' || sub.finalGrade === 0 || (sub.credits === 0 && (sub.creditsSecured === 0 || sub.finalGrade === 0 || sub.gradePoints === 0))
          if (isFail) {
            weak.push({
              name: sub.name || sub.subjectName,
              code: sub.code || sub.subjectCode || '',
              semester: sem.semesterNumber,
              isFailed: true
            })
          }
        })
      }
    })
  }
  recordObj.weakSubjects = weak
  return recordObj
}

// ==========================================
// 2. CONTROLLERS
// ==========================================

// GET /api/academics/dashboard
const getDashboard = async (req, res) => {
  try {
    let record = await AcademicRecord.findOne({ user: req.user._id })
    if (!record) {
      return res.status(200).json({ 
        success: true, 
        message: 'No academic record initialized yet.',
        data: null
      })
    }

    const enriched = enrichRecord(record)
    let intelligence = null
    try {
      intelligence = await analyticsService.generateAcademicAnalytics(record)
    } catch (e) {
      intelligence = { healthStatus: 'Healthy' }
    }

    return res.status(200).json({
      success: true,
      message: 'Dashboard loaded successfully.',
      data: {
        currentCGPA: enriched.currentCGPA || 0,
        cgpa: enriched.cgpa || 0,
        targetCGPA: enriched.targetCGPA || null,
        prediction: calculatePrediction(record),
        weakSubjects: enriched.weakSubjects || [],
        semesters: enriched.semesters || [],
        studyPlans: enriched.studyPlans || [],
        intelligence
      }
    })
  } catch (err) {
    console.info('[AcademicsController] Fallback notice:', err?.message)
    return res.status(200).json({ 
      success: true, 
      isOffline: true,
      message: 'Academic dashboard loaded.',
      data: {
        currentCGPA: 0,
        cgpa: 0,
        targetCGPA: null,
        prediction: { isAvailable: false, predictedCGPA: null },
        semesters: [],
        studyPlans: [],
        intelligence: { healthStatus: 'Healthy' }
      }
    })
  }
}

// POST /api/academics/semester
const addSemester = async (req, res) => {
  const { semesterNumber, status } = req.body

  const semNum = parseInt(semesterNumber)
  if (isNaN(semNum) || semNum < 1 || semNum > 8) {
    return res.status(400).json({ 
      success: false, 
      message: 'semesterNumber is required and must be an integer between 1 and 8.',
      errors: []
    })
  }

  const semStatus = status || 'Current'
  if (!['Current', 'Completed'].includes(semStatus)) {
    return res.status(400).json({ 
      success: false, 
      message: "Status must be either 'Current' or 'Completed'.",
      errors: []
    })
  }

  try {
    let record = await AcademicRecord.findOne({ user: req.user._id })
    if (!record) {
      record = new AcademicRecord({ user: req.user._id, semesters: [], studyPlans: [] })
    }

    const exists = record.semesters.some(s => s.semesterNumber === semNum)
    if (exists) {
      return res.status(400).json({ 
        success: false, 
        message: `Semester ${semNum} already exists in your academic record.`,
        errors: []
      })
    }

    if (semStatus === 'Current') {
      record.semesters.forEach(s => {
        if (s.status === 'Current') {
          s.status = 'Completed'
        }
      })
    }

    record.semesters.push({
      semesterNumber: semNum,
      status: semStatus,
      sgpa: 0,
      subjects: []
    })

    record.semesters.sort((a, b) => a.semesterNumber - b.semesterNumber)
    await record.save()
    try {
      if (typeof target === 'number' && !isNaN(target)) {
        createNotification({
          userId: req.user._id,
          type: 'academic',
          eventKey: `acad-target-${Date.now()}`,
          title: 'Target CGPA Updated',
          message: `Your target CGPA has been set to ${target.toFixed(2)}.`,
          icon: '🎯',
          route: '/academics/performance',
          metadata: { targetCGPA: target }
        }).catch(() => {})
      }
    } catch (_) {}

    res.status(200).json({ 
      success: true, 
      message: 'Semester created successfully.',
      data: enrichRecord(record) 
    })
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: err.message || 'Internal Server Error',
      errors: []
    })
  }
}

// POST /api/academics/subject
const addSubject = async (req, res) => {
  const { semesterNumber, name, credits, attendance, finalGrade } = req.body

  const semNum = parseInt(semesterNumber)
  if (isNaN(semNum) || semNum < 1 || semNum > 8) {
    return res.status(400).json({ 
      success: false, 
      message: 'semesterNumber is required and must be an integer between 1 and 8.',
      errors: []
    })
  }

  if (!name || typeof name !== 'string' || name.trim().length < 3) {
    return res.status(400).json({ 
      success: false, 
      message: 'Subject name is required and must be at least 3 characters long.',
      errors: []
    })
  }

  const subCredits = parseInt(credits)
  if (isNaN(subCredits) || subCredits < 0 || subCredits > 10) {
    return res.status(400).json({ 
      success: false, 
      message: 'Credits are required and must be a number between 0 and 10.',
      errors: []
    })
  }

  const subAttendance = parseFloat(attendance)
  if (isNaN(subAttendance) || subAttendance < 0 || subAttendance > 100) {
    return res.status(400).json({ 
      success: false, 
      message: 'Attendance is required and must be a number between 0 and 100.',
      errors: []
    })
  }

  const subGrade = parseFloat(finalGrade || 0)
  if (isNaN(subGrade) || subGrade < 0 || subGrade > 10) {
    return res.status(400).json({ 
      success: false, 
      message: 'Final Grade must be a number between 0 and 10.',
      errors: []
    })
  }

  try {
    let record = await AcademicRecord.findOne({ user: req.user._id })
    if (!record) {
      record = new AcademicRecord({ user: req.user._id, semesters: [], studyPlans: [] })
    }

    let targetSem = record.semesters.find(s => s.semesterNumber === semNum)
    if (!targetSem) {
      record.semesters.push({
        semesterNumber: semNum,
        status: 'Current',
        sgpa: 0,
        subjects: []
      })
      targetSem = record.semesters.find(s => s.semesterNumber === semNum)
    }

    const nameLower = name.trim().toLowerCase()
    const duplicate = targetSem.subjects.some(s => s.name.toLowerCase() === nameLower)
    if (duplicate) {
      return res.status(400).json({ 
        success: false, 
        message: `Subject '${name}' already exists in Semester ${semNum}.`,
        errors: []
      })
    }

    targetSem.subjects.push({
      name: name.trim(),
      credits: subCredits,
      attendance: subAttendance,
      finalGrade: subGrade,
      assessments: [],
      lastStudied: null
    })

    targetSem.sgpa = calculateSGPA(targetSem.subjects)
    record.currentCGPA = calculateCGPA(record.semesters)
    await record.save()

    await User.findByIdAndUpdate(req.user._id, { cgpa: record.currentCGPA })

    res.status(200).json({ 
      success: true, 
      message: 'Subject added successfully.',
      data: enrichRecord(record) 
    })
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: err.message || 'Internal Server Error',
      errors: []
    })
  }
}

// PUT /api/academics/semester
const editSemester = async (req, res) => {
  const { semesterNumber, status } = req.body
  const semNum = parseInt(semesterNumber)
  if (isNaN(semNum) || semNum < 1 || semNum > 8) {
    return res.status(400).json({ 
      success: false, 
      message: 'semesterNumber is required and must be an integer between 1 and 8.' 
    })
  }

  if (status && !['Current', 'Completed'].includes(status)) {
    return res.status(400).json({ 
      success: false, 
      message: "Status must be either 'Current' or 'Completed'." 
    })
  }

  try {
    const record = await AcademicRecord.findOne({ user: req.user._id })
    if (!record) {
      return res.status(404).json({ success: false, message: 'Academic record not found.' })
    }

    const sem = record.semesters.find(s => s.semesterNumber === semNum)
    if (!sem) {
      return res.status(404).json({ success: false, message: `Semester ${semNum} not found.` })
    }

    if (status) {
      sem.status = status
      if (status === 'Current') {
        record.semesters.forEach(s => {
          if (s.semesterNumber !== semNum && s.status === 'Current') {
            s.status = 'Completed'
          }
        })
      }
    }

    await record.save()
    res.status(200).json({ 
      success: true, 
      message: 'Semester updated successfully.', 
      data: enrichRecord(record) 
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Internal Server Error' })
  }
}

// DELETE /api/academics/semester/:semesterNumber
const deleteSemester = async (req, res) => {
  const semNum = parseInt(req.params.semesterNumber)
  if (isNaN(semNum) || semNum < 1 || semNum > 8) {
    return res.status(400).json({ 
      success: false, 
      message: 'semesterNumber is required and must be an integer between 1 and 8.' 
    })
  }

  try {
    const record = await AcademicRecord.findOne({ user: req.user._id })
    if (!record) {
      return res.status(404).json({ success: false, message: 'Academic record not found.' })
    }

    const initialLength = record.semesters.length
    record.semesters = record.semesters.filter(s => s.semesterNumber !== semNum)

    if (record.semesters.length === initialLength) {
      return res.status(404).json({ success: false, message: `Semester ${semNum} not found.` })
    }

    record.currentCGPA = calculateCGPA(record.semesters)
    await record.save()

    await User.findByIdAndUpdate(req.user._id, { cgpa: record.currentCGPA })

    res.status(200).json({ 
      success: true, 
      message: `Semester ${semNum} deleted successfully.`, 
      data: enrichRecord(record) 
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Internal Server Error' })
  }
}

// PUT /api/academics/subject
const editSubject = async (req, res) => {
  const { semesterNumber, subjectId, name, credits, attendance, finalGrade } = req.body
  const semNum = parseInt(semesterNumber)
  if (isNaN(semNum) || semNum < 1 || semNum > 8) {
    return res.status(400).json({ 
      success: false, 
      message: 'semesterNumber is required and must be an integer between 1 and 8.' 
    })
  }

  if (!subjectId) {
    return res.status(400).json({ success: false, message: 'subjectId is required.' })
  }

  try {
    const record = await AcademicRecord.findOne({ user: req.user._id })
    if (!record) {
      return res.status(404).json({ success: false, message: 'Academic record not found.' })
    }

    const sem = record.semesters.find(s => s.semesterNumber === semNum)
    if (!sem) {
      return res.status(404).json({ success: false, message: `Semester ${semNum} not found.` })
    }

    const sub = sem.subjects.find(s => String(s._id) === String(subjectId))
    if (!sub) {
      return res.status(404).json({ success: false, message: 'Subject not found.' })
    }

    if (name) {
      const nameLower = name.trim().toLowerCase()
      const duplicate = sem.subjects.some(s => String(s._id) !== String(subjectId) && s.name.toLowerCase() === nameLower)
      if (duplicate) {
        return res.status(400).json({ 
          success: false, 
          message: `Subject '${name}' already exists in Semester ${semNum}.` 
        })
      }
      sub.name = name.trim()
    }

    if (credits !== undefined) {
      const cred = parseInt(credits)
      if (isNaN(cred) || cred < 0 || cred > 10) {
        return res.status(400).json({ success: false, message: 'Credits must be between 0 and 10.' })
      }
      sub.credits = cred
    }

    if (attendance !== undefined) {
      const att = parseFloat(attendance)
      if (isNaN(att) || att < 0 || att > 100) {
        return res.status(400).json({ success: false, message: 'Attendance must be between 0 and 100.' })
      }
      sub.attendance = att
    }

    if (finalGrade !== undefined) {
      const gr = parseFloat(finalGrade)
      if (isNaN(gr) || gr < 0 || gr > 10) {
        return res.status(400).json({ success: false, message: 'Final Grade must be between 0 and 10.' })
      }
      sub.finalGrade = gr
    }

    sem.sgpa = calculateSGPA(sem.subjects)
    record.currentCGPA = calculateCGPA(record.semesters)
    await record.save()

    await User.findByIdAndUpdate(req.user._id, { cgpa: record.currentCGPA })

    res.status(200).json({ 
      success: true, 
      message: 'Subject updated successfully.', 
      data: enrichRecord(record) 
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Internal Server Error' })
  }
}

// DELETE /api/academics/subject/:semesterNumber/:subjectId
const deleteSubject = async (req, res) => {
  const semNum = parseInt(req.params.semesterNumber)
  const subId = req.params.subjectId

  if (isNaN(semNum) || semNum < 1 || semNum > 8) {
    return res.status(400).json({ 
      success: false, 
      message: 'semesterNumber is required and must be an integer between 1 and 8.' 
    })
  }

  if (!subId) {
    return res.status(400).json({ success: false, message: 'subjectId is required.' })
  }

  try {
    const record = await AcademicRecord.findOne({ user: req.user._id })
    if (!record) {
      return res.status(404).json({ success: false, message: 'Academic record not found.' })
    }

    const sem = record.semesters.find(s => s.semesterNumber === semNum)
    if (!sem) {
      return res.status(404).json({ success: false, message: `Semester ${semNum} not found.` })
    }

    const initialLength = sem.subjects.length
    sem.subjects = sem.subjects.filter(s => String(s._id) !== String(subId))

    if (sem.subjects.length === initialLength) {
      return res.status(404).json({ success: false, message: 'Subject not found.' })
    }

    sem.sgpa = calculateSGPA(sem.subjects)
    record.currentCGPA = calculateCGPA(record.semesters)
    await record.save()

    await User.findByIdAndUpdate(req.user._id, { cgpa: record.currentCGPA })

    res.status(200).json({ 
      success: true, 
      message: 'Subject deleted successfully.', 
      data: enrichRecord(record) 
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Internal Server Error' })
  }
}

// GET /api/academics/analytics
const getAnalytics = async (req, res) => {
  try {
    const record = await AcademicRecord.findOne({ user: req.user._id })
    if (!record || !record.semesters || record.semesters.length === 0) {
      const emptyPrediction = calculatePrediction(record)
      return res.status(200).json({
        success: true,
        data: {
          currentCGPA: record?.currentCGPA || 0,
          targetCGPA: record?.targetCGPA || null,
          prediction: emptyPrediction,
          creditsCompleted: 0,
          creditsRemaining: DEFAULT_TOTAL_DEGREE_CREDITS,
          completionPercentage: 0,
          semesterProgress: [],
          bestSemester: null,
          worstSemester: null,
          trend: 'Stable',
          summary: 'No semester data available yet. Upload your first grade memo to activate academic analytics.'
        }
      })
    }

    let totalCredits = 0
    const semesterProgress = []
    let bestSem = null
    let worstSem = null

    const sortedSemesters = [...record.semesters].sort((a, b) => a.semesterNumber - b.semesterNumber)

    sortedSemesters.forEach(sem => {
      let semCredits = 0
      if (sem.subjects) {
        sem.subjects.forEach(sub => {
          semCredits += (sub.credits || 0)
        })
      }
      totalCredits += semCredits
      const sgpaVal = sem.sgpa !== undefined ? Number(sem.sgpa) : 0

      semesterProgress.push({
        semesterNumber: sem.semesterNumber,
        sgpa: sgpaVal,
        credits: semCredits,
        status: sem.status || 'Completed'
      })

      if (sgpaVal > 0) {
        if (!bestSem || sgpaVal > bestSem.sgpa) {
          bestSem = { semesterNumber: sem.semesterNumber, sgpa: sgpaVal }
        }
        if (!worstSem || sgpaVal < worstSem.sgpa) {
          worstSem = { semesterNumber: sem.semesterNumber, sgpa: sgpaVal }
        }
      }
    })

    const totalDegreeCredits = DEFAULT_TOTAL_DEGREE_CREDITS
    const creditsRemaining = Math.max(0, totalDegreeCredits - totalCredits)
    const completionPercentage = Math.min(100, Math.round((totalCredits / totalDegreeCredits) * 100))

    let trend = 'Stable'
    let summary = 'Your academic performance has maintained a consistent SGPA across recent semesters.'

    const validSgpaList = semesterProgress.filter(s => s.sgpa > 0)
    if (validSgpaList.length >= 2) {
      const latest = validSgpaList[validSgpaList.length - 1].sgpa
      const prev = validSgpaList[validSgpaList.length - 2].sgpa
      if (latest > prev) {
        trend = 'Improving'
        summary = `Your SGPA improved from ${prev.toFixed(2)} to ${latest.toFixed(2)} in Semester ${validSgpaList[validSgpaList.length - 1].semesterNumber}, showing strong momentum.`
      } else if (latest < prev) {
        trend = 'Needs Improvement'
        summary = `Performance dipped slightly from ${prev.toFixed(2)} to ${latest.toFixed(2)} in Semester ${validSgpaList[validSgpaList.length - 1].semesterNumber}. Focus on high-credit subjects.`
      } else {
        trend = 'Stable'
        summary = `Your SGPA remained steady at ${latest.toFixed(2)} in your latest semester.`
      }
    } else if (validSgpaList.length === 1) {
      summary = `Semester ${validSgpaList[0].semesterNumber} transcript logged with SGPA ${validSgpaList[0].sgpa.toFixed(2)}. Upload more semesters to track trends.`
    }

    const livePrediction = calculatePrediction(record)
    res.status(200).json({
      success: true,
      data: {
        currentCGPA: record.currentCGPA || 0,
        targetCGPA: record.targetCGPA || null,
        prediction: livePrediction,
        creditsCompleted: totalCredits,
        creditsRemaining,
        completionPercentage,
        semesterProgress,
        bestSemester: bestSem,
        worstSemester: worstSem,
        trend,
        summary
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Internal Server Error' })
  }
}

// GET /api/academics/ai/overview
const getAIOverview = async (req, res) => {
  try {
    const record = await AcademicRecord.findOne({ user: req.user._id })
    const enriched = enrichRecord(record)

    let totalAttendance = 0
    let attCount = 0
    let attentionCount = 0

    if (enriched && enriched.semesters) {
      enriched.semesters.forEach(sem => {
        if (sem.subjects) {
          sem.subjects.forEach(sub => {
            if (sub.attendance !== null && sub.attendance !== undefined) {
              totalAttendance += sub.attendance
              attCount++
            }
            if (isWeakSubject(sub, sem.status || 'Completed')) {
              attentionCount++
            }
          })
        }
      })
    }

    const overallAtt = attCount > 0 ? (totalAttendance / attCount).toFixed(1) + '%' : '100%'
    const attNum = attCount > 0 ? (totalAttendance / attCount) : 100

    res.status(200).json({
      success: true,
      data: {
        currentCGPA: enriched?.currentCGPA || 0,
        targetCGPA: enriched?.targetCGPA || null,
        predictedCGPA: enriched?.predictedCGPA || 0,
        attentionSubjectsCount: attentionCount,
        overallAttendance: overallAtt,
        attendanceStatus: attNum >= 85 ? 'Healthy' : attNum >= 75 ? 'Moderate' : 'Low'
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Internal Server Error' })
  }
}

// POST /api/academics/ai/chat (Backward-compatible wrapper routing to Unified Copilot)
// POST /api/academics/ai/chat (Backward-compatible delegation wrapper to Unified Groq Copilot)
const aiChat = async (req, res) => {
  return chatWithCopilot(req, res)
}

const aiStudyPlan = async (req, res) => {
  try {
    const { planType = 'weekly' } = req.body
    const record = await AcademicRecord.findOne({ user: req.user._id })

    const backlogSubjects = []
    const currentSemSubjects = []
    let nextSemNumber = 1

    if (record?.semesters && record.semesters.length > 0) {
      const sortedSems = [...record.semesters].sort((a, b) => a.semesterNumber - b.semesterNumber)
      const lastSem = sortedSems[sortedSems.length - 1]
      nextSemNumber = lastSem ? lastSem.semesterNumber + 1 : 1

      record.semesters.forEach(sem => {
        if (sem.subjects) {
          sem.subjects.forEach(sub => {
            const gStr = String(sub.grade || '').toUpperCase()
            const isFailed = sub.isFailed === true || sub.result === 'FAIL' || gStr === 'F' || gStr === 'FAIL' || gStr === 'FAILED' || gStr === 'AB' || (sub.credits === 0 && (sub.creditsSecured === 0 || sub.finalGrade === 0 || sub.gradePoints === 0)) || (sub.finalGrade !== undefined && sub.finalGrade !== null && sub.finalGrade < 4.0)
            if (isFailed) {
              backlogSubjects.push(sub.name)
            } else if (sem.status === 'Current') {
              currentSemSubjects.push(sub.name)
            }
          })
        }
      })
    }

    let prioritySubjects = []
    let planHeaderNote = ''
    let isBacklogPlan = false

    if (backlogSubjects.length > 0) {
      prioritySubjects = backlogSubjects
      isBacklogPlan = true
      planHeaderNote = `Focus study blocks on clearing active backlog re-exams: ${backlogSubjects.join(', ')}.`
    } else if (currentSemSubjects.length > 0) {
      prioritySubjects = currentSemSubjects
      planHeaderNote = `Follow this ${planType} plan to master your active semester courses.`
    } else {
      // All past imported semesters passed cleanly! Plan for Next Semester & Advanced Core Skills
      const nextSemSubjectCatalog = {
        2: ['Ordinary Differential Equations', 'Applied Physics', 'Data Structures', 'English Communication'],
        3: ['Digital Electronics', 'Python Programming', 'Computer Organization', 'Java OOP'],
        4: ['Design & Analysis of Algorithms', 'Operating Systems', 'Database Management Systems', 'Software Engineering'],
        5: ['Computer Networks', 'Web Technologies', 'Artificial Intelligence', 'Automata Theory'],
        6: ['Compiler Design', 'Cloud Computing', 'Machine Learning', 'Cyber Security'],
        7: ['Distributed Systems', 'Big Data Analytics', 'DevOps & Microservices', 'Major Capstone Project'],
        8: ['Full Stack Capstone Project', 'Industrial Internship', 'System Design']
      }
      const targetSemKey = nextSemNumber <= 8 ? nextSemNumber : 8
      prioritySubjects = nextSemSubjectCatalog[targetSemKey] || ['Design & Analysis of Algorithms', 'Database Management Systems', 'Operating Systems', 'Full Stack Development']
      planHeaderNote = `🎉 All past semesters passed! Pre-study schedule generated for Semester ${targetSemKey} & Advanced Core Mastery.`
    }

    const s0 = prioritySubjects[0] || 'Core Concepts'
    const s1 = prioritySubjects[1] || prioritySubjects[0] || 'Problem Solving'
    const s2 = prioritySubjects[2] || prioritySubjects[0] || 'Practical Applications'

    const schedule = [
      { 
        timeSlot: '09:00 AM - 10:30 AM', 
        task: isBacklogPlan ? `Re-exam prep & core revision for ${s0}` : `Deep dive into ${s0} core concepts & theory`, 
        focus: isBacklogPlan ? '⚠️ Backlog Recovery Focus' : 'Core Concept Mastery' 
      },
      { 
        timeSlot: '11:00 AM - 12:30 PM', 
        task: isBacklogPlan ? `Solve past question papers for ${s1}` : `Solve practice problems & lab exercises for ${s1}`, 
        focus: 'Problem Solving & Labs' 
      },
      { 
        timeSlot: '02:00 PM - 03:30 PM', 
        task: `Hands-on project work & code implementation for ${s2}`, 
        focus: 'Practical Work & Coding' 
      },
      { 
        timeSlot: '04:00 PM - 05:00 PM', 
        task: 'Active recall revision & weekly self-assessment summary', 
        focus: 'Retention & Review' 
      }
    ]

    res.status(200).json({
      success: true,
      data: {
        planType,
        schedule,
        recommendation: planHeaderNote
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Study plan generation error.' })
  }
}

// POST /api/academics/ai/cgpa-predict
const aiCgpaPredict = async (req, res) => {
  try {
    const { expectedSGPA = 8.5, remainingCredits = 20 } = req.body
    const record = await AcademicRecord.findOne({ user: req.user._id })

    const currentCGPA = record?.currentCGPA || 8.0
    const targetCGPA = record?.targetCGPA || 8.0

    let completedCredits = 0
    if (record?.semesters) {
      record.semesters.forEach(sem => {
        if (sem.subjects) {
          sem.subjects.forEach(sub => {
            completedCredits += (sub.credits || 0)
          })
        }
      })
    }
    if (completedCredits === 0) completedCredits = 20

    const remCreditsNum = Number(remainingCredits) > 0 ? Number(remainingCredits) : 20
    const totalCredits = completedCredits + remCreditsNum

    // Mathematical formula
    const predictedCGPA = parseFloat((((currentCGPA * completedCredits) + (Number(expectedSGPA) * remCreditsNum)) / totalCredits).toFixed(2))
    const requiredSGPA = parseFloat((((targetCGPA * totalCredits) - (currentCGPA * completedCredits)) / remCreditsNum).toFixed(2))

    res.status(200).json({
      success: true,
      data: {
        predictedCGPA,
        requiredSGPA: Math.max(0, requiredSGPA),
        targetCGPA,
        isAchievable: requiredSGPA <= 10.0
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'CGPA prediction error.' })
  }
}

// GET /api/academics/ai/recommendations
const getAIRecommendations = async (req, res) => {
  try {
    const record = await AcademicRecord.findOne({ user: req.user._id })
    const recommendations = []

    if (record?.semesters) {
      record.semesters.forEach(sem => {
        if (sem.subjects) {
          sem.subjects.forEach(sub => {
            const att = sub.attendance || 100
            const grade = sub.finalGrade !== undefined ? Number(sub.finalGrade) : 0

            if (att < WEAK_SUBJECT_ATTENDANCE_THRESHOLD) {
              recommendations.push({
                subject: sub.name,
                type: 'Attendance Alert',
                recommendation: `Improve ${sub.name} attendance above ${WEAK_SUBJECT_ATTENDANCE_THRESHOLD}% (currently ${att}%) to qualify for university exams.`,
                priority: 'High'
              })
            }
            const isFailed = (grade > 0 && grade < 4.0) || sub.result === 'FAIL'
            const isCompleted = sem.status === 'Completed'
            if (isFailed) {
              recommendations.push({
                subject: sub.name,
                type: 'Backlog Re-Exam Recovery',
                recommendation: `Prepare backlog study materials for ${sub.name} (Semester ${sem.semesterNumber}) to clear the arrear examination.`,
                priority: 'High'
              })
            } else if (!isCompleted && grade > 0 && grade < WEAK_SUBJECT_GRADE_THRESHOLD) {
              recommendations.push({
                subject: sub.name,
                type: 'Grade Recovery',
                recommendation: `Allocate additional study hours for ${sub.name} before assessments to elevate grade above ${WEAK_SUBJECT_GRADE_THRESHOLD}.`,
                priority: 'High'
              })
            }
            if (sub.credits >= 4) {
              recommendations.push({
                subject: sub.name,
                type: 'High Credit Focus',
                recommendation: `${sub.name} carries ${sub.credits} credits. High performance here strongly influences your overall CGPA.`,
                priority: 'Medium'
              })
            }
          })
        }
      })
    }

    if (recommendations.length === 0) {
      recommendations.push({
        subject: 'Overall Standing',
        type: 'Academic Excellence',
        recommendation: 'All enrolled subjects are currently maintaining strong attendance and grade standing. Keep up the solid performance!',
        priority: 'Normal'
      })
    }

    res.status(200).json({
      success: true,
      data: { recommendations: recommendations.slice(0, 5) }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Internal Server Error' })
  }
}

// GET /api/academics/ai/alerts
const getAIAlerts = async (req, res) => {
  try {
    const record = await AcademicRecord.findOne({ user: req.user._id })
    const alerts = []

    if (record?.semesters) {
      record.semesters.forEach(sem => {
        if (sem.subjects) {
          sem.subjects.forEach(sub => {
            const att = sub.attendance || 100
            const grade = sub.finalGrade !== undefined ? Number(sub.finalGrade) : 0

            if (att < WEAK_SUBJECT_ATTENDANCE_THRESHOLD) {
              alerts.push({
                id: `att-${sem.semesterNumber}-${sub.name}`,
                title: `Low Attendance: ${sub.name}`,
                message: `Attendance is ${att}% in Semester ${sem.semesterNumber}. Must reach at least ${WEAK_SUBJECT_ATTENDANCE_THRESHOLD}%.`,
                severity: 'High'
              })
            }
            if (grade > 0 && grade < 5.0) {
              alerts.push({
                id: `grade-${sem.semesterNumber}-${sub.name}`,
                title: `Subject Recovery Needed: ${sub.name}`,
                message: `Current grade is ${grade.toFixed(2)}. Requires remedial study to clear backlog.`,
                severity: 'Critical'
              })
            }
          })
        }
      })
    }

    res.status(200).json({
      success: true,
      data: { alerts }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Internal Server Error' })
  }
}

// Stubs for backward compatibility
const addCGPA = async (req, res) => {
  const { semesterNumber, subjects } = req.body
  if (!semesterNumber || !subjects || subjects.length === 0) {
    return res.status(400).json({ success: false, message: 'semesterNumber and subjects are required.' })
  }

  try {
    let record = await AcademicRecord.findOne({ user: req.user._id })
    if (!record) {
      record = new AcademicRecord({ user: req.user._id, semesters: [], studyPlans: [] })
    }

    let targetSem = record.semesters.find(s => s.semesterNumber === semesterNumber)
    if (!targetSem) {
      record.semesters.push({ semesterNumber, status: 'Completed', sgpa: 0, subjects: [] })
      targetSem = record.semesters.find(s => s.semesterNumber === semesterNumber)
    }

    subjects.forEach(sub => {
      const duplicate = targetSem.subjects.find(s => s.name.toLowerCase() === sub.name.toLowerCase())
      if (!duplicate) {
        targetSem.subjects.push({
          name: sub.name,
          credits: sub.credits || 3,
          attendance: sub.attendance || 100,
          finalGrade: sub.grade || 0,
          assessments: [],
          lastStudied: null
        })
      }
    })

    targetSem.sgpa = calculateSGPA(targetSem.subjects)
    record.currentCGPA = calculateCGPA(record.semesters)
    await record.save()

    await User.findByIdAndUpdate(req.user._id, { cgpa: record.currentCGPA })

    res.status(200).json({ success: true, message: 'CGPA updated successfully.', data: enrichRecord(record) })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Internal Server Error' })
  }
}

const predictGPA = async (req, res) => {
  try {
    const record = await AcademicRecord.findOne({ user: req.user._id })
    const cgpaVal = record ? record.currentCGPA : 0
    res.status(200).json({ success: true, message: 'Prediction generated.', data: { predictedNextGPA: 0, cgpa: cgpaVal } })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Internal Server Error' })
  }
}

const getWeakSubjects = async (req, res) => {
  res.status(200).json({ success: true, message: 'Weak subjects retrieved.', data: { weakSubjects: [] } })
}

const getStudyPlan = async (req, res) => {
  res.status(200).json({ success: true, message: 'Study plan generated.', data: { studyPlan: [] } })
}


// PUT /api/academics/target-cgpa
const updateTargetCGPA = async (req, res) => {
  const { targetCGPA } = req.body
  const target = parseFloat(targetCGPA)
  if (isNaN(target) || target < 0 || target > 10) {
    return res.status(400).json({
      success: false,
      message: 'targetCGPA must be a number between 0 and 10.'
    })
  }
  try {
    let record = await AcademicRecord.findOne({ user: req.user._id })
    if (!record) {
      record = new AcademicRecord({ user: req.user._id, semesters: [], studyPlans: [] })
    }
    record.targetCGPA = parseFloat(target.toFixed(2))
    await record.save()

    try {
      await createNotification({
        userId: req.user._id,
        type: 'academic',
        eventKey: `target_cgpa_${Date.now()}`,
        title: 'Target CGPA Updated 🎯',
        message: `Your target CGPA is now set to ${record.targetCGPA.toFixed(2)}. ZenScore AI is tracking your trajectory!`,
        icon: '🎯',
        priority: 'medium',
        route: '/academics'
      })
    } catch (_) {}

    const prediction = calculatePrediction(record)
    return res.status(200).json({
      success: true,
      message: 'Target CGPA updated successfully.',
      data: { targetCGPA: record.targetCGPA, prediction }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Internal Server Error' })
  }
}
module.exports = {
  getDashboard,
  addSemester,
  addSubject,
  editSemester,
  deleteSemester,
  editSubject,
  deleteSubject,
  addCGPA,
  predictGPA,
  getWeakSubjects,
  getStudyPlan,
  getAnalytics,
  getAIOverview,
  aiChat,
  aiStudyPlan,
  aiCgpaPredict,
  getAIRecommendations,
  getAIAlerts,
  updateTargetCGPA
}
