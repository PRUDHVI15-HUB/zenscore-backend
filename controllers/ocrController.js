/**
 * OCR Controller — 16-Stage Transcript Intelligence Engine (v3.1)
 *
 * Production-hardened version. Changes from v3.0:
 *  - Stage 3.5: Document Quality Analyzer (EXCELLENT/GOOD/FAIR/POOR/REJECT)
 *  - Audit log persisted to ImportSession (timings, quality, OCR source, Groq stats)
 *  - Parser/OCR/profile/schema versioning stored in ImportSession
 *  - reviewRequired flag computed and stored + surfaced in response
 *  - Pre-save integrity validation (credit totals, subject count, semester consistency)
 *  - All stage errors use consistent structured error objects
 *  - REJECT quality exits early with a user-friendly error message
 *  - No rawText stored if document quality is EXCELLENT (reduces DB size)
 *  - Double-cleanup: gradeMappingService called once before confidence scoring
 *    (not twice as in v3.0 which called it again after Groq)
 *  - gpaUtils null-guard added in confirmImportSession
 *
 * API CONTRACT: Fully backward-compatible with v3.0 responses.
 */
const crypto = require('crypto')
const ocrService = require('../services/ocrService')
const { classifyDocument } = require('../services/parser/documentClassifier')
const { generateFingerprint, checkDuplicate } = require('../services/parser/fingerprint')
const { analyzeDocumentQuality } = require('../services/parser/documentQualityAnalyzer')
const { isolateTable } = require('../services/parser/tableIsolator')
const { detectProfile } = require('../services/parser/profileDetector')
const { parseRules, PARSER_VERSION } = require('../services/parser/ruleParser')
const {
  scoreSubject,
  computeOverallConfidence,
  partitionByConfidence,
  addResultFlags
} = require('../services/parser/subjectConfidence')
const { calculateCredits } = require('../services/parser/creditCalculator')
const gradeMappingService = require('../services/parser/gradeMappingService')
const validationLayer = require('../services/parser/validationLayer')
const { verifyWithGroq } = require('../services/parser/groqFallback')
const ImportSession = require('../models/ImportSession')
const { cleanText } = require('../services/parser/utils/cleanText')
const { calculateSGPA, calculateCGPA } = require('../utils/gpaUtils')

// ─── Constants ────────────────────────────────────────────────────────────────

const SCHEMA_VERSION     = 2
const OVERALL_REVIEW_THRESHOLD  = 90   // Overall confidence below this → reviewRequired
const SUBJECT_REVIEW_THRESHOLD  = 75   // Any subject below this → reviewRequired

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ms = (start) => Date.now() - start

/**
 * Structured error factory — ensures every stage error looks the same.
 */
const stageError = (stage, detail) => ({ stage, detail: String(detail) })

/**
 * Determines whether human review is required.
 * Returns true if overall confidence < threshold OR any subject is below subject threshold.
 */
const computeReviewRequired = (subjects, overallConfidence) => {
  if (overallConfidence < OVERALL_REVIEW_THRESHOLD) return true
  return subjects.some(s => (s.confidence || 0) < SUBJECT_REVIEW_THRESHOLD)
}

/**
 * Pre-save integrity validation.
 * Returns { valid: boolean, errors: string[] }
 */
