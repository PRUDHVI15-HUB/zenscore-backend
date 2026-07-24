const AcademicRecord = require('../models/AcademicRecord')
const User = require('../models/User')
const analyticsService = require('../services/intelligence/analyticsService')
const { calculateSGPA, calculateCGPA } = require('../utils/gpaUtils')

// ==========================================
// 1. REUSABLE CALCULATION UTILITIES
// ==========================================

/**
 * Calculates the percentage of marks earned in a subject.
 * If assessments exist, it is calculated as (Sum of scores / Sum of max scores) * 100.
 * Otherwise, falls back to (finalGrade / 10) * 100.
 * @param {Object} subject - The subject document
 * @returns {Number} Percentage from 0 to 100
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
 * Dynamically computes subject health in the backend.
 * Rules:
 * - Excellent: Grade >= 8.5 AND Attendance >= 85
 * - Needs Work: Grade < 6.5 OR Attendance < 75
 * - Healthy: Default state
 * @param {Object} sub - Subject object
 * @returns {String} 'Excellent' | 'Healthy' | 'Needs Work'
 */
const computeSubjectHealth = (sub) => {
  const grade = sub.finalGrade || 0
  const attendance = sub.attendance || 0
  if (grade >= 8.5 && attendance >= 85) return 'Excellent'
  if (grade < 6.5 || attendance < 75) return 'Needs Work'
  return 'Healthy'
}

/**
 * Helper to enrich AcademicRecord object with dynamic subject health and legacy properties.
 * @param {Object} record - Mongoose document
 * @returns {Object} Plain JS object enriched with dynamic fields
 */
