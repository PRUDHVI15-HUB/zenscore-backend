const LAYOUTS = {
  INLINE: 'INLINE',
  VERTICAL: 'VERTICAL',
  MIXED: 'MIXED',
  UNKNOWN: 'UNKNOWN'
}

const DEFAULT_PIPELINE_STATE = {
  confidence: 0,
  warnings: [],
  source: 'Rule-Parser'
}

/**
 * Maps semester number (1-8) to the JNTU-style semester label.
 * e.g. 1 → "I-I", 4 → "II-II", 7 → "IV-I"
 */
const SEMESTER_LABELS = Object.freeze({
  1: 'I-I',
  2: 'I-II',
  3: 'II-I',
  4: 'II-II',
  5: 'III-I',
  6: 'III-II',
  7: 'IV-I',
  8: 'IV-II'
})

/**
 * Subjects with per-subject confidence below this threshold are sent to Groq for verification.
 * 75 is chosen to allow verified-but-OCR-noisy credit strings to pass without Groq.
 */
const CONFIDENCE_THRESHOLD = 75

/**
 * Subjects with confidence below this lower threshold have critical missing data
 * and MUST be verified by Groq.
 */
const GROQ_SUBJECT_THRESHOLD = 55

/**
 * Subjects with finalGrade >= this threshold are considered PASS.
 */
const PASS_GRADE_THRESHOLD = 4

/**
 * Supported document type identifiers from the Document Classifier.
 */
const DOCUMENT_TYPES = Object.freeze({
  DIGITAL_PDF: 'DIGITAL_PDF',     // Native text layer PDF
  SCANNED_PDF: 'SCANNED_PDF',     // Image-based PDF requiring OCR
  SCREENSHOT: 'SCREENSHOT',       // PNG/JPEG screenshot
  PHOTO: 'PHOTO',                 // Camera photo of transcript
  UNKNOWN: 'UNKNOWN'
})

module.exports = {
  LAYOUTS,
  DEFAULT_PIPELINE_STATE,
  SEMESTER_LABELS,
  CONFIDENCE_THRESHOLD,
  GROQ_SUBJECT_THRESHOLD,
  PASS_GRADE_THRESHOLD,
  DOCUMENT_TYPES
}