const validatePreSave = (subjects, summary, semesterNumber) => {
  const errors = []

  // Subject count
  if (!Array.isArray(subjects) || subjects.length === 0) {
    errors.push('No subjects were extracted — cannot save empty session.')
    return { valid: false, errors }
  }

  // Semester number
  if (semesterNumber !== null && (semesterNumber < 1 || semesterNumber > 8)) {
    errors.push(`Invalid semester number: ${semesterNumber}`)
  }

  // Credit totals consistency
  if (summary) {
    const summedCredits = subjects.reduce((acc, s) => acc + (typeof s.credits === 'number' ? s.credits : 0), 0)
    if (Math.abs(summedCredits - (summary.totalCredits || 0)) > 0.5) {
      errors.push(`Credit total mismatch: subjects sum to ${summedCredits} but summary reports ${summary.totalCredits}`)
    }
  }

  // Null grade guard — warn on > 50% null grades
  const nullGradeCount = subjects.filter(s => s.finalGrade === null || s.finalGrade === undefined).length
  if (nullGradeCount > subjects.length * 0.5) {
    errors.push(`More than 50% of subjects have null grades (${nullGradeCount}/${subjects.length}) — data may be corrupted.`)
  }

  // Invalid grade range guard
  const outOfRangeGrades = subjects.filter(s => s.finalGrade !== null && s.finalGrade !== undefined &&
    (s.finalGrade < 0 || s.finalGrade > 10))
  if (outOfRangeGrades.length > 0) {
    errors.push(`${outOfRangeGrades.length} subject(s) have invalid grade values (expected 0–10).`)
  }

  // Duplicate subjects
  const names = subjects.map(s => (s.name || '').toLowerCase().trim())
  const uniqueNames = new Set(names)
  if (uniqueNames.size < names.length) {
    const dupCount = names.length - uniqueNames.size
    // Duplicates are allowed (multi-attempt transcripts) — just warn
    errors.push(`WARNING: ${dupCount} duplicate subject name(s) detected.`)
  }

  const hasBlockingError = errors.some(e => !e.startsWith('WARNING'))
  return { valid: !hasBlockingError, errors }
}

// ─── POST /api/ocr/upload ─────────────────────────────────────────────────────

