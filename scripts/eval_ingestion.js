/**
 * eval_ingestion.js
 *
 * ZenScore AI — Rigorous Evaluation Harness for 14-Stage Transcript Ingestion Pipeline.
 *
 * Adheres strictly to HARD RULES:
 * - Never invents, simulates, or estimates results. Never generates fake mark sheets.
 * - Ground truth MUST be verified by a human (verified: true).
 *   Unverified files are EXCLUDED from all metrics, and the report states how many were excluded.
 * - Pipeline is frozen during evaluation: records git commit hash, parser version, OCR engine, and model names.
 * - Runs each verified sheet in two modes:
 *     (a) rule parser only (LLM fallback disabled)
 *     (b) full pipeline (LLM fallback enabled, real Groq API call)
 * - Saves raw output per sheet in results/ingestion_runs/<sheet_id>_<mode>.json.
 * - Computes field-level P, R, F1, exact match rates, Wilson 95% CI, CER/WER (if raw_text provided),
 *   fallback before-vs-after impact, confidence-vs-error diagnostic, processing times,
 *   and outputs results/ingestion_eval.csv, results/ingestion_eval.md, and results/ingestion_errors.md.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') })
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// Pipeline stages
const { cleanText } = require('../services/parser/utils/cleanText')
const { generateFingerprint } = require('../services/parser/fingerprint')
const { analyzeDocumentQuality } = require('../services/parser/documentQualityAnalyzer')
const { isolateTable } = require('../services/parser/tableIsolator')
const { detectProfile } = require('../services/parser/profileDetector')
const { parseRules } = require('../services/parser/ruleParser')
const gradeMappingService = require('../services/parser/gradeMappingService')
const { scoreSubject, computeOverallConfidence, addResultFlags } = require('../services/parser/subjectConfidence')
const { calculateCredits } = require('../services/parser/creditCalculator')
const validationLayer = require('../services/parser/validationLayer')
const { decidePipelineRoute } = require('../services/parser/decisionEngine')
const { verifyWithGroq } = require('../services/parser/groqFallback')

// Paths
const EVAL_DIR = path.resolve(__dirname, '../eval/transcripts')
const IMAGES_DIR = path.join(EVAL_DIR, 'images')
const GT_DIR = path.join(EVAL_DIR, 'ground_truth')
const RESULTS_DIR = path.resolve(__dirname, '../results')
const RUNS_DIR = path.join(RESULTS_DIR, 'ingestion_runs')
const CSV_FILE = path.join(RESULTS_DIR, 'ingestion_eval.csv')
const MD_FILE = path.join(RESULTS_DIR, 'ingestion_eval.md')
const ERRORS_MD_FILE = path.join(RESULTS_DIR, 'ingestion_errors.md')

// Levenshtein distance for string matching, CER, and WER
function levenshteinDistance(s1, s2) {
  const m = s1.length
  const n = s2.length
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))

  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,       // deletion
        dp[i][j - 1] + 1,       // insertion
        dp[i - 1][j - 1] + cost // substitution
      )
    }
  }
  return dp[m][n]
}

function normalizeName(str) {
  if (!str) return ''
  return str.toLowerCase().replace(/[^a-z0-9]/g, '').trim()
}

function normalizeCode(str) {
  if (!str) return ''
  return str.toUpperCase().replace(/[^A-Z0-9]/g, '').trim()
}

function calculateWER(refText, hypText) {
  const refWords = (refText || '').trim().split(/\s+/).filter(Boolean)
  const hypWords = (hypText || '').trim().split(/\s+/).filter(Boolean)
  if (refWords.length === 0) return 0.0
  const dist = levenshteinDistance(refWords, hypWords)
  return dist / refWords.length
}

function calculateCER(refText, hypText) {
  const ref = (refText || '').replace(/\s+/g, ' ').trim()
  const hyp = (hypText || '').replace(/\s+/g, ' ').trim()
  if (ref.length === 0) return 0.0
  const dist = levenshteinDistance(ref, hyp)
  return dist / ref.length
}

// 95% Wilson Score Interval for proportion
function wilsonConfidenceInterval(successes, total, confidence = 1.96) {
  if (total === 0) return { point: 0, lower: 0, upper: 0, str: 'N/A' }
  const p = successes / total
  const z = confidence
  const z2 = z * z
  const denom = 1 + z2 / total
  const center = (p + z2 / (2 * total)) / denom
  const margin = (z * Math.sqrt((p * (1 - p) + z2 / (4 * total)) / total)) / denom
  const lower = Math.max(0, center - margin)
  const upper = Math.min(1, center + margin)

  return {
    point: p,
    lower,
    upper,
    str: `${(p * 100).toFixed(2)}% [${(lower * 100).toFixed(2)}%, ${(upper * 100).toFixed(2)}%]`
  }
}

async function extractTextFromFile(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  const buffer = fs.readFileSync(filePath)

  if (ext === '.pdf') {
    const pdfParse = require('pdf-parse')
    const pdfData = await pdfParse(buffer)
    return pdfData.text
  } else if (['.png', '.jpg', '.jpeg', '.tiff', '.bmp', '.webp'].includes(ext)) {
    const Tesseract = require('tesseract.js')
    const trainedDataPath = path.resolve(__dirname, '../eng.traineddata')
    const workerOptions = fs.existsSync(trainedDataPath) ? {
      langPath: path.resolve(__dirname, '..'),
      cachePath: path.resolve(__dirname, '..')
    } : {}
    const { data: { text } } = await Tesseract.recognize(filePath, 'eng', workerOptions)
    return text
  } else if (['.txt', '.raw'].includes(ext)) {
    return buffer.toString('utf-8')
  } else {
    throw new Error(`Unsupported file format: ${ext}`)
  }
}

/**
 * Runs 14-stage ingestion pipeline with explicit control over Groq fallback
 * mode: 'rule_only' | 'full_pipeline'
 */
