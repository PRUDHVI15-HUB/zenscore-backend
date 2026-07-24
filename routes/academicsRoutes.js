const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/authMiddleware')
const {
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
  getStudyPlan
} = require('../controllers/academicsController')

// Enforce JWT session protection globally for all academics routes
router.use(protect)

// Core Endpoints (Dashboard v1.0 specifications)
router.get('/dashboard', getDashboard)
router.post('/semester', addSemester)
router.put('/semester', editSemester)
router.delete('/semester/:semesterNumber', deleteSemester)
router.post('/subject', addSubject)
router.put('/subject', editSubject)
router.delete('/subject/:semesterNumber/:subjectId', deleteSubject)

// Legacy Fallback Endpoints for Backward Compatibility
router.post('/cgpa', addCGPA)
router.post('/predict', predictGPA)
router.get('/weak-subjects', getWeakSubjects)
router.post('/study-plan', getStudyPlan)

module.exports = router
