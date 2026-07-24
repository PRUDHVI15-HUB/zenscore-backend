const multer = require('multer')

// Reusable Configuration Constants
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg'
]

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB

/**
 * Validates the MIME type against the allowed list.
 * @param {string} mimeType - The file's MIME type
 * @returns {boolean} True if allowed
 */
const isValidMimeType = (mimeType) => {
  return ALLOWED_MIME_TYPES.includes(mimeType)
}

// Multer Storage configuration (Memory only, no disk writes)
const storage = multer.memoryStorage()

// Multer File filtering logic
const fileFilter = (req, file, cb) => {
  if (!file) {
    return cb(new Error('No transcript file was uploaded.'))
  }
  if (!isValidMimeType(file.mimetype)) {
    return cb(new Error('Only PDF, PNG, JPG and JPEG files are supported.'))
  }
  cb(null, true)
}

// Multer instance for single file upload on field 'file'
const uploadSingle = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES
  },
  fileFilter
}).single('file')

/**
 * Express middleware to trigger file upload and run metadata validations.
 */
const uploadTranscript = (req, res, next) => {
  uploadSingle(req, res, (err) => {
    if (err) {
      return next(err)
    }

    // Check if file is completely missing
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No transcript file was uploaded.',
        errors: []
      })
    }

    // Safety checks: reject empty or corrupted buffers
    if (
      !req.file.originalname || 
      !req.file.mimetype || 
      !req.file.buffer || 
      req.file.size === 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'Uploaded file is empty or corrupted.',
        errors: []
      })
    }

    next()
  })
}

/**
 * Express error-handling middleware to intercept and standardize file upload errors.
 */
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File exceeds the maximum size of 5MB.',
        errors: []
      })
    }
    return res.status(400).json({
      success: false,
      message: `File upload error: ${err.message}`,
      errors: []
    })
  }

  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'An unknown error occurred during file upload.',
      errors: []
    })
  }

  next()
}

module.exports = {
  uploadTranscript,
  handleUploadError
}