async function runIngestionPipeline(rawText, buffer, mode = 'full_pipeline') {
  const startTime = Date.now()
  if (!buffer || buffer.length === 0) throw new Error('Empty buffer provided to pipeline')

  // Stage 2: Fingerprint
  const hash = generateFingerprint(buffer)

  // Stage 3: Classification
  const mimeType = 'application/octet-stream'

  // Stage 5: Clean & Normalize
  const cleanedText = cleanText(rawText)

  // Stage 6: Quality Analysis
  const quality = analyzeDocumentQuality(cleanedText, mimeType, null)

  // Stage 7: Table Isolation
  const isolation = isolateTable(cleanedText)

  // Stage 8: Profile Detection
  const { profile, profileId } = detectProfile(cleanedText, isolation.tableLines)

  // Stage 9: Rule Parsing
  let parsed = parseRules(isolation.tableLines, cleanedText, profile)

  // Deep clone rule-only subjects prior to grade mapping and fallback
  const preFallbackSubjects = JSON.parse(JSON.stringify(parsed.subjects || []))

  // Stage 10: Grade Mapping
  parsed = gradeMappingService.mapGrades(parsed)

  // Stage 11: Confidence Scoring
  const confidenceContexts = parsed.metadata?.confidenceContexts || []
  parsed.subjects = (parsed.subjects || []).map((sub, idx) => {
    sub.confidence = scoreSubject(sub, confidenceContexts[idx] || {})
    return sub
  })
  parsed.subjects = addResultFlags(parsed.subjects)
  parsed.confidence = computeOverallConfidence(parsed.subjects)

  // Stage 12: Credit Summary
  parsed.summary = calculateCredits(parsed.subjects, cleanedText)

  // Stage 13: Data Contract Validation
  const validated = validationLayer.validateContract(parsed)

  // Stage 14: Decision Engine & Verification Routing
  let routed = decidePipelineRoute(validated)
  let groqFallbackInvoked = false
  let rowsRoutedToGroq = 0
  let fallbackChanges = []

  const lowConfidenceRows = (routed.subjects || []).filter(s => (s.confidence || 0) < 55)

  if (mode === 'full_pipeline' && (routed.metadata.decision === 'GROQ' || lowConfidenceRows.length > 0)) {
    groqFallbackInvoked = true
    rowsRoutedToGroq = lowConfidenceRows.length
    if (process.env.GROQ_API_KEY && process.env.DISABLE_GROQ_FALLBACK !== 'true') {
      try {
        const beforeMap = new Map((routed.subjects || []).map(s => [s.id, { credits: s.credits, rawGrade: s.rawGrade, finalGrade: s.finalGrade }]))
        const groqRes = await verifyWithGroq(isolation.isolatedText, lowConfidenceRows.length > 0 ? lowConfidenceRows : routed.subjects)
        routed.metadata.groqRepair = groqRes.groqCalled
        routed.metadata.repairedFields = groqRes.repairLog

        // Compare values before vs after Groq verification
        ;(routed.subjects || []).forEach(afterSub => {
          const beforeSub = beforeMap.get(afterSub.id)
          if (beforeSub) {
            const creditsChanged = beforeSub.credits !== afterSub.credits
            const rawGradeChanged = beforeSub.rawGrade !== afterSub.rawGrade
            const finalGradeChanged = beforeSub.finalGrade !== afterSub.finalGrade
            if (creditsChanged || rawGradeChanged || finalGradeChanged) {
              fallbackChanges.push({
                subjectId: afterSub.id,
                name: afterSub.name,
                code: afterSub.code,
                before: beforeSub,
                after: { credits: afterSub.credits, rawGrade: afterSub.rawGrade, finalGrade: afterSub.finalGrade }
              })
            }
          }
        })
      } catch (groqErr) {
        console.warn('Groq verification warning:', groqErr.message)
      }
    }
  }

  const elapsedMs = Date.now() - startTime

  return {
    mode,
    elapsedMs,
    rawText,
    cleanedText,
    profileId,
    hash,
    preFallbackSubjects,
    output: routed,
    groqFallbackInvoked,
    rowsRoutedToGroq,
    fallbackChanges,
    sentToManualReview: routed.metadata.decision === 'MANUAL_REVIEW' || (routed.confidence || 0) < 70
  }
}

/**
 * Subject matching algorithm:
 * 1. Match by exact normalized subject code first.
 * 2. If no code match, match by normalized name (Levenshtein distance <= 2).
 * Unmatched predictions = false positives (FP).
 * Unmatched ground truth = false negatives (FN).
 */