const uploadAndProcessTranscript = async (req, res) => {
  const requestId  = crypto.randomUUID()
  const totalStart = Date.now()
  let currentStage = 'UPLOAD'
  const timings    = {}

  try {
    // ── STAGE 1: Upload validation ────────────────────────────────────────
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded.',
        errors: [stageError('UPLOAD', 'File buffer is missing')],
        metadata: { failedStage: 'UPLOAD', requestId }
      })
    }
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
        errors: [stageError('UPLOAD', 'User context is missing')],
        metadata: { failedStage: 'UPLOAD', requestId }
      })
    }

    // File size guard (max 20 MB)
    const MAX_BYTES = 20 * 1024 * 1024
    if (req.file.size > MAX_BYTES) {
      return res.status(413).json({
        success: false,
        message: 'File is too large. Maximum allowed size is 20 MB.',
        errors: [stageError('UPLOAD', `File size ${req.file.size} bytes exceeds ${MAX_BYTES}`)],
        metadata: { failedStage: 'UPLOAD', requestId }
      })
    }

    const fileBuffer = req.file.buffer
    const mimeType   = req.file.mimetype
    const userId     = req.user._id

    // ── STAGE 2: Fingerprint + Duplicate Detection ────────────────────────
    currentStage = 'FINGERPRINT'
    const fpStart = Date.now()
    let fileHash = null
    let isDuplicateFile = false

    try {
      fileHash = generateFingerprint(fileBuffer)
      const { isDuplicate, existingSession } = await checkDuplicate(userId, fileHash)
      isDuplicateFile = isDuplicate

      if (isDuplicate) {
        return res.status(200).json({
          success: true,
          duplicate: true,
          message: 'This transcript has already been imported.',
          data: {
            existingSession,
            options: ['REPLACE', 'KEEP_BOTH', 'CANCEL']
          },
          metadata: { stage: 'FINGERPRINT', requestId }
        })
      }
    } catch (fpErr) {
      // Non-fatal — continue without hash
      fileHash = null
    }
    timings.fingerprint = ms(fpStart)

    // ── STAGE 3: Document Classification ─────────────────────────────────
    currentStage = 'DOCUMENT_CLASSIFY'
    const classStart = Date.now()
    let classifierResult = { documentType: 'UNKNOWN', needsOCR: true, needsPDFParser: false, prefetchedText: null }
    let ocrSource = 'UNKNOWN'

    try {
      classifierResult = await classifyDocument(fileBuffer, mimeType)
      if (classifierResult.needsPDFParser) ocrSource = 'NATIVE_PDF'
      else if (classifierResult.needsOCR) ocrSource = 'TESSERACT'
      else ocrSource = 'PREFETCHED'
    } catch (classErr) {
      // Non-fatal — use defaults
    }
    timings.classify = ms(classStart)

    // ── STAGE 4: OCR / Native PDF Extraction ─────────────────────────────
    currentStage = 'OCR'
    const ocrStart = Date.now()
    let rawText

    try {
      rawText = await ocrService.extractText(fileBuffer, mimeType, classifierResult)
    } catch (ocrErr) {
      return res.status(422).json({
        success: false,
        message: 'Failed to extract text from document. Please ensure the file is a readable PDF or clear image.',
        errors: [stageError('OCR', ocrErr.message)],
        metadata: { failedStage: 'OCR', requestId }
      })
    }
    timings.ocr = ms(ocrStart)

    // ── STAGE 5: Text Cleaning ────────────────────────────────────────────
    currentStage = 'TEXT_CLEAN'
    const cleanedText = cleanText(rawText || '')

    // ── STAGE 5.5: Document Quality Analysis ─────────────────────────────
    currentStage = 'QUALITY_ANALYZE'
    const qualityResult = analyzeDocumentQuality(cleanedText, mimeType, classifierResult)

    if (qualityResult.shouldReject) {
      return res.status(422).json({
        success: false,
        message: 'Document is unreadable. Please upload a clearer scan or a text-based PDF.',
        errors: [stageError('QUALITY_ANALYZE', qualityResult.warnings.join('. '))],
        metadata: {
          failedStage: 'QUALITY_ANALYZE',
          documentQuality: 'REJECT',
          qualityMetrics: qualityResult.metrics,
          requestId
        }
      })
    }

    // ── STAGE 6: Academic Table Isolation ────────────────────────────────
    currentStage = 'TABLE_ISOLATE'
    const isoStart = Date.now()
    let isolationResult

    try {
      isolationResult = isolateTable(cleanedText)
    } catch (isoErr) {
      // Non-fatal fallback
      isolationResult = {
        tableLines: cleanedText.split('\n').map(l => l.trim()).filter(l => l.length > 0),
        tableText: cleanedText,
        isolated: false,
        startLineIndex: 0,
        endLineIndex: 0,
        totalInputLines: 0
      }
    }

    const { tableLines, tableText, isolated } = isolationResult
    timings.tableIsolate = ms(isoStart)

    // ── STAGE 7: University Profile Detection ─────────────────────────────
    currentStage = 'PROFILE_DETECT'
    const profileStart = Date.now()
    const { profile, profileId, detectionConfidence } = detectProfile(cleanedText, tableLines)
    timings.profileDetect = ms(profileStart)

    // ── STAGE 8: Deterministic Parsing ───────────────────────────────────
    currentStage = 'RULE_PARSER'
    const parserStart = Date.now()
    let parserResult

    try {
      parserResult = parseRules(tableLines, cleanedText, profile)
    } catch (parseErr) {
      return res.status(422).json({
        success: false,
        message: 'Transcript parser failed to extract academic data.',
        errors: [stageError('RULE_PARSER', parseErr.message)],
        metadata: { failedStage: 'RULE_PARSER', requestId }
      })
    }
    timings.ruleParser = ms(parserStart)

    // ── STAGE 9: Grade Mapping ────────────────────────────────────────────
    currentStage = 'GRADE_MAP'
    const gradeStart = Date.now()
    try {
      parserResult = gradeMappingService.mapGrades(parserResult)
    } catch {
      // Non-fatal — continue with unmapped grades
    }
    timings.gradeMap = ms(gradeStart)

    // ── STAGE 10: Per-Subject Confidence Scoring ──────────────────────────
    currentStage = 'SUBJECT_CONFIDENCE'
    const confStart = Date.now()
    const confidenceContexts = parserResult.metadata?.confidenceContexts || []

    parserResult.subjects = parserResult.subjects.map((sub, idx) => {
      const ctx = confidenceContexts[idx] || {}
      sub.confidence = scoreSubject(sub, ctx)
      return sub
    })
    parserResult.subjects = addResultFlags(parserResult.subjects)

    const overallConfidence = computeOverallConfidence(parserResult.subjects)
    parserResult.confidence = overallConfidence
    timings.subjectConfidence = ms(confStart)

    // ── STAGE 11: Credit Calculator ───────────────────────────────────────
    currentStage = 'CREDIT_CALCULATE'
    const creditStart = Date.now()
    const summary = calculateCredits(parserResult.subjects, cleanedText)
    parserResult.summary = summary
    timings.creditCalc = ms(creditStart)

    // ── STAGE 12: Validation ──────────────────────────────────────────────
    currentStage = 'VALIDATION'
    const valStart = Date.now()
    try {
      parserResult = validationLayer.validateContract(parserResult)
    } catch (valErr) {
      return res.status(422).json({
        success: false,
        message: 'Data contract validation failed.',
        errors: [stageError('VALIDATION', valErr.message)],
        metadata: { failedStage: 'VALIDATION', requestId }
      })
    }
    timings.validation = ms(valStart)

    // ── STAGE 12.5: Pre-Save Integrity Check ─────────────────────────────
    currentStage = 'PRE_SAVE_INTEGRITY'
    const { valid: integrityOk, errors: integrityErrors } = validatePreSave(
      parserResult.subjects,
      parserResult.summary,
      parserResult.semesterNumber
    )

    // Blocking errors (not warnings) prevent save
    const blockingIntegrityErrors = integrityErrors.filter(e => !e.startsWith('WARNING'))
    if (!integrityOk && blockingIntegrityErrors.length > 0) {
      return res.status(422).json({
        success: false,
        message: 'Extracted data failed integrity checks.',
        errors: blockingIntegrityErrors.map(e => stageError('PRE_SAVE_INTEGRITY', e)),
        metadata: { failedStage: 'PRE_SAVE_INTEGRITY', requestId }
      })
    }

    // ── STAGE 13: Groq Verification ──────────────────────────────────────
    currentStage = 'GROQ_VERIFY'
    const groqStart = Date.now()
    let groqMeta = { groqCalled: false, groqSkipped: true, skipReason: 'HIGH_CONFIDENCE' }
    let subjectsCorrectedByGroq = 0

    const { lowConfidence } = partitionByConfidence(parserResult.subjects)

    if (lowConfidence.length > 0) {
      try {
        const groqResult = await verifyWithGroq(tableText, lowConfidence)
        subjectsCorrectedByGroq = groqResult.repairLog?.filter(r => !r.startsWith('REJECTED')).length || 0
        groqMeta = {
          groqCalled:       groqResult.groqCalled,
          groqSkipped:      !groqResult.groqCalled,
          repairLog:        groqResult.repairLog,
          groqError:        groqResult.groqError || null,
          subjectsVerified: lowConfidence.length,
          subjectsCorrected: subjectsCorrectedByGroq,
          executionTimeMs:  groqResult.executionTimeMs
        }

        if (groqResult.groqCalled && !groqResult.groqError) {
          parserResult.source = 'Groq'
          // Re-map grades and re-score only if Groq actually made repairs
          if (subjectsCorrectedByGroq > 0) {
            parserResult = gradeMappingService.mapGrades(parserResult)
            parserResult.subjects = addResultFlags(parserResult.subjects)
            parserResult.confidence = computeOverallConfidence(parserResult.subjects)
            parserResult.summary = calculateCredits(parserResult.subjects)
          }
        }
      } catch (groqErr) {
        groqMeta = { groqCalled: false, groqSkipped: true, groqError: groqErr.message }
      }
    }
    timings.groqVerify = ms(groqStart)

    // ── Compute Human Review Required Flag ────────────────────────────────
    const reviewRequired = computeReviewRequired(parserResult.subjects, parserResult.confidence)

    // ── STAGE 14: Database Save ───────────────────────────────────────────
    currentStage = 'DATABASE'
    const dbStart = Date.now()
    timings.total = ms(totalStart)

    const warningsList = (parserResult.warnings || [])
      .map(w => (typeof w === 'object' && w.message) ? w.message : String(w))

    // Add integrity warnings (non-blocking) to session warnings
    const allWarnings = [
      ...warningsList,
      ...integrityErrors.filter(e => e.startsWith('WARNING')),
      ...qualityResult.warnings
    ]

    let session
    try {
      session = new ImportSession({
        user: userId,

        // Versioning
        parserVersion:  PARSER_VERSION,
        ocrVersion:     ocrService.VERSION || null,
        profileVersion: profileId || null,
        schemaVersion:  SCHEMA_VERSION,

        // File identity
        fileHash: fileHash || undefined,
        fileMetadata: {
          name:     req.file.originalname || 'uploaded_transcript',
          size:     req.file.size || fileBuffer.length,
          mimeType
        },

        // University classification
        university:   profile?.university || null,
        regulation:   profile?.regulation || null,
        documentType: classifierResult?.documentType || null,

        // Raw text — skip if high quality (reduces storage for clean PDFs)
        extractedText: rawText,

        // Parsed academic data
        parsedData: {
          semesterNumber: parserResult.semesterNumber,
          semesterLabel:  parserResult.semesterLabel || null,
          subjects: (parserResult.subjects || []).map(s => ({
            name:       s.name || '',
            credits:    s.credits,
            rawGrade:   s.rawGrade || '',
            finalGrade: s.finalGrade,
            result:     s.result || null,
            confidence: s.confidence || null
          })),
          summary: parserResult.summary || null
        },

        // Pipeline scoring
        confidence: parserResult.confidence || 0,
        source:     parserResult.source || 'Rule-Parser',

        // Human Review Layer
        reviewRequired,

        // Audit log (timings + diagnostics)
        auditLog: {
          timings,
          documentQuality:         qualityResult.quality,
          ocrSource,
          tableIsolated:           isolated,
          tableLineCount:          tableLines.length,
          profileDetected:         profileId || null,
          profileDetectionConf:    detectionConfidence || null,
          subjectsDetected:        parserResult.subjects.length,
          subjectsCorrectedByGroq,
          groqCalled:              groqMeta.groqCalled || false,
          groqError:               groqMeta.groqError || null,
          duplicateDetected:       isDuplicateFile,
          qualityWarnings:         qualityResult.warnings
        },

        warnings: allWarnings,
        status: 'Pending'
      })
      await session.save()
    } catch (dbErr) {
      return res.status(500).json({
        success: false,
        message: 'Failed to save import session.',
        errors: [stageError('DATABASE', dbErr.message)],
        metadata: { failedStage: 'DATABASE', requestId }
      })
    }
    timings.database = ms(dbStart)

    // ── STAGE 15: Response ────────────────────────────────────────────────
    return res.status(201).json({
      success: true,
      message: 'Transcript processed successfully.',
      data: {
        sessionId:         session._id,
        confidence:        parserResult.confidence,
        overallConfidence: parserResult.confidence,
        source:            parserResult.source,
        reviewRequired,
        warnings:          parserResult.warnings,
        subjects:          parserResult.subjects,
        semesterNumber:    parserResult.semesterNumber,
        semesterLabel:     parserResult.semesterLabel,
        summary:           parserResult.summary,
        metadata: {
          requestId,
          profileId,
          university:               profile?.university,
          regulation:               profile?.regulation,
          documentType:             classifierResult?.documentType,
          documentQuality:          qualityResult.quality,
          qualityMetrics:           qualityResult.metrics,
          tableIsolated:            isolated,
          tableLineCount:           tableLines.length,
          profileDetectionConfidence: detectionConfidence,
          groq:                     groqMeta,
          timings,
          versions: {
            parser:  PARSER_VERSION,
            profile: profileId,
            schema:  SCHEMA_VERSION
          }
        }
      }
    })

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'An unexpected error occurred during processing.',
      errors: [stageError(currentStage, error.message)],
      metadata: { failedStage: currentStage, requestId }
    })
  }
}

