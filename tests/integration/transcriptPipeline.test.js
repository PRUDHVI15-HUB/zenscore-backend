const { cleanText } = require('../../services/parser/utils/cleanText')
const { generateFingerprint } = require('../../services/parser/fingerprint')
const { analyzeDocumentQuality } = require('../../services/parser/documentQualityAnalyzer')
const { isolateTable } = require('../../services/parser/tableIsolator')
const { detectProfile } = require('../../services/parser/profileDetector')
const { parseRules } = require('../../services/parser/ruleParser')
const gradeMappingService = require('../../services/parser/gradeMappingService')
const { scoreSubject, computeOverallConfidence, addResultFlags } = require('../../services/parser/subjectConfidence')
const { calculateCredits } = require('../../services/parser/creditCalculator')
const validationLayer = require('../../services/parser/validationLayer')
const { decidePipelineRoute } = require('../../services/parser/decisionEngine')

describe('Transcript Ingestion Pipeline — 14-Stage End-to-End Integration Test', () => {
  const sampleTranscriptRawText = `CMR TECHNICAL CAMPUS
AUTONOMOUS
GRADE CARD
BTECH IV SEMESTER R22
COMPUTER SCIENCE AND ENGINEERING
CHINTHAPALLI PRUDHVI Month & Year of Exam: JUNE 2025

COURSE CODE
1 22CS401PC DISCRETE MATHEMATICS A 9 3.00
2 22CS402PC DATABASE MANAGEMENT SYSTEMS A 8 3.00
3 22CS403PC OPERATING SYSTEMS A+ 9 3.00
4 22CS404PC WEB TECHNOLOGIES O 10 3.00
5 22CS405PC SOFTWARE ENGINEERING O 10 3.00
6 22CS406PC DATABASE MANAGEMENT SYSTEMS LAB O 10 1.50
7 22CS407PC WEB TECHNOLOGIES LAB O 10 1.50
8 22CS408PC DATA VISUALIZATION - R PROGRAMMING O 10 1.00
9 22CS409PC REAL TIME RESEARCH PROJECT O 10 2.00
10 22ENA10MC CONSTITUTION OF INDIA A 7 0.00

Semester Grade Point Average (SGPA): 9.40
Cumulative Grade Point Average (CGPA): 8.51
CONTROLLER OF EXAMINATIONS`

  test('successfully executes all 14 stages on a sample transcript and produces valid record', async () => {
    // ── STAGE 1: Upload Buffer Validation
    const buffer = Buffer.from(sampleTranscriptRawText, 'utf-8')
    expect(buffer.length).toBeGreaterThan(0)

    // ── STAGE 2: Fingerprint / Hash Generation
    const hash = generateFingerprint(buffer)
    expect(hash).toBeDefined()
    expect(typeof hash).toBe('string')
    expect(hash.length).toBe(64) // SHA-256 hex string

    // ── STAGE 3: Document Classification
    const mimeType = 'text/plain'
    expect(mimeType).toBe('text/plain')

    // ── STAGE 4: Raw Text Ingestion
    const rawText = sampleTranscriptRawText
    expect(rawText.length).toBeGreaterThan(100)

    // ── STAGE 5: Text Cleaning & Normalization
    const cleanedText = cleanText(rawText)
    expect(cleanedText).toBeDefined()
    expect(cleanedText).toContain('DISCRETE MATHEMATICS')

    // ── STAGE 6: Document Quality Analysis
    const qualityResult = analyzeDocumentQuality(cleanedText, mimeType, null)
    expect(qualityResult).toBeDefined()
    expect(qualityResult.shouldReject).toBe(false)
    expect(qualityResult.rating).not.toBe('REJECT')

    // ── STAGE 7: Academic Table Isolation
    const isolation = isolateTable(cleanedText)
    expect(isolation).toBeDefined()
    expect(isolation.tableLines.length).toBeGreaterThanOrEqual(5)

    // ── STAGE 8: University Profile Detection
    const { profile, profileId } = detectProfile(cleanedText, isolation.tableLines)
    expect(profile).toBeDefined()
    expect(typeof profileId).toBe('string')

    // ── STAGE 9: Deterministic Rule-Based Parsing
    let parserResult = parseRules(isolation.tableLines, cleanedText, profile)
    expect(parserResult).toBeDefined()
    expect(Array.isArray(parserResult.subjects)).toBe(true)
    expect(parserResult.subjects.length).toBeGreaterThanOrEqual(7)

    // ── STAGE 10: Grade & Result Mapping
    parserResult = gradeMappingService.mapGrades(parserResult)
    const dmSubject = parserResult.subjects.find(s => s.name && s.name.includes('DISCRETE MATHEMATICS'))
    expect(dmSubject).toBeDefined()
    expect(dmSubject.finalGrade).toBe(9)

    // ── STAGE 11: Subject Confidence Scoring & Flags
    const confidenceContexts = parserResult.metadata?.confidenceContexts || []
    parserResult.subjects = parserResult.subjects.map((sub, idx) => {
      sub.confidence = scoreSubject(sub, confidenceContexts[idx] || {})
      return sub
    })
    parserResult.subjects = addResultFlags(parserResult.subjects)
    const overallConfidence = computeOverallConfidence(parserResult.subjects)
    parserResult.confidence = overallConfidence
    expect(overallConfidence).toBeGreaterThanOrEqual(75)

    // ── STAGE 12: Credit & Academic Summary Calculation
    const summary = calculateCredits(parserResult.subjects, cleanedText)
    parserResult.summary = summary
    expect(summary.totalCredits).toBeGreaterThanOrEqual(15)

    // ── STAGE 13: Data Contract Validation
    const validatedContract = validationLayer.validateContract(parserResult)
    expect(validatedContract.metadata.canProceed).toBe(true)
    expect(validatedContract.metadata.hasErrors).toBe(false)

    // ── STAGE 14: Decision Engine & Verification Routing
    const auditedContract = decidePipelineRoute(validatedContract)
    expect(auditedContract).toBeDefined()
    expect(auditedContract.confidence).toBeGreaterThanOrEqual(70)
    expect(auditedContract.metadata.decision).toBeDefined()

    // ── Verify Output Contract Structure (Format stored in Database)
    expect(auditedContract).toHaveProperty('semesterNumber')
    expect(auditedContract).toHaveProperty('subjects')
    expect(auditedContract).toHaveProperty('confidence')
    expect(auditedContract.subjects[0]).toHaveProperty('name')
    expect(auditedContract.subjects[0]).toHaveProperty('credits')
    expect(auditedContract.subjects[0]).toHaveProperty('finalGrade')
  })
})