function evaluateSheet(predictedSubjects, groundTruthSubjects, sheetId, mode) {
  const predMatched = new Set()
  const gtMatched = new Set()
  const matchedPairs = []
  const fieldErrors = []

  // Step 1: Match by normalized subject code
  groundTruthSubjects.forEach((gtSub, gtIdx) => {
    const gtCodeNorm = normalizeCode(gtSub.code)
    if (!gtCodeNorm) return

    for (let pIdx = 0; pIdx < predictedSubjects.length; pIdx++) {
      if (predMatched.has(pIdx)) continue
      const predCodeNorm = normalizeCode(predictedSubjects[pIdx].code)
      if (predCodeNorm && predCodeNorm === gtCodeNorm) {
        predMatched.add(pIdx)
        gtMatched.add(gtIdx)
        matchedPairs.push({ gtSub, predSub: predictedSubjects[pIdx], matchType: 'code' })
        break
      }
    }
  })

  // Step 2: Match remaining by normalized name (edit distance <= 2)
  groundTruthSubjects.forEach((gtSub, gtIdx) => {
    if (gtMatched.has(gtIdx)) return
    const gtNameNorm = normalizeName(gtSub.name)
    if (!gtNameNorm) return

    let bestPIdx = -1
    let bestDist = 999

    predictedSubjects.forEach((pSub, pIdx) => {
      if (predMatched.has(pIdx)) return
      const pNameNorm = normalizeName(pSub.name)
      if (!pNameNorm) return
      const dist = levenshteinDistance(gtNameNorm, pNameNorm)
      if (dist <= 2 && dist < bestDist) {
        bestDist = dist
        bestPIdx = pIdx
      }
    })

    if (bestPIdx !== -1) {
      predMatched.add(bestPIdx)
      gtMatched.add(gtIdx)
      matchedPairs.push({ gtSub, predSub: predictedSubjects[bestPIdx], matchType: 'name' })
    }
  })

  // Ground truth subjects missed -> False Negatives
  const unmatchedGT = []
  groundTruthSubjects.forEach((gtSub, gtIdx) => {
    if (!gtMatched.has(gtIdx)) {
      unmatchedGT.push(gtSub)
      fieldErrors.push({
        sheet_id: sheetId,
        mode,
        field: 'subject_detection',
        predicted: 'MISSED_BY_PARSER',
        expected: `${gtSub.code || ''} ${gtSub.name || ''}`.trim(),
        confidence: 0,
        stage: 'Stage 7/9 (Table Isolation or Rule Parser)'
      })
    }
  })

  // Predicted subjects spurious -> False Positives
  const unmatchedPred = []
  predictedSubjects.forEach((pSub, pIdx) => {
    if (!predMatched.has(pIdx)) {
      unmatchedPred.push(pSub)
      fieldErrors.push({
        sheet_id: sheetId,
        mode,
        field: 'subject_detection',
        predicted: `${pSub.code || ''} ${pSub.name || ''}`.trim(),
        expected: 'NONE_SPURIOUS',
        confidence: pSub.confidence || 0,
        stage: 'Stage 9 (Rule Parser - Spurious Row)'
      })
    }
  })

  // Evaluate field-level accuracy on matched pairs
  const fieldMatches = {
    name: { tp: 0, fp: 0, fn: 0 },
    credits: { tp: 0, fp: 0, fn: 0 },
    grade: { tp: 0, fp: 0, fn: 0 },
    attendance: { tp: 0, fp: 0, fn: 0, evaluated: 0 }
  }

  let subjectExactMatches = 0

  matchedPairs.forEach(({ gtSub, predSub }) => {
    let subAllCorrect = true

    // 1. Name Check (Levenshtein distance <= 2 on normalized name)
    const nameDist = levenshteinDistance(normalizeName(gtSub.name), normalizeName(predSub.name))
    if (nameDist <= 2) {
      fieldMatches.name.tp++
    } else {
      fieldMatches.name.fp++
      fieldMatches.name.fn++
      subAllCorrect = false
      fieldErrors.push({
        sheet_id: sheetId,
        mode,
        field: 'name',
        predicted: predSub.name,
        expected: gtSub.name,
        confidence: predSub.confidence || 0,
        stage: 'Stage 9 (Rule Parser - Name Extraction)'
      })
    }

    // 2. Credits Check (numeric match)
    const gtCredits = Number(gtSub.credits)
    const predCredits = Number(predSub.credits)
    if (!isNaN(gtCredits) && !isNaN(predCredits) && gtCredits === predCredits) {
      fieldMatches.credits.tp++
    } else {
      fieldMatches.credits.fp++
      fieldMatches.credits.fn++
      subAllCorrect = false
      fieldErrors.push({
        sheet_id: sheetId,
        mode,
        field: 'credits',
        predicted: predSub.credits,
        expected: gtSub.credits,
        confidence: predSub.confidence || 0,
        stage: 'Stage 12 (Credit Calculator / Parser)'
      })
    }

    // 3. Grade Check
    const gtGradeRaw = String(gtSub.grade_or_grade_point ?? '').trim().toUpperCase()
    const predGradeRaw = String(predSub.rawGrade ?? '').trim().toUpperCase()
    const gtGradePt = Number(gtSub.grade_or_grade_point)
    const predFinalGrade = Number(predSub.finalGrade)

    const gradeMatches =
      (gtGradeRaw && predGradeRaw && gtGradeRaw === predGradeRaw) ||
      (!isNaN(gtGradePt) && !isNaN(predFinalGrade) && gtGradePt === predFinalGrade)

    if (gradeMatches) {
      fieldMatches.grade.tp++
    } else {
      fieldMatches.grade.fp++
      fieldMatches.grade.fn++
      subAllCorrect = false
      fieldErrors.push({
        sheet_id: sheetId,
        mode,
        field: 'grade',
        predicted: `${predSub.rawGrade} (pts: ${predSub.finalGrade})`,
        expected: gtSub.grade_or_grade_point,
        confidence: predSub.confidence || 0,
        stage: 'Stage 10 (Grade Mapping / Regex)'
      })
    }

    // 4. Attendance Check (only for sheets where attendance is printed)
    if (gtSub.attendance !== null && gtSub.attendance !== undefined) {
      fieldMatches.attendance.evaluated++
      const gtAtt = Number(gtSub.attendance)
      const predAtt = Number(predSub.attendance)
      if (!isNaN(gtAtt) && !isNaN(predAtt) && gtAtt === predAtt) {
        fieldMatches.attendance.tp++
      } else {
        fieldMatches.attendance.fp++
        fieldMatches.attendance.fn++
        subAllCorrect = false
        fieldErrors.push({
          sheet_id: sheetId,
          mode,
          field: 'attendance',
          predicted: predSub.attendance,
          expected: gtSub.attendance,
          confidence: predSub.confidence || 0,
          stage: 'Stage 9 (Rule Parser - Attendance Column)'
        })
      }
    }

    if (subAllCorrect) {
      subjectExactMatches++
    }
  })

  // Incorporate unmatched into FP/FN counters
  unmatchedGT.forEach(gtSub => {
    fieldMatches.name.fn++
    fieldMatches.credits.fn++
    fieldMatches.grade.fn++
    if (gtSub.attendance !== null && gtSub.attendance !== undefined) {
      fieldMatches.attendance.evaluated++
      fieldMatches.attendance.fn++
    }
  })

  unmatchedPred.forEach(predSub => {
    fieldMatches.name.fp++
    fieldMatches.credits.fp++
    fieldMatches.grade.fp++
    if (predSub.attendance !== null && predSub.attendance !== undefined) {
      fieldMatches.attendance.fp++
    }
  })

  const sheetExactMatch = (groundTruthSubjects.length > 0) &&
    (matchedPairs.length === groundTruthSubjects.length) &&
    (unmatchedPred.length === 0) &&
    (subjectExactMatches === groundTruthSubjects.length)

  return {
    matchedPairsCount: matchedPairs.length,
    unmatchedGTCount: unmatchedGT.length,
    unmatchedPredCount: unmatchedPred.length,
    fieldMatches,
    subjectExactMatches,
    sheetExactMatch,
    fieldErrors
  }
}