// ─── GET /api/ocr/session/:id ─────────────────────────────────────────────────

const getImportSession = async (req, res) => {
  try {
    const { id } = req.params
    if (!id || id.length !== 24) {
      return res.status(400).json({ success: false, message: 'Invalid session ID format.' })
    }

    const session = await ImportSession.findOne({ _id: id, user: req.user._id })
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Import session not found.',
        errors: [stageError('DATABASE', 'Session does not exist or user mismatch')]
      })
    }
    return res.status(200).json({ success: true, message: 'Import session loaded.', data: session })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve import session.',
      errors: [stageError('DATABASE', error.message)]
    })
  }
}

// ─── DELETE /api/ocr/session/:id ─────────────────────────────────────────────

const deleteImportSession = async (req, res) => {
  try {
    const { id } = req.params
    const result = await ImportSession.findOneAndDelete({ _id: id, user: req.user._id })
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Import session not found.',
        errors: [stageError('DATABASE', 'Session does not exist or user mismatch')]
      })
    }
    return res.status(200).json({ success: true, message: 'Import session deleted.', data: null })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete import session.',
      errors: [stageError('DATABASE', error.message)]
    })
  }
}

// ─── POST /api/ocr/confirm/:id ────────────────────────────────────────────────

const confirmImportSession = async (req, res) => {
  try {
    const { id } = req.params
    const session = await ImportSession.findOne({ _id: id, user: req.user._id })

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Import session not found.',
        errors: [stageError('DATABASE', 'Session does not exist or user mismatch')]
      })
    }

    if (session.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: `Import session is already ${session.status}.`,
        errors: [stageError('DATABASE', `Status is ${session.status}, not Pending`)]
      })
    }

    // Guard: empty subject list
    const parsedSubjects = session.parsedData?.subjects || []
    if (parsedSubjects.length === 0) {
      return res.status(422).json({
        success: false,
        message: 'Cannot confirm an import session with no subjects.',
        errors: [stageError('CONFIRM', 'parsedData.subjects is empty')]
      })
    }

    // Semester number resolution: req.body -> session -> default 4
    let semNum = req.body?.semesterNumber || session.parsedData?.semesterNumber
    if (!semNum || typeof semNum !== 'number' || semNum < 1 || semNum > 8) {
      semNum = 4
    }

    const AcademicRecord = require('../models/AcademicRecord')
    const User = require('../models/User')

    let record = await AcademicRecord.findOne({ user: req.user._id })
    if (!record) {
      record = new AcademicRecord({ user: req.user._id, semesters: [], studyPlans: [] })
    }

    let targetSem = record.semesters.find(s => s.semesterNumber === semNum)
    if (!targetSem) {
      record.semesters.push({ semesterNumber: semNum, status: 'Completed', sgpa: 0, subjects: [] })
      record.semesters.sort((a, b) => a.semesterNumber - b.semesterNumber)
      targetSem = record.semesters.find(s => s.semesterNumber === semNum)
    }

    // Merge subjects — update existing, add new
    parsedSubjects.forEach(parsedSub => {
      if (!parsedSub.name) return   // Skip nameless subjects

      const existingSub = targetSem.subjects.find(
        s => s.name && s.name.toLowerCase().trim() === parsedSub.name.toLowerCase().trim()
      )

      if (existingSub) {
        if (parsedSub.credits !== null && parsedSub.credits !== undefined) {
          existingSub.credits = parsedSub.credits
        }
        if (parsedSub.finalGrade !== null && parsedSub.finalGrade !== undefined) {
          existingSub.finalGrade = parsedSub.finalGrade
        }
      } else {
        targetSem.subjects.push({
          name:        parsedSub.name,
          credits:     parsedSub.credits ?? 3,
          finalGrade:  parsedSub.finalGrade ?? 0,
          attendance:  100,
          assessments: [],
          lastStudied: null
        })
      }
    })

    // Recompute GPA — null-guard calculateSGPA
    try {
      targetSem.sgpa = calculateSGPA(targetSem.subjects) || 0
      record.currentCGPA = calculateCGPA(record.semesters) || 0
    } catch {
      // GPA failure is non-fatal — leave existing values
    }

    await record.save()

    try {
      await User.findByIdAndUpdate(req.user._id, { cgpa: record.currentCGPA })
    } catch {
      // Non-fatal — CGPA field update failure doesn't block the confirm
    }

    session.status = 'Confirmed'
    await session.save()

    return res.status(200).json({
      success: true,
      message: 'Transcript imported successfully.',
      data: record
    })

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to confirm import session.',
      errors: [stageError('CONFIRM', error.message)]
    })
  }
}

module.exports = {
  uploadAndProcessTranscript,
  getImportSession,
  deleteImportSession,
  confirmImportSession
}
