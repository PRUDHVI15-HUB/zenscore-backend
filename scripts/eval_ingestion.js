/**
 * eval_ingestion.js
 * 
 * Evaluation Harness for ZenScore AI 14-Stage Transcript Ingestion Pipeline.
 * 
 * Evaluates real mark sheet files (images/PDFs) in eval/transcripts/images/
 * against verified ground truth JSONs in eval/transcripts/ground_truth/.
 * 
 * Adheres to HARD RULES:
 * - NEVER simulates, fabricates, or estimates numbers.
 * - If eval/transcripts/ is empty, does NOT seed fake data; reports NOT MEASURED.
 * - Saves results to results/ingestion_eval.csv, results/ingestion_eval.md, and results/ingestion_errors.json.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') })
const fs = require('fs')
const path = require('path')

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
const CSV_FILE = path.join(RESULTS_DIR, 'ingestion_eval.csv')
const MD_FILE = path.join(RESULTS_DIR, 'ingestion_eval.md')
const ERRORS_FILE = path.join(RESULTS_DIR, 'ingestion_errors.json')

// Levenshtein distance utility for text similarity, CER, and WER
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
        dp[i - 1][j] + 1,      // deletion
        dp[i][j - 1] + 1,      // insertion
        dp[i - 1][j - 1] + cost // substitution
      )
    }
  }
  return dp[m][n]
}

function stringSimilarity(str1, str2) {
  const s1 = (str1 || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '')
  const s2 = (str2 || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '')
  if (s1 === s2) return 1.0
  if (!s1 || !s2) return 0.0
  const dist = levenshteinDistance(s1, s2)
  const maxLen = Math.max(s1.length, s2.length)
  return 1 - dist / maxLen
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

async function extractTextFromFile(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  const buffer = fs.readFileSync(filePath)

  if (ext === '.pdf') {
    const pdfParse = require('pdf-parse')
    const pdfData = await pdfParse(buffer)
    return pdfData.text
  } else if (['.png', '.jpg', '.jpeg', '.tiff', '.bmp'].includes(ext)) {
    // Tesseract.js real OCR
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

// Executes the complete 14-stage pipeline on extracted raw text
async function execute14StagePipeline(rawText, buffer) {
  // Stage 1: Upload Buffer Validation
  if (!buffer || buffer.length === 0) throw new Error('Empty buffer')

  // Stage 2: Fingerprint / Hash Generation
  const hash = generateFingerprint(buffer)

  // Stage 3: Document Classification (mimeType detection)
  const mimeType = 'application/octet-stream'

  // Stage 4: Raw Text Ingestion
  // (already extracted as rawText)

  // Stage 5: Text Cleaning & Normalization
  const cleanedText = cleanText(rawText)

  // Stage 6: Document Quality Analysis
  const quality = analyzeDocumentQuality(cleanedText, mimeType, null)

  // Stage 7: Academic Table Isolation
  const isolation = isolateTable(cleanedText)

  // Stage 8: University Profile Detection
  const { profile, profileId } = detectProfile(cleanedText, isolation.tableLines)

  // Stage 9: Deterministic Rule-Based Parsing
  let parsed = parseRules(isolation.tableLines, cleanedText, profile)

  // Record pre-fallback rule output for accuracy comparison
  const preFallbackSubjects = JSON.parse(JSON.stringify(parsed.subjects || []))

  // Stage 10: Grade & Result Mapping
  parsed = gradeMappingService.mapGrades(parsed)

  // Stage 11: Subject Confidence Scoring & Flags
  const confidenceContexts = parsed.metadata?.confidenceContexts || []
  parsed.subjects = (parsed.subjects || []).map((sub, idx) => {
    sub.confidence = scoreSubject(sub, confidenceContexts[idx] || {})
    return sub
  })
  parsed.subjects = addResultFlags(parsed.subjects)
  parsed.confidence = computeOverallConfidence(parsed.subjects)

  // Stage 12: Credit & Academic Summary Calculation
  parsed.summary = calculateCredits(parsed.subjects, cleanedText)

  // Stage 13: Data Contract Validation
  const validated = validationLayer.validateContract(parsed)

  // Stage 14: Decision Engine & Verification Routing (Groq fallback if needed)
  let routed = decidePipelineRoute(validated)
  let groqFallbackInvoked = false
  let rowsRoutedToGroq = 0

  if (routed.metadata.decision === 'GROQ' || routed.subjects.some(s => (s.confidence || 0) < 55)) {
    groqFallbackInvoked = true
    rowsRoutedToGroq = routed.subjects.filter(s => (s.confidence || 0) < 55).length
    if (process.env.GROQ_API_KEY) {
      try {
        routed = await verifyWithGroq(isolation.isolatedText, routed)
      } catch (groqErr) {
        console.warn('Groq verification notice:', groqErr.message)
      }
    }
  }

  return {
    rawText,
    cleanedText,
    profileId,
    preFallbackSubjects,
    postFallbackResult: routed,
    groqFallbackInvoked,
    rowsRoutedToGroq,
    sentToManualReview: routed.metadata.decision === 'MANUAL_REVIEW' || (routed.confidence || 0) < 70
  }
}

async function main() {
  console.log('================================================================')
  console.log('  ZenScore AI — 14-Stage Transcript Ingestion Evaluation Harness')
  console.log('================================================================\n')

  if (!fs.existsSync(RESULTS_DIR)) {
    fs.mkdirSync(RESULTS_DIR, { recursive: true })
  }

  // Check if images directory exists and contains benchmark sheets
  const imageFiles = fs.existsSync(IMAGES_DIR)
    ? fs.readdirSync(IMAGES_DIR).filter(f => !f.startsWith('.') && f !== 'placeholder.txt')
    : []

  if (imageFiles.length === 0) {
    const missingMessage = 
      '⚠️  EVALUATION NOTICE: No mark sheet images or PDFs found in eval/transcripts/images/.\n' +
      '   To evaluate transcript ingestion accuracy:\n' +
      '   1. Place at least 20 mark sheets (from at least 3 universities if possible) into eval/transcripts/images/\n' +
      '   2. Provide corresponding ground-truth JSON files in eval/transcripts/ground_truth/\n' +
      '   3. Refer to eval/transcripts/template.json and eval/transcripts/README.md for instructions.\n\n' +
      '   STATUS: NOT MEASURED - n = 0 mark sheets in eval/transcripts/images/.\n'
    
    console.log(missingMessage)

    // Write NOT MEASURED status files
    const mdNotMeasured = 
      '# ZenScore AI — Transcript Ingestion Evaluation Report\n\n' +
      `**Generated**: ${new Date().toISOString()}\n\n` +
      '> [!WARNING]\n' +
      '> **Status**: NOT MEASURED\n' +
      '> **Reason**: `eval/transcripts/images/` is empty (n = 0 sheets). At least 20 real mark sheets from at least 3 universities must be provided to run the 14-stage benchmark.\n\n' +
      '| Metric | Value | Status |\n' +
      '| :--- | :--- | :--- |\n' +
      '| Total Mark Sheets | 0 | NOT MEASURED |\n' +
      '| Total Subjects | 0 | NOT MEASURED |\n' +
      '| Universities Represented | 0 | NOT MEASURED |\n' +
      '| Subject Name F1 | N/A | NOT MEASURED |\n' +
      '| Credits F1 | N/A | NOT MEASURED |\n' +
      '| Grade F1 | N/A | NOT MEASURED |\n' +
      '| Attendance F1 | N/A | NOT MEASURED |\n' +
      '| Subject Exact Match Rate | N/A | NOT MEASURED |\n' +
      '| Character Error Rate (CER) | N/A | NOT MEASURED |\n' +
      '| Word Error Rate (WER) | N/A | NOT MEASURED |\n' +
      '| Groq Fallback Routing % | N/A | NOT MEASURED |\n' +
      '| Sheets to Manual Review | N/A | NOT MEASURED |\n'

    fs.writeFileSync(MD_FILE, mdNotMeasured, 'utf-8')
    fs.writeFileSync(CSV_FILE, 'Metric,Value,Status\nTotalMarkSheets,0,NOT_MEASURED\nTotalSubjects,0,NOT_MEASURED\n', 'utf-8')
    fs.writeFileSync(ERRORS_FILE, JSON.stringify({ status: 'NOT MEASURED', count: 0, errors: [] }, null, 2), 'utf-8')

    return
  }

  console.log(`Discovered ${imageFiles.length} mark sheet files in eval/transcripts/images/`)

  const stats = {
    sheetsCount: 0,
    subjectsCount: 0,
    universities: {},
    name: { tp: 0, fp: 0, fn: 0 },
    credits: { tp: 0, fp: 0, fn: 0 },
    grade: { tp: 0, fp: 0, fn: 0 },
    attendance: { tp: 0, fp: 0, fn: 0 },
    exactMatches: 0,
    totalEvaluatedSubjects: 0,
    preFallbackMatches: 0,
    postFallbackMatches: 0,
    rowsRoutedToGroq: 0,
    totalRows: 0,
    manualReviewSheets: 0,
    cerSum: 0,
    werSum: 0,
    textComparisonCount: 0
  }

  const perSheetErrors = []

  for (const file of imageFiles) {
    const filePath = path.join(IMAGES_DIR, file)
    const baseName = path.parse(file).name
    const gtFile = path.join(GT_DIR, `${baseName}.json`)

    if (!fs.existsSync(gtFile)) {
      console.warn(`⚠️ Ground truth JSON missing for ${file} (expected at ${gtFile}). Skipping.`)
      continue
    }

    const gt = JSON.parse(fs.readFileSync(gtFile, 'utf-8'))
    const buffer = fs.readFileSync(filePath)
    const rawText = await extractTextFromFile(filePath)

    const runResult = await execute14StagePipeline(rawText, buffer)
    const predictedSubjects = runResult.postFallbackResult.subjects || []
    const groundTruthSubjects = gt.subjects || []

    stats.sheetsCount++
    const uni = gt.university || 'AUTONOMOUS'
    stats.universities[uni] = (stats.universities[uni] || 0) + 1
    if (runResult.sentToManualReview) stats.manualReviewSheets++

    stats.rowsRoutedToGroq += runResult.rowsRoutedToGroq
    stats.totalRows += predictedSubjects.length

    // CER / WER against ground-truth text if provided
    if (gt.rawText) {
      const cer = calculateCER(gt.rawText, rawText)
      const wer = calculateWER(gt.rawText, rawText)
      stats.cerSum += cer
      stats.werSum += wer
      stats.textComparisonCount++
    }

    const sheetErrors = []

    // Field-level comparison
    groundTruthSubjects.forEach((gtSub) => {
      stats.subjectsCount++
      stats.totalEvaluatedSubjects++

      // Match predicted subject by highest name / code similarity
      let bestMatch = null
      let bestScore = 0
      predictedSubjects.forEach(pSub => {
        const score = Math.max(
          stringSimilarity(pSub.name, gtSub.name),
          stringSimilarity(pSub.code, gtSub.code)
        )
        if (score > bestScore) {
          bestScore = score
          bestMatch = pSub
        }
      })

      if (!bestMatch || bestScore < 0.6) {
        stats.name.fn++
        stats.credits.fn++
        stats.grade.fn++
        if (gtSub.attendance !== null && gtSub.attendance !== undefined) stats.attendance.fn++
        sheetErrors.push({ subject: gtSub.name, reason: 'Subject completely missed by table parser' })
        return
      }

      // 1. Subject Name check
      if (bestScore >= 0.85) {
        stats.name.tp++
      } else {
        stats.name.fp++
        sheetErrors.push({ subject: gtSub.name, field: 'name', expected: gtSub.name, actual: bestMatch.name })
      }

      // 2. Credits check
      if (Number(bestMatch.credits) === Number(gtSub.credits)) {
        stats.credits.tp++
      } else {
        stats.credits.fp++
        sheetErrors.push({ subject: gtSub.name, field: 'credits', expected: gtSub.credits, actual: bestMatch.credits })
      }

      // 3. Grade check
      const gradeMatches = 
        String(bestMatch.rawGrade).trim().toUpperCase() === String(gtSub.grade).trim().toUpperCase() ||
        Number(bestMatch.finalGrade) === Number(gtSub.gradePoints)
      if (gradeMatches) {
        stats.grade.tp++
      } else {
        stats.grade.fp++
        sheetErrors.push({ subject: gtSub.name, field: 'grade', expected: gtSub.grade, actual: bestMatch.rawGrade })
      }

      // 4. Attendance check (if present in GT)
      if (gtSub.attendance !== null && gtSub.attendance !== undefined) {
        if (Number(bestMatch.attendance) === Number(gtSub.attendance)) {
          stats.attendance.tp++
        } else {
          stats.attendance.fp++
          sheetErrors.push({ subject: gtSub.name, field: 'attendance', expected: gtSub.attendance, actual: bestMatch.attendance })
        }
      }

      // Subject-level Exact Match (all fields must match)
      const exactMatch = (bestScore >= 0.85) &&
        (Number(bestMatch.credits) === Number(gtSub.credits)) &&
        gradeMatches &&
        (gtSub.attendance == null || Number(bestMatch.attendance) === Number(gtSub.attendance))

      if (exactMatch) {
        stats.exactMatches++
        stats.postFallbackMatches++
      }
    })

    if (sheetErrors.length > 0) {
      perSheetErrors.push({ sheet: file, university: uni, errors: sheetErrors })
    }
  }

  // Calculate Precision, Recall, F1 for each field
  const computeF1 = (f) => {
    const prec = (f.tp + f.fp) > 0 ? f.tp / (f.tp + f.fp) : 0
    const rec = (f.tp + f.fn) > 0 ? f.tp / (f.tp + f.fn) : 0
    const f1 = (prec + rec) > 0 ? (2 * prec * rec) / (prec + rec) : 0
    return {
      precision: (prec * 100).toFixed(2) + '%',
      recall: (rec * 100).toFixed(2) + '%',
      f1: (f1 * 100).toFixed(2) + '%'
    }
  }

  const nameF1 = computeF1(stats.name)
  const creditsF1 = computeF1(stats.credits)
  const gradeF1 = computeF1(stats.grade)
  const attF1 = computeF1(stats.attendance)

  const exactMatchRate = stats.totalEvaluatedSubjects > 0
    ? ((stats.exactMatches / stats.totalEvaluatedSubjects) * 100).toFixed(2) + '%'
    : 'N/A'

  const avgCER = stats.textComparisonCount > 0 ? ((stats.cerSum / stats.textComparisonCount) * 100).toFixed(2) + '%' : 'SKIPPED (no rawText GT)'
  const avgWER = stats.textComparisonCount > 0 ? ((stats.werSum / stats.textComparisonCount) * 100).toFixed(2) + '%' : 'SKIPPED (no rawText GT)'
  const groqPercent = stats.totalRows > 0 ? ((stats.rowsRoutedToGroq / stats.totalRows) * 100).toFixed(2) + '%' : '0.00%'

  // Write CSV
  let csv = 'Metric,Precision,Recall,F1\n'
  csv += `SubjectName,${nameF1.precision},${nameF1.recall},${nameF1.f1}\n`
  csv += `Credits,${creditsF1.precision},${creditsF1.recall},${creditsF1.f1}\n`
  csv += `Grade,${gradeF1.precision},${gradeF1.recall},${gradeF1.f1}\n`
  csv += `Attendance,${attF1.precision},${attF1.recall},${attF1.f1}\n`
  csv += `ExactMatchRate,${exactMatchRate},N/A,${exactMatchRate}\n`
  fs.writeFileSync(CSV_FILE, csv, 'utf-8')

  // Write Markdown Report
  let md = '# ZenScore AI — Transcript Ingestion Evaluation Report\n\n'
  md += `**Execution Timestamp**: ${new Date().toISOString()}\n`
  md += `**Total Mark Sheets Evaluated**: ${stats.sheetsCount}\n`
  md += `**Total Subjects Evaluated**: ${stats.subjectsCount}\n`
  md += `**Universities Tested**: ${Object.entries(stats.universities).map(([u, c]) => `${u} (${c})`).join(', ')}\n\n`

  md += '### Field-Level Extraction Accuracy\n\n'
  md += '| Field | Precision | Recall | F1 Score |\n'
  md += '| :--- | :--- | :--- | :--- |\n'
  md += `| **Subject Name** | ${nameF1.precision} | ${nameF1.recall} | ${nameF1.f1} |\n`
  md += `| **Credits** | ${creditsF1.precision} | ${creditsF1.recall} | ${creditsF1.f1} |\n`
  md += `| **Grade** | ${gradeF1.precision} | ${gradeF1.recall} | ${gradeF1.f1} |\n`
  md += `| **Attendance** | ${attF1.precision} | ${attF1.recall} | ${attF1.f1} |\n\n`

  md += '### Pipeline Performance & Fallback Statistics\n\n'
  md += `| Metric | Result |\n`
  md += `| :--- | :--- |\n`
  md += `| **Subject-Level Exact-Match Rate** | ${exactMatchRate} |\n`
  md += `| **OCR Character Error Rate (CER)** | ${avgCER} |\n`
  md += `| **OCR Word Error Rate (WER)** | ${avgWER} |\n`
  md += `| **Rows Routed to Groq LLM Fallback** | ${groqPercent} (${stats.rowsRoutedToGroq}/${stats.totalRows} rows) |\n`
  md += `| **Sheets Sent to Manual Student Review** | ${stats.manualReviewSheets} (${stats.sheetsCount > 0 ? ((stats.manualReviewSheets / stats.sheetsCount) * 100).toFixed(1) : 0}%) |\n\n`

  fs.writeFileSync(MD_FILE, md, 'utf-8')
  fs.writeFileSync(ERRORS_FILE, JSON.stringify(perSheetErrors, null, 2), 'utf-8')

  console.log('✅ Ingestion evaluation completed.')
  console.log(`Results saved to: ${CSV_FILE} and ${MD_FILE}`)
}

main().catch(err => {
  console.error('Fatal error running ingestion evaluation:', err)
  process.exit(1)
})