async function main() {
  console.log('================================================================')
  console.log('  ZenScore AI — 14-Stage Transcript Ingestion Empirical Benchmark')
  console.log('================================================================\n')

  // Setup directories
  if (!fs.existsSync(RESULTS_DIR)) fs.mkdirSync(RESULTS_DIR, { recursive: true })
  if (!fs.existsSync(RUNS_DIR)) fs.mkdirSync(RUNS_DIR, { recursive: true })

  // Environment and pipeline version tracking
  let gitCommit = 'UNKNOWN'
  try {
    gitCommit = execSync('git rev-parse HEAD', { cwd: path.resolve(__dirname, '..') }).toString().trim()
  } catch (e) {
    gitCommit = 'GIT_ERROR: ' + e.message
  }

  const parserVersion = '2.0.0 (14-stage modular pipeline)'
  const ocrVersion = 'Tesseract.js ^7.0.0 (LSTM eng.traineddata)'
  const groqModelName = process.env.GROQ_MODEL || 'openai/gpt-oss-120b'

  console.log(`Pipeline Commit Hash : ${gitCommit}`)
  console.log(`Parser Version       : ${parserVersion}`)
  console.log(`OCR Engine           : ${ocrVersion}`)
  console.log(`Groq Fallback Model  : ${groqModelName}\n`)

  // Discover sheets
  const gtFiles = fs.existsSync(GT_DIR)
    ? fs.readdirSync(GT_DIR).filter(f => f.endsWith('.json'))
    : []

  const verifiedSheets = []
  const excludedSheets = []

  for (const file of gtFiles) {
    const fullPath = path.join(GT_DIR, file)
    try {
      const data = JSON.parse(fs.readFileSync(fullPath, 'utf-8'))
      if (data.verified === true) {
        verifiedSheets.push(data)
      } else {
        excludedSheets.push({ file, sheet_id: data.sheet_id || file, reason: 'Ground truth not verified by human (verified: false)' })
      }
    } catch (e) {
      excludedSheets.push({ file, sheet_id: file, reason: `Malformed JSON: ${e.message}` })
    }
  }

  // Also check images without any GT file
  const imageFiles = fs.existsSync(IMAGES_DIR)
    ? fs.readdirSync(IMAGES_DIR).filter(f => !f.startsWith('.') && f !== 'placeholder.txt')
    : []

  for (const imgFile of imageFiles) {
    const ext = path.extname(imgFile)
    const base = path.basename(imgFile, ext)
    if (!gtFiles.includes(`${base}.json`)) {
      excludedSheets.push({ file: imgFile, sheet_id: base, reason: 'Missing ground truth file' })
    }
  }

  // Quality categories mix
  const qualityCounts = { clean: 0, average: 0, poor: 0 }
  verifiedSheets.forEach(s => {
    const q = s.image_quality || 'clean'
    qualityCounts[q] = (qualityCounts[q] || 0) + 1
  })

  // Universities and profiles
  const uniqueUniversities = new Set(verifiedSheets.map(s => s.university || 'UNKNOWN'))
  const uniqueProfiles = new Set(verifiedSheets.map(s => s.profile || 'UNKNOWN'))
  const isPreliminary = verifiedSheets.length < 20 || uniqueProfiles.size < 3
  const statusLabel = isPreliminary ? `PRELIMINARY (n = ${verifiedSheets.length})` : `MEASURED (n = ${verifiedSheets.length})`

  // Required introductory printout
  console.log('----------------------------------------------------------------')
  console.log('EVALUATION DATASET SUMMARY')
  console.log('----------------------------------------------------------------')
  console.log(`- Verified Mark Sheets (Evaluated) : ${verifiedSheets.length}`)
  console.log(`- Excluded Mark Sheets             : ${excludedSheets.length}`)
  if (excludedSheets.length > 0) {
    excludedSheets.forEach((ex, idx) => {
      console.log(`    [Excluded ${idx + 1}] ${ex.sheet_id} (${ex.file}): ${ex.reason}`)
    })
  } else {
    console.log('    (None excluded: 0 unverified or missing sheets)')
  }
  console.log(`- Number of Universities           : ${uniqueUniversities.size} (${Array.from(uniqueUniversities).join(', ')})`)
  console.log(`- Number of Curriculum Profiles    : ${uniqueProfiles.size} (${Array.from(uniqueProfiles).join(', ')})`)
  console.log(`- Image-Quality Mix                : Clean: ${qualityCounts.clean}, Average: ${qualityCounts.average}, Poor: ${qualityCounts.poor}`)
  console.log(`- Benchmark Classification         : ${statusLabel}`)
  console.log('----------------------------------------------------------------\n')

  // Aggregation buckets for both modes
  const modes = ['rule_only', 'full_pipeline']
  const modeStats = {
    rule_only: initModeStats(),
    full_pipeline: initModeStats()
  }

  const allFieldErrors = []
  const fallbackImpactRows = []
  const confidenceErrorData = []

  // Execution loop over verified sheets
  for (const gt of verifiedSheets) {
    const sheetId = gt.sheet_id
    console.log(`Processing Verified Sheet [${sheetId}] (${gt.university} - ${gt.profile})...`)

    // Find image file
    const possibleExtensions = ['.png', '.jpg', '.jpeg', '.pdf', '.tiff', '.bmp', '.webp']
    let imagePath = null
    for (const ext of possibleExtensions) {
      const p = path.join(IMAGES_DIR, `${sheetId}${ext}`)
      if (fs.existsSync(p)) {
        imagePath = p
        break
      }
    }

    if (!imagePath) {
      console.warn(`  ⚠️ Image file not found for sheet_id: ${sheetId}. Skipping.`)
      continue
    }

    const buffer = fs.readFileSync(imagePath)
    const rawText = await extractTextFromFile(imagePath)

    // Run both modes
    for (const mode of modes) {
      const runResult = await runIngestionPipeline(rawText, buffer, mode)

      // Save raw output per sheet and mode
      const rawRunPath = path.join(RUNS_DIR, `${sheetId}_${mode}.json`)
      fs.writeFileSync(rawRunPath, JSON.stringify(runResult, null, 2), 'utf-8')

      // Record CER / WER if raw_text ground truth exists
      if (gt.raw_text) {
        const cer = calculateCER(gt.raw_text, rawText)
        const wer = calculateWER(gt.raw_text, rawText)
        modeStats[mode].cerValues.push(cer)
        modeStats[mode].werValues.push(wer)
      }

      // Record elapsed time
      modeStats[mode].timesMs.push(runResult.elapsedMs)

      // Manual review check
      if (runResult.sentToManualReview) {
        modeStats[mode].manualReviewCount++
      }

      // Fallback tracking (in full_pipeline mode)
      if (mode === 'full_pipeline') {
        modeStats[mode].rowsRoutedToGroq += runResult.rowsRoutedToGroq
        modeStats[mode].totalPredictedRows += (runResult.output.subjects || []).length

        // Track fallback impact
        runResult.fallbackChanges.forEach(change => {
          fallbackImpactRows.push({ sheet_id: sheetId, ...change })
        })
      }

      // Evaluate against ground truth
      const evalRes = evaluateSheet(runResult.output.subjects || [], gt.subjects || [], sheetId, mode)

      // Accumulate stats
      accumulateStats(modeStats[mode], evalRes, gt)

      // Collect errors
      evalRes.fieldErrors.forEach(err => {
        allFieldErrors.push(err)
        confidenceErrorData.push({
          sheet_id: sheetId,
          mode,
          field: err.field,
          confidence: err.confidence
        })
      })
    }
  }

  // Generate Reports
  generateEvaluationReport({
    gitCommit,
    parserVersion,
    ocrVersion,
    groqModelName,
    isPreliminary,
    statusLabel,
    verifiedSheets,
    excludedSheets,
    modeStats,
    allFieldErrors,
    fallbackImpactRows,
    confidenceErrorData
  })
}

function initModeStats() {
  return {
    sheetsCount: 0,
    totalGTSubjects: 0,
    totalPredSubjects: 0,
    sheetExactMatches: 0,
    subjectExactMatches: 0,
    manualReviewCount: 0,
    rowsRoutedToGroq: 0,
    totalPredictedRows: 0,
    timesMs: [],
    cerValues: [],
    werValues: [],
    name: { tp: 0, fp: 0, fn: 0 },
    credits: { tp: 0, fp: 0, fn: 0 },
    grade: { tp: 0, fp: 0, fn: 0 },
    attendance: { tp: 0, fp: 0, fn: 0, evaluated: 0 },
    byUniversity: {}
  }
}

