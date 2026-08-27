const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/authMiddleware')
const {
  uploadMiddleware,
  uploadResume,
  getResumeHistory,
  getResumeById,
  deleteResume,
  matchJobDescription,
  createDraft,
  updateDraft,
  getDraft,
  improveDraftSection,
  finalizeDraft,
  discardDraft,
  getResumeVersions
} = require('../controllers/resumeController')

// All resume endpoints are protected with JWT authentication
router.use(protect)

// POST /api/resume/upload - Multipart resume upload & parsing
router.post('/upload', uploadMiddleware, uploadResume)

// POST /api/resume/job-match & alias /match-jd
router.post('/job-match', matchJobDescription)
router.post('/match-jd', matchJobDescription)

// Phase 7 Draft & Versioning Endpoints
router.post('/draft/improve', improveDraftSection)
router.post('/improve-section', improveDraftSection) // Route alias for compatibility
router.post('/:id/draft', createDraft)
router.get('/:id/draft', getDraft)
router.patch('/:id/draft', updateDraft)
router.post('/:id/draft/finalize', finalizeDraft)
router.delete('/:id/draft', discardDraft)
router.get('/:id/versions', getResumeVersions)

// GET /api/resume & /api/resume/my-resumes - Get resume upload history
router.get('/', getResumeHistory)
router.get('/my-resumes', getResumeHistory)

// GET /api/resume/:id - Get specific resume by ID
router.get('/:id', getResumeById)

// DELETE /api/resume/:id - Delete resume by ID
router.delete('/:id', deleteResume)

module.exports = router