const enrichRecord = (record) => {
  if (!record) return null
  const recordObj = record.toObject ? record.toObject() : JSON.parse(JSON.stringify(record))
  
  // Add root level compatibility aliases to avoid breaking Dashboard.jsx
  recordObj.cgpa = recordObj.currentCGPA || 0
  recordObj.predictedNextGPA = recordObj.predictedCGPA || 0
  recordObj.weakSubjects = [] // Phase 1 stub

  if (recordObj.semesters) {
    recordObj.semesters.forEach(sem => {
      if (sem.subjects) {
        sem.subjects.forEach(sub => {
          sub.health = computeSubjectHealth(sub)
          sub.grade = sub.finalGrade || 0 // subject level compatibility alias
        })
      }
    })
  }
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
      return res.status(404).json({ 
        success: false, 
        message: 'Academic record not found.'
      })
    }

    const enriched = enrichRecord(record)
    const intelligence = await analyticsService.generateAcademicAnalytics(record)

    return res.status(200).json({
      success: true,
      message: 'Dashboard loaded successfully.',
      data: {
        currentCGPA: enriched.currentCGPA || 0,
        cgpa: enriched.cgpa || 0,
        targetCGPA: enriched.targetCGPA || 8.0,
        predictedCGPA: enriched.predictedCGPA || 0,
        predictedNextGPA: enriched.predictedNextGPA || 0,
        predictionInsights: enriched.predictionInsights || [],
        predictionLastUpdated: enriched.predictionLastUpdated || null,
        semesters: enriched.semesters || [],
        studyPlans: enriched.studyPlans || [],
        intelligence
      }
    })
  } catch (err) {
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to load academic dashboard.'
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

    // Enforce uniqueness of semesterNumber per record
    const exists = record.semesters.some(s => s.semesterNumber === semNum)
    if (exists) {
      return res.status(400).json({ 
        success: false, 
        message: `Semester ${semNum} already exists in your academic record.`,
        errors: []
      })
    }

    // Enforce status constraints: If status is 'Current', set other semesters to 'Completed'
    if (semStatus === 'Current') {
      record.semesters.forEach(s => {
        if (s.status === 'Current') {
          s.status = 'Completed'
        }
      })
    }

    // Add new semester
    record.semesters.push({
      semesterNumber: semNum,
      status: semStatus,
      sgpa: 0,
      subjects: []
    })

    // Sort semesters by semesterNumber
    record.semesters.sort((a, b) => a.semesterNumber - b.semesterNumber)

    await record.save()
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
  if (isNaN(subCredits) || subCredits < 1 || subCredits > 6) {
    return res.status(400).json({ 
      success: false, 
      message: 'Credits are required and must be an integer between 1 and 6.',
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
    const record = await AcademicRecord.findOne({ user: req.user._id })
    if (!record) {
      return res.status(404).json({ 
        success: false, 
        message: 'Academic record not found. Please create a semester first.',
        errors: []
      })
    }

    const targetSem = record.semesters.find(s => s.semesterNumber === semNum)
    if (!targetSem) {
      return res.status(404).json({ 
        success: false, 
        message: `Semester ${semNum} not found. Please add the semester first.`,
        errors: []
      })
    }

    // Check for duplicate subject name within the target semester
    const nameLower = name.trim().toLowerCase()
    const duplicate = targetSem.subjects.some(s => s.name.toLowerCase() === nameLower)
    if (duplicate) {
      return res.status(400).json({ 
        success: false, 
        message: `Subject '${name}' already exists in Semester ${semNum}.`,
        errors: []
      })
    }

    // Append subject
    targetSem.subjects.push({
      name: name.trim(),
      credits: subCredits,
      attendance: subAttendance,
      finalGrade: subGrade,
      assessments: [],
      lastStudied: null
    })

    // Recalculate SGPA for the target semester
    targetSem.sgpa = calculateSGPA(targetSem.subjects)

    // Recalculate CGPA across all semesters
    record.currentCGPA = calculateCGPA(record.semesters)

    await record.save()

    // Sync CGPA to User collection
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

// ==========================================
// 3. PHASE 1 COMPATIBILITY STUBS
// ==========================================

const addCGPA = async (req, res) => {
  // Backward compatibility route wrapper mapping to addSubject
  const { semesterNumber, subjects } = req.body
  if (!semesterNumber || !subjects || subjects.length === 0) {
    return res.status(400).json({ 
      success: false, 
      message: 'semesterNumber and subjects are required.',
      errors: []
    })
  }

  try {
    let record = await AcademicRecord.findOne({ user: req.user._id })
    if (!record) {
      record = new AcademicRecord({ user: req.user._id, semesters: [], studyPlans: [] })
    }

    let targetSem = record.semesters.find(s => s.semesterNumber === semesterNumber)
    if (!targetSem) {
      record.semesters.push({
        semesterNumber,
        status: 'Completed',
        sgpa: 0,
        subjects: []
      })
      targetSem = record.semesters.find(s => s.semesterNumber === semesterNumber)
    }

    // Append parsed subjects
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

    // Sync to User collection
    await User.findByIdAndUpdate(req.user._id, { cgpa: record.currentCGPA })

    res.status(200).json({ 
      success: true, 
      message: 'CGPA updated successfully.',
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

const predictGPA = async (req, res) => {
  // Stub for Phase 3 calculation. Returns empty/initialized prediction fields.
  try {
    const record = await AcademicRecord.findOne({ user: req.user._id })
    const cgpaVal = record ? record.currentCGPA : 0
    res.status(200).json({ 
      success: true, 
      message: 'Prediction generated successfully.',
      data: { predictedNextGPA: 0, cgpa: cgpaVal, message: "AI Prediction is disabled in Phase 1." } 
    })
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: err.message || 'Internal Server Error',
      errors: []
    })
  }
}

const getWeakSubjects = async (req, res) => {
  // Stub for Phase 5 detection. Returns empty/initialized arrays.
  res.status(200).json({ 
    success: true, 
    message: 'Weak subjects retrieved successfully.',
    data: { weakSubjects: [] } 
  })
}

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
      // If setting this semester to Current, change others to Completed
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

    // Sync to User profile
    await User.findByIdAndUpdate(req.user._id, { cgpa: record.currentCGPA })

    res.status(200).json({ 
      success: true, 
      message: 'Semester deleted successfully.', 
      data: enrichRecord(record) 
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Internal Server Error' })
  }
}

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
      if (isNaN(cred) || cred < 1 || cred > 6) {
        return res.status(400).json({ success: false, message: 'Credits must be between 1 and 6.' })
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

    // Sync to User profile
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

    // Sync to User profile
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

const getStudyPlan = async (req, res) => {
  // Stub for Phase 4 planner. Returns empty/initialized lists.
  res.status(200).json({ 
    success: true, 
    message: 'Study plan generated successfully.',
    data: { studyPlan: [] } 
  })
}

module.exports = {
  getDashboard,
  addSemester,
  addSubject,
  editSemester,
  deleteSemester,
  editSubject,
  deleteSubject,
  calculateSubjectPercentage,
  calculateSGPA,
  calculateCGPA,
  addCGPA,      // Exported for compatibility
  predictGPA,     // Exported for compatibility
  getWeakSubjects,// Exported for compatibility
  getStudyPlan    // Exported for compatibility
}