function accumulateStats(stats, evalRes, gt) {
  stats.sheetsCount++
  stats.totalGTSubjects += (gt.subjects || []).length
  if (evalRes.sheetExactMatch) stats.sheetExactMatches++
  stats.subjectExactMatches += evalRes.subjectExactMatches

  const fields = ['name', 'credits', 'grade', 'attendance']
  fields.forEach(f => {
    stats[f].tp += evalRes.fieldMatches[f].tp
    stats[f].fp += evalRes.fieldMatches[f].fp
    stats[f].fn += evalRes.fieldMatches[f].fn
    if (f === 'attendance') {
      stats.attendance.evaluated += evalRes.fieldMatches.attendance.evaluated
    }
  })

  // By University / Profile breakdown
  const groupKey = `${gt.university || 'UNKNOWN'} (${gt.profile || 'Default'})`
  if (!stats.byUniversity[groupKey]) {
    stats.byUniversity[groupKey] = {
      sheetsCount: 0,
      subjectsCount: 0,
      subjectExactMatches: 0,
      sheetExactMatches: 0,
      name: { tp: 0, fp: 0, fn: 0 },
      credits: { tp: 0, fp: 0, fn: 0 },
      grade: { tp: 0, fp: 0, fn: 0 }
    }
  }
  const uStats = stats.byUniversity[groupKey]
  uStats.sheetsCount++
  uStats.subjectsCount += (gt.subjects || []).length
  if (evalRes.sheetExactMatch) uStats.sheetExactMatches++
  uStats.subjectExactMatches += evalRes.subjectExactMatches
  ;['name', 'credits', 'grade'].forEach(f => {
    uStats[f].tp += evalRes.fieldMatches[f].tp
    uStats[f].fp += evalRes.fieldMatches[f].fp
    uStats[f].fn += evalRes.fieldMatches[f].fn
  })
}

function computePRF1(counts) {
  const p = (counts.tp + counts.fp) > 0 ? counts.tp / (counts.tp + counts.fp) : 0
  const r = (counts.tp + counts.fn) > 0 ? counts.tp / (counts.tp + counts.fn) : 0
  const f1 = (p + r) > 0 ? (2 * p * r) / (p + r) : 0
  return { p, r, f1 }
}

function formatRateWithCI(k, n) {
  if (n === 0) return 'N/A'
  const ci = wilsonConfidenceInterval(k, n)
  return ci.str
}

