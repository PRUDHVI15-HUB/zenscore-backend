const mongoose = require('mongoose')

const ImportSessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required']
  },

  // ── Versioning — tracks which engine produced this session ─────────────────
  parserVersion: {
    type: String,
    default: null   // e.g. "3.1.0"
  },
  ocrVersion: {
    type: String,
    default: null   // e.g. "tesseract.js@7.0.0" or "pdf-parse@2.4.5"
  },
  profileVersion: {
    type: String,
    default: null   // profile ID, e.g. "JNTUH_R22"
  },
  schemaVersion: {
    type: Number,
    default: 2       // Increment when parsedData shape changes
  },

  // ── Duplicate detection ────────────────────────────────────────────────────
  fileHash: {
    type: String,
    default: null,
    index: true   // Fast duplicate lookup by (user + fileHash)
  },
  fileMetadata: {
    name: {
      type: String,
      required: [true, 'File name is required']
    },
    size: {
      type: Number,
      required: [true, 'File size is required']
    },
    mimeType: {
      type: String,
      required: [true, 'Mime type is required']
    }
  },

  // ── University / classification metadata ─────────────────────────────────
  university: {
    type: String,
    default: null
  },
  regulation: {
    type: String,
    default: null
  },
  academicYear: {
    type: String,
    default: null
  },
  documentType: {
    type: String,
    default: null
  },

  // ── Raw OCR output ────────────────────────────────────────────────────────
  extractedText: {
    type: String,
    required: [true, 'Extracted text is required']
  },

  // ── Parsed academic data ──────────────────────────────────────────────────
  parsedData: {
    semesterNumber: {
      type: Number,
      default: null,
      validate: {
        validator: function (v) {
          return v === null || (Number.isInteger(v) && v >= 1 && v <= 8)
        },
        message: 'Semester must be an integer between 1 and 8, or null'
      }
    },
    semesterLabel: {
      type: String,
      default: null   // e.g. "IV-I", "II-II"
    },
    subjects: [{
      name: {
        type: String,
        default: ''
      },
      credits: {
        type: Number,
        default: null,
        validate: {
          validator: function (v) {
            return v === null || (Number.isInteger(v) && v >= 0 && v <= 6)
          },
          message: 'Credits must be an integer between 0 and 6, or null'
        }
      },
      rawGrade: {
        type: String,
        default: ''
      },
      finalGrade: {
        type: Number,
        default: null,
        validate: {
          validator: function (v) {
            return v === null || (typeof v === 'number' && v >= 0 && v <= 10)
          },
          message: 'Final Grade must be a number between 0 and 10, or null'
        }
      },
      result: {
        type: String,
        enum: ['PASS', 'FAIL', 'UNKNOWN', null],
        default: null
      },
      confidence: {
        type: Number,
        default: null,
        min: [0, 'Subject confidence cannot be negative'],
        max: [100, 'Subject confidence cannot exceed 100']
      }
    }],

    // ── Semester credit summary ─────────────────────────────────────────────
    summary: {
      totalCredits: { type: Number, default: null },
      earnedCredits: { type: Number, default: null },
      failedCredits: { type: Number, default: null },
      passedSubjects: { type: Number, default: null },
      failedSubjects: { type: Number, default: null },
      semesterStatus: { type: String, default: null },
      completionPercent: { type: Number, default: null }
    }
  },


  // ── Pipeline scoring ──────────────────────────────────────────────────────
  confidence: {
    type: Number,
    required: [true, 'Confidence score is required'],
    min: [0, 'Confidence cannot be less than 0'],
    max: [100, 'Confidence cannot be greater than 100']
  },
  source: {
    type: String,
    enum: {
      values: ['Rule-Parser', 'Groq'],
      message: 'Source must be either Rule-Parser or Groq'
    },
    required: [true, 'Parsing source is required']
  },

  // ── Human Review Layer ─────────────────────────────────────────────────────
  // True when overall confidence < 90% or any subject confidence < 75%.
  // Frontend must display a review UI before the user confirms import.
  reviewRequired: {
    type: Boolean,
    default: false
  },

  // ── Extraction Audit Log ───────────────────────────────────────────────────
  // Persisted without the raw extracted text (that's stored separately).
  auditLog: {
    timings: {
      fingerprint:       { type: Number, default: null },
      classify:          { type: Number, default: null },
      ocr:               { type: Number, default: null },
      tableIsolate:      { type: Number, default: null },
      profileDetect:     { type: Number, default: null },
      ruleParser:        { type: Number, default: null },
      gradeMap:          { type: Number, default: null },
      subjectConfidence: { type: Number, default: null },
      creditCalc:        { type: Number, default: null },
      validation:        { type: Number, default: null },
      groqVerify:        { type: Number, default: null },
      total:             { type: Number, default: null }
    },
    documentQuality:         { type: String, default: null },
    ocrSource:               { type: String, default: null },
    tableIsolated:           { type: Boolean, default: null },
    tableLineCount:          { type: Number, default: null },
    profileDetected:         { type: String, default: null },
    profileDetectionConf:    { type: Number, default: null },
    subjectsDetected:        { type: Number, default: null },
    subjectsCorrectedByGroq: { type: Number, default: null },
    groqCalled:              { type: Boolean, default: false },
    groqError:               { type: String, default: null },
    duplicateDetected:       { type: Boolean, default: false },
    qualityWarnings:         [{ type: String }]
  },

  warnings: [{ type: String }],
  status: {
    type: String,
    enum: {
      values: ['Pending', 'Confirmed', 'Expired'],
      message: 'Status must be Pending, Confirmed, or Expired'
    },
    default: 'Pending',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 3600   // TTL: auto-clean after 60 minutes (was 30)
  }
})

module.exports = mongoose.model('ImportSession', ImportSessionSchema)

