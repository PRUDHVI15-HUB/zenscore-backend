const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/authMiddleware')
const { uploadTranscript, handleUploadError } = require('../middleware/uploadMiddleware')
const {
  uploadAndProcessTranscript,
  getImportSession,
  deleteImportSession,
  confirmImportSession
} = require('../controllers/ocrController')

// Core Endpoint: Upload and process student transcript document
router.post('/upload', protect, uploadTranscript, handleUploadError, uploadAndProcessTranscript)

// Retrieve a temporary import session by ID for review
router.get('/session/:id', protect, getImportSession)

// Cancel and delete a temporary import session
router.delete('/session/:id', protect, deleteImportSession)

// Confirm and finalize import session, storing records permanently in AcademicRecord
router.post('/confirm/:id', protect, confirmImportSession)

module.exports = router