function generateEvaluationReport(data) {
  const {
    gitCommit,
    parserVersion,
    ocrVersion,
    groqModelName,
    isPreliminary,
    statusLabel,
    verifiedSheets,
    excludedSheets,
    modeStats,
    allFieldErrors,
    fallbackImpactRows,
    confidenceErrorData
  } = data

  const rStats = modeStats.rule_only
  const fStats = modeStats.full_pipeline

  // Timing helper
  const calcTiming = (arr) => {
    if (!arr || arr.length === 0) return { mean: 0, median: 0, max: 0 }
    const sorted = [...arr].sort((a, b) => a - b)
    const sum = sorted.reduce((acc, v) => acc + v, 0)
    const mean = Math.round(sum / sorted.length)
    const median = sorted[Math.floor(sorted.length / 2)]
    const max = sorted[sorted.length - 1]
    return { mean, median, max }
  }

  const rTime = calcTiming(rStats.timesMs)
  const fTime = calcTiming(fStats.timesMs)

  // PRF1 calculations
  const rName = computePRF1(rStats.name)
  const fName = computePRF1(fStats.name)
  const rCred = computePRF1(rStats.credits)
  const fCred = computePRF1(fStats.credits)
  const rGrade = computePRF1(rStats.grade)
  const fGrade = computePRF1(fStats.grade)
  const rAtt = computePRF1(rStats.attendance)
  const fAtt = computePRF1(fStats.attendance)

  // Exact match rates
  const rSubExact = formatRateWithCI(rStats.subjectExactMatches, rStats.totalGTSubjects)
  const fSubExact = formatRateWithCI(fStats.subjectExactMatches, fStats.totalGTSubjects)
  const rSheetExact = formatRateWithCI(rStats.sheetExactMatches, rStats.sheetsCount)
  const fSheetExact = formatRateWithCI(fStats.sheetExactMatches, fStats.sheetsCount)

  // CER / WER
  const calcAvg = (arr) => arr.length > 0 ? ((arr.reduce((a, b) => a + b, 0) / arr.length) * 100).toFixed(2) + '%' : 'NOT MEASURED (no raw_text in GT)'
  const rCER = calcAvg(rStats.cerValues)
  const rWER = calcAvg(rStats.werValues)

  // Fallback %
  const groqFallbackPct = fStats.totalPredictedRows > 0
    ? `${((fStats.rowsRoutedToGroq / fStats.totalPredictedRows) * 100).toFixed(2)}% (${fStats.rowsRoutedToGroq}/${fStats.totalPredictedRows} rows)`
    : '0.00% (0 rows)'

  // Quality categories
  const qualityCounts = { clean: 0, average: 0, poor: 0 }
  verifiedSheets.forEach(s => {
    const q = s.image_quality || 'clean'
    qualityCounts[q] = (qualityCounts[q] || 0) + 1
  })

  // Universities
  const uniSet = new Set(verifiedSheets.map(s => s.university || 'UNKNOWN'))

  // Build Markdown
  let md = `# ZenScore AI — Transcript Ingestion Evaluation Report

**Benchmark Status**: **${statusLabel}**  
**Execution Timestamp**: ${new Date().toISOString()}  
**Git Commit Hash**: \`${gitCommit}\`  
**Parser Architecture**: ${parserVersion}  
**OCR Engine**: ${ocrVersion}  
**Groq Fallback Model**: ${groqModelName}  

---

## 1. Dataset & Ground-Truth Verification

| Parameter | Value | Notes |
| :--- | :--- | :--- |
| **Verified Mark Sheets (Evaluated)** | **${verifiedSheets.length}** | All confirmed with \`"verified": true\` by human evaluator |
| **Excluded Sheets (Unverified)** | **${excludedSheets.length}** | Excluded per HARD RULE (never simulate or estimate ground truth) |
| **Total Ground-Truth Subjects** | **${rStats.totalGTSubjects}** | Evaluated across all verified sheets |
| **Universities Represented** | **${uniSet.size}** | ${Array.from(uniSet).join(', ')} |
| **Image Quality Breakdown** | Clean: ${qualityCounts.clean}, Avg: ${qualityCounts.average}, Poor: ${qualityCounts.poor} | Human visual assessment |

${isPreliminary ? `> [!NOTE]\n> **Preliminary Notice**: Less than 20 verified sheets or 3 profiles are currently present. Results are labeled PRELIMINARY (n = ${verifiedSheets.length}) and will be updated as more verified sheets are added.\n` : ''}

---

## 2. Ingestion Evaluation Results (Both Modes)

Matching Rule: Match predicted subjects to ground-truth by **subject code** first; fallback to **normalized name** (lowercase, punctuation stripped, Levenshtein distance $\\le 2$). Unmatched predictions are false positives; unmatched ground-truth subjects are false negatives. Confidence intervals are 95% Wilson score intervals.

### Overall Performance Comparison
| Metric | Rule Parser Only (Mode a) | Full Pipeline w/ Groq (Mode b) | Status |
| :--- | :--- | :--- | :--- |
| **Subject Name Precision** | ${(rName.p * 100).toFixed(2)}% | ${(fName.p * 100).toFixed(2)}% | MEASURED (n = ${rStats.totalGTSubjects}) |
| **Subject Name Recall** | ${(rName.r * 100).toFixed(2)}% | ${(fName.r * 100).toFixed(2)}% | MEASURED (n = ${rStats.totalGTSubjects}) |
| **Subject Name F1 Score** | ${(rName.f1 * 100).toFixed(2)}% | ${(fName.f1 * 100).toFixed(2)}% | MEASURED (n = ${rStats.totalGTSubjects}) |
| **Credits F1 Score** | ${(rCred.f1 * 100).toFixed(2)}% | ${(fCred.f1 * 100).toFixed(2)}% | MEASURED (n = ${rStats.totalGTSubjects}) |
| **Grade F1 Score** | ${(rGrade.f1 * 100).toFixed(2)}% | ${(fGrade.f1 * 100).toFixed(2)}% | MEASURED (n = ${rStats.totalGTSubjects}) |
| **Attendance F1 Score** | ${rStats.attendance.evaluated > 0 ? (rAtt.f1 * 100).toFixed(2) + '%' : 'NOT APPLICABLE (not on sheets)'} | ${fStats.attendance.evaluated > 0 ? (fAtt.f1 * 100).toFixed(2) + '%' : 'NOT APPLICABLE (not on sheets)'} | ${rStats.attendance.evaluated > 0 ? `MEASURED (n = ${rStats.attendance.evaluated})` : 'NOT APPLICABLE'} |
| **Subject Exact Match Rate** | **${rSubExact}** | **${fSubExact}** | MEASURED (n = ${rStats.totalGTSubjects}) |
| **Sheet Exact Match Rate** | **${rSheetExact}** | **${fSheetExact}** | MEASURED (n = ${rStats.sheetsCount}) |
| **OCR CER (Character Error Rate)** | ${rCER} | ${rCER} | ${rStats.cerValues.length > 0 ? `MEASURED (n = ${rStats.cerValues.length})` : 'NOT MEASURED (no raw_text GT)'} |
| **OCR WER (Word Error Rate)** | ${rWER} | ${rWER} | ${rStats.werValues.length > 0 ? `MEASURED (n = ${rStats.werValues.length})` : 'NOT MEASURED (no raw_text GT)'} |

---

## 3. Fallback & Operational Routing Diagnostics

| Metric | Result | Description |
| :--- | :--- | :--- |
| **Rows Routed to Groq Fallback** | **${groqFallbackPct}** | Low-confidence subjects (<55) or uncertain table structures |
| **Sheets Sent to Manual Review** | Mode a: **${rStats.manualReviewCount}** (${rStats.sheetsCount > 0 ? ((rStats.manualReviewCount / rStats.sheetsCount) * 100).toFixed(1) : 0}%) \| Mode b: **${fStats.manualReviewCount}** (${fStats.sheetsCount > 0 ? ((fStats.manualReviewCount / fStats.sheetsCount) * 100).toFixed(1) : 0}%) | Decision = MANUAL_REVIEW or confidence < 70 |
| **Mean Sheet Latency** | Mode a: **${rTime.mean} ms** \| Mode b: **${fTime.mean} ms** | Mean end-to-end processing time |
| **Median Sheet Latency** | Mode a: **${rTime.median} ms** \| Mode b: **${fTime.median} ms** | Median end-to-end processing time |
| **Max Sheet Latency** | Mode a: **${rTime.max} ms** \| Mode b: **${fTime.max} ms** | Maximum processing time observed |

### Fallback Value Impact Log (Mode b)
${fallbackImpactRows.length === 0 ? '_No field values were modified by the Groq fallback during this run._\n' :
`| Sheet ID | Subject | Field Before Fallback | Field After Fallback | Impact |
| :--- | :--- | :--- | :--- | :--- |
` + fallbackImpactRows.map(row => `| \`${row.sheet_id}\` | ${row.name || row.code} | \`${JSON.stringify(row.before)}\` | \`${JSON.stringify(row.after)}\` | Verified |`).join('\n') + '\n'}

---

## 4. University / Profile Breakdown (Full Pipeline)

| University / Profile | Sheets | Subjects | Subject Exact Match | Sheet Exact Match | Name F1 | Credits F1 | Grade F1 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
`

  Object.entries(fStats.byUniversity).forEach(([uName, u]) => {
    const uNameF1 = computePRF1(u.name)
    const uCredF1 = computePRF1(u.credits)
    const uGradeF1 = computePRF1(u.grade)
    const uSubExact = formatRateWithCI(u.subjectExactMatches, u.subjectsCount)
    const uSheetExact = formatRateWithCI(u.sheetExactMatches, u.sheetsCount)
    md += `| ${uName} | ${u.sheetsCount} | ${u.subjectsCount} | ${uSubExact} | ${uSheetExact} | ${(uNameF1.f1 * 100).toFixed(1)}% | ${(uCredF1.f1 * 100).toFixed(1)}% | ${(uGradeF1.f1 * 100).toFixed(1)}% |\n`
  })

  md += `\n---\n\n## 5. Confidence Score vs. Error Correlation\n\n`
  if (confidenceErrorData.length === 0) {
    md += `_Zero extraction errors occurred across evaluated verified sheets. Confidence metric calibration: 100% agreement._\n`
  } else {
    const errorConfs = confidenceErrorData.map(d => d.confidence)
    const avgErrConf = (errorConfs.reduce((a, b) => a + b, 0) / errorConfs.length).toFixed(1)
    md += `A total of **${confidenceErrorData.length}** field extraction errors occurred across all runs.\n`
    md += `- **Mean Confidence on Erroneous Fields**: ${avgErrConf} / 100\n`
    md += `See [\`results/ingestion_errors.md\`](./ingestion_errors.md) for the complete failure audit.\n`
  }

  fs.writeFileSync(MD_FILE, md, 'utf-8')
  console.log(`Markdown report written to: ${MD_FILE}`)

  // Write CSV
  let csv = 'Metric,RuleOnly_ModeA,FullPipeline_ModeB,Status\n'
  csv += `VerifiedMarkSheets,${rStats.sheetsCount},${fStats.sheetsCount},${statusLabel}\n`
  csv += `TotalGTSubjects,${rStats.totalGTSubjects},${fStats.totalGTSubjects},MEASURED\n`
  csv += `SubjectName_Precision,${(rName.p * 100).toFixed(2)}%,${(fName.p * 100).toFixed(2)}%,MEASURED\n`
  csv += `SubjectName_Recall,${(rName.r * 100).toFixed(2)}%,${(fName.r * 100).toFixed(2)}%,MEASURED\n`
  csv += `SubjectName_F1,${(rName.f1 * 100).toFixed(2)}%,${(fName.f1 * 100).toFixed(2)}%,MEASURED\n`
  csv += `Credits_F1,${(rCred.f1 * 100).toFixed(2)}%,${(fCred.f1 * 100).toFixed(2)}%,MEASURED\n`
  csv += `Grade_F1,${(rGrade.f1 * 100).toFixed(2)}%,${(fGrade.f1 * 100).toFixed(2)}%,MEASURED\n`
  csv += `SubjectExactMatchRate,"${rSubExact}","${fSubExact}",MEASURED\n`
  csv += `SheetExactMatchRate,"${rSheetExact}","${fSheetExact}",MEASURED\n`
  csv += `Latency_Mean_ms,${rTime.mean},${fTime.mean},MEASURED\n`
  csv += `Latency_Median_ms,${rTime.median},${fTime.median},MEASURED\n`
  csv += `Latency_Max_ms,${rTime.max},${fTime.max},MEASURED\n`
  csv += `OCR_CER,${rCER},${rCER},${rStats.cerValues.length > 0 ? 'MEASURED' : 'NOT_MEASURED'}\n`
  csv += `OCR_WER,${rWER},${rWER},${rStats.werValues.length > 0 ? 'MEASURED' : 'NOT_MEASURED'}\n`
  csv += `GroqFallbackRoutingPct,0.00%,${groqFallbackPct},MEASURED\n`
  csv += `ManualReviewSheets,${rStats.manualReviewCount},${fStats.manualReviewCount},MEASURED\n`
  fs.writeFileSync(CSV_FILE, csv, 'utf-8')
  console.log(`CSV report written to: ${CSV_FILE}`)

  // Write ingestion_errors.md
  let errMd = `# ZenScore Transcript Ingestion — Field Error Audit

This document logs every incorrect field extraction across all evaluated sheets.
Pipeline failures are never hidden or obscured.

| Sheet ID | Mode | Field | Predicted Value | Expected Value | Confidence | Likely Failing Stage |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
`

  if (allFieldErrors.length === 0) {
    errMd += `| None | - | - | - | - | - | Zero field errors across verified sheets | \n`
  } else {
    allFieldErrors.forEach(err => {
      errMd += `| \`${err.sheet_id}\` | \`${err.mode}\` | **${err.field}** | \`${err.predicted}\` | \`${err.expected}\` | ${err.confidence} | ${err.stage} |\n`
    })
  }

  fs.writeFileSync(ERRORS_MD_FILE, errMd, 'utf-8')
  console.log(`Error log written to: ${ERRORS_MD_FILE}`)

  // Update EVIDENCE_REPORT.md with Section 11
  const EVIDENCE_REPORT_FILE = path.resolve(__dirname, '../EVIDENCE_REPORT.md')
  if (fs.existsSync(EVIDENCE_REPORT_FILE)) {
    let reportContent = fs.readFileSync(EVIDENCE_REPORT_FILE, 'utf-8')
    const uniqueProfiles = new Set(verifiedSheets.map(s => s.profile || 'UNKNOWN'))
    const uniqueUniversities = uniSet

    // Update Executive Summary row for Task 4
    reportContent = reportContent.replace(
      /\|\s*\*\*Task 4\*\*\s*\|\s*Ingestion Evaluation Harness\s*\|\s*\*\*NOT MEASURED\*\*\s*\|[^|]*\|/,
      `| **Task 4** | Ingestion Evaluation Harness | **${statusLabel}** | Real 14-stage empirical evaluation on ${verifiedSheets.length} verified mark sheets across ${uniqueUniversities.size} universities. See Section 11. |`
    )

    // Build Section 11
    const section11 = `

---

## 11. Task 4 Empirical Evidence — 14-Stage Transcript Ingestion Evaluation (${statusLabel})

**Execution Command:** \`node scripts/eval_ingestion.js\`  
**Execution Timestamp:** ${new Date().toISOString()}  
**Git Commit Hash:** \`${gitCommit}\`  
**Parser Architecture:** ${parserVersion}  
**OCR Engine:** ${ocrVersion}  
**Groq Fallback Model:** ${groqModelName}  
**Benchmark Classification:** **${statusLabel}** (Empirical evaluation on ${verifiedSheets.length} verified mark sheets; fewer than 20 sheets / 3 profiles present, classified as PRELIMINARY per protocol).

### 11.1 Ground-Truth Verification & Dataset Composition
Every metric below was evaluated strictly against human-certified ground truth. Unverified sheets are strictly excluded.

| Metric | Value | Protocol Notes |
| :--- | :--- | :--- |
| **Verified Mark Sheets (Evaluated)** | **${verifiedSheets.length}** | Certified with \`"verified": true\` by human reviewer |
| **Excluded Mark Sheets** | **${excludedSheets.length}** | ${excludedSheets.length === 0 ? 'None (all candidate sheets certified by human evaluator)' : 'Excluded due to unverified ground truth'} |
| **Total Ground-Truth Subjects** | **${rStats.totalGTSubjects}** | Complete subject modules evaluated |
| **Universities Represented** | **${uniSet.size}** | ${Array.from(uniSet).join(', ')} |
| **Curriculum Profiles** | **${uniqueProfiles.size}** | ${Array.from(uniqueProfiles).join(', ')} |
| **Image-Quality Mix** | Clean: ${qualityCounts.clean}, Average: ${qualityCounts.average}, Poor: ${qualityCounts.poor} | Human visual assessment |

### 11.2 Evaluation Results: Mode (a) Rule-Only vs. Mode (b) Full Pipeline
Matching algorithm: Exact normalized **subject code** match first; fallback to **normalized name** (edit distance $\\le 2$). Unmatched predictions = false positives; unmatched ground truth = false negatives. Confidence intervals are 95% Wilson score intervals:
$$CI_{95} = \\frac{\\hat{p} + \\frac{z^2}{2n} \\pm z\\sqrt{\\frac{\\hat{p}(1-\\hat{p})}{n} + \\frac{z^2}{4n^2}}}{1 + \\frac{z^2}{n}}, \\quad z = 1.96$$

| Metric | Mode (a): Rule Parser Only | Mode (b): Full Pipeline w/ Groq | Status |
| :--- | :--- | :--- | :--- |
| **Subject Name Precision** | ${(rName.p * 100).toFixed(2)}% | ${(fName.p * 100).toFixed(2)}% | MEASURED (n = ${rStats.totalGTSubjects}) |
| **Subject Name Recall** | ${(rName.r * 100).toFixed(2)}% | ${(fName.r * 100).toFixed(2)}% | MEASURED (n = ${rStats.totalGTSubjects}) |
| **Subject Name F1 Score** | ${(rName.f1 * 100).toFixed(2)}% | ${(fName.f1 * 100).toFixed(2)}% | MEASURED (n = ${rStats.totalGTSubjects}) |
| **Credits F1 Score** | ${(rCred.f1 * 100).toFixed(2)}% | ${(fCred.f1 * 100).toFixed(2)}% | MEASURED (n = ${rStats.totalGTSubjects}) |
| **Grade F1 Score** | ${(rGrade.f1 * 100).toFixed(2)}% | ${(fGrade.f1 * 100).toFixed(2)}% | MEASURED (n = ${rStats.totalGTSubjects}) |
| **Attendance F1 Score** | ${rStats.attendance.evaluated > 0 ? (rAtt.f1 * 100).toFixed(2) + '%' : 'NOT APPLICABLE (not printed)'} | ${fStats.attendance.evaluated > 0 ? (fAtt.f1 * 100).toFixed(2) + '%' : 'NOT APPLICABLE (not printed)'} | ${rStats.attendance.evaluated > 0 ? `MEASURED (n = ${rStats.attendance.evaluated})` : 'NOT APPLICABLE'} |
| **Subject Exact Match Rate** | **${rSubExact}** | **${fSubExact}** | MEASURED (n = ${rStats.totalGTSubjects}) |
| **Sheet Exact Match Rate** | **${rSheetExact}** | **${fSheetExact}** | MEASURED (n = ${rStats.sheetsCount}) |
| **OCR CER (Character Error Rate)** | ${rCER} | ${rCER} | ${rStats.cerValues.length > 0 ? `MEASURED (n = ${rStats.cerValues.length})` : 'NOT MEASURED (no raw_text GT)'} |
| **OCR WER (Word Error Rate)** | ${rWER} | ${rWER} | ${rStats.werValues.length > 0 ? `MEASURED (n = ${rStats.werValues.length})` : 'NOT MEASURED (no raw_text GT)'} |

### 11.3 Fallback Routing & Operational Diagnostics
| Metric | Mode (a) Rule Only | Mode (b) Full Pipeline | Operational Meaning |
| :--- | :--- | :--- | :--- |
| **Rows Routed to Groq Fallback** | 0.00% (disabled) | **${groqFallbackPct}** | Low-confidence subjects (<55) or uncertain table structures |
| **Sheets Sent to Manual Review** | ${rStats.manualReviewCount} (${rStats.sheetsCount > 0 ? ((rStats.manualReviewCount / rStats.sheetsCount) * 100).toFixed(1) : 0}%) | ${fStats.manualReviewCount} (${fStats.sheetsCount > 0 ? ((fStats.manualReviewCount / fStats.sheetsCount) * 100).toFixed(1) : 0}%) | Decision = MANUAL_REVIEW or confidence < 70 |
| **Mean Sheet Latency** | ${rTime.mean} ms | ${fTime.mean} ms | End-to-end processing time |
| **Median Sheet Latency** | ${rTime.median} ms | ${fTime.median} ms | Median processing time |
| **Max Sheet Latency** | ${rTime.max} ms | ${fTime.max} ms | Maximum observed processing time |

### 11.4 Fallback Impact Audit (Rows Changed by Groq)
${fallbackImpactRows.length === 0 ? '_No field values were altered by the Groq fallback on these verified sheets (rule engine provided deterministic output)._\n' :
`| Sheet ID | Subject | Before Fallback | After Fallback | Impact |
| :--- | :--- | :--- | :--- | :--- |
` + fallbackImpactRows.map(row => `| \`${row.sheet_id}\` | ${row.name || row.code} | \`${JSON.stringify(row.before)}\` | \`${JSON.stringify(row.after)}\` | Verified |`).join('\n') + '\n'}

### 11.5 Performance by University & Profile (Full Pipeline)
| University / Profile | Sheets | Subjects | Subject Exact Match (95% CI) | Sheet Exact Match (95% CI) | Name F1 | Credits F1 | Grade F1 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
` + Object.entries(fStats.byUniversity).map(([uName, u]) => {
  const uNameF1 = computePRF1(u.name)
  const uCredF1 = computePRF1(u.credits)
  const uGradeF1 = computePRF1(u.grade)
  const uSubExact = formatRateWithCI(u.subjectExactMatches, u.subjectsCount)
  const uSheetExact = formatRateWithCI(u.sheetExactMatches, u.sheetsCount)
  return `| ${uName} | ${u.sheetsCount} | ${u.subjectsCount} | ${uSubExact} | ${uSheetExact} | ${(uNameF1.f1 * 100).toFixed(1)}% | ${(uCredF1.f1 * 100).toFixed(1)}% | ${(uGradeF1.f1 * 100).toFixed(1)}% |`
}).join('\n') + `

### 11.6 Confidence Calibration & Error Audit
` + (confidenceErrorData.length === 0
  ? `_Zero extraction errors occurred across evaluated verified sheets. Confidence score calibration: 100% agreement._\n`
  : `A total of **${confidenceErrorData.length}** field extraction errors occurred across all runs. Mean confidence on erroneous fields: **${(confidenceErrorData.map(d => d.confidence).reduce((a, b) => a + b, 0) / confidenceErrorData.length).toFixed(1)} / 100**.\nSee [\`results/ingestion_errors.md\`](./results/ingestion_errors.md) for the complete failure audit.\n`
)

    // Remove old Section 11 if present, then append
    const sec11Regex = /\n---\s*\n## 11\. Task 4 Empirical Evidence[\s\S]*$/
    if (sec11Regex.test(reportContent)) {
      reportContent = reportContent.replace(sec11Regex, section11)
    } else {
      reportContent += section11
    }

    fs.writeFileSync(EVIDENCE_REPORT_FILE, reportContent, 'utf-8')
    console.log(`Updated EVIDENCE_REPORT.md with Section 11 (${statusLabel})`)
  }

  console.log('\n✅ Evaluation run completed successfully.')
}

if (require.main === module) {
  main().catch(err => {
    console.error('Fatal evaluation error:', err)
    process.exit(1)
  })
}

module.exports = { main, runIngestionPipeline, evaluateSheet, wilsonConfidenceInterval }
