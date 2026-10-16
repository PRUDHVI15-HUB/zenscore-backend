/**
 * eval_ocr_pipeline.js
 * Section 1: Transcript OCR / Ingestion Pipeline Accuracy
 *
 * Runs 12 synthetic mark-sheet text strings (ground truth recorded BEFORE
 * running) through the deterministic parser pipeline stages:
 *   ruleParser.parseRules()  →  gradeMappingService.mapGrades()
 *   →  subjectConfidence scoring  →  decisionEngine
 *
 * For each sample, counts correct/incorrect extraction of:
 *   subject name, credits, grade (finalGrade numeric), and attendance (N/A
 *   for most transcripts — reported as not measured where absent).
 *
 * Also counts: how many required Groq fallback (stage 13) vs resolved
 * by deterministic parser alone.
 *
 * Run: node scratch/eval_ocr_pipeline.js
 */

const { parseRules }    = require('../services/parser/ruleParser')
const { mapGrades }     = require('../services/parser/gradeMappingService')

// ── Ground truth for 12 synthetic mark-sheet text inputs ──────────────────────
// Each entry:
//   text       : OCR-like raw text to feed the parser
//   groundTruth: Array of { name, credits, grade (numeric 0–10), attendance ('N/A' = not in doc) }
//   meta       : { sgpa, cgpa } for context

const samples = [
  {
    id: 'S01',
    label: 'CMR Tech Campus — IV Semester R22 (from actual raw_extracted_text.txt)',
    text: `CMR TECHNICAL CAMPUS
AUTONOMOUS
GRADE CARD
BTECH IV SEMESTER R22
COMPUTER SCIENCE AND ENGINEERING
CHINTHAPALLI PRUDHVI  Month & Year of Exam: JUNE 2025

COURSE
CODE
1 22CS401PC DISCRETE MATHEMATICS A 9 wo
2 22CS402PC DATABASE MANAGEMENT SYSTEMS als so
3 22CS403PC OPERATING SYSTEMS a+ 9 300
4 22CS404PC WEB TECHNOLOGIES o 10 soo
5 22CS405PC SOFTWARE ENGINEERING o 10 3.00
6 22CS406PC DATABASE MANAGEMENT SYSTEMS LAB o 10 red
7 22CS407PC WEB TECHNOLOGIES LAB o 10 100
8 22CS408PC DATA VISUALIZATION - R PROGRAMMING o 10 100
9 22CS409PC REAL TIME RESEARCH PROJECT o 10 2
10 22ENA10MC CONSTITUTION OF INDIA a 7 000

Semester Grade Point Average (SGPA): 9.40
Cumulative Grade Point Average (CGPA): 8.51`,
    groundTruth: [
      { name: 'DISCRETE MATHEMATICS', credits: 3, grade: 9, attendance: 'N/A' },
      { name: 'DATABASE MANAGEMENT SYSTEMS', credits: 3, grade: 8, attendance: 'N/A' },  // ALS = A = 8
      { name: 'OPERATING SYSTEMS', credits: 3, grade: 9, attendance: 'N/A' },
      { name: 'WEB TECHNOLOGIES', credits: 3, grade: 10, attendance: 'N/A' },
      { name: 'SOFTWARE ENGINEERING', credits: 3, grade: 10, attendance: 'N/A' },
      { name: 'DATABASE MANAGEMENT SYSTEMS LAB', credits: 1, grade: 10, attendance: 'N/A' },
      { name: 'WEB TECHNOLOGIES LAB', credits: 1, grade: 10, attendance: 'N/A' },
      { name: 'DATA VISUALIZATION - R PROGRAMMING', credits: 1, grade: 10, attendance: 'N/A' },
      { name: 'REAL TIME RESEARCH PROJECT', credits: 2, grade: 10, attendance: 'N/A' },
      { name: 'CONSTITUTION OF INDIA', credits: 0, grade: 7, attendance: 'N/A' },
    ]
  },
  {
    id: 'S02',
    label: 'Simple 5-subject semester, clean tabular format',
    text: `JNTU HYDERABAD
B.TECH II SEMESTER RESULTS — R18

Roll No: 18B41A0501  Name: RAVI KUMAR

SNo  Course Code  Subject Name              Credits  Grade  Points
1    18B41A0501   MATHEMATICS II            4        A+     9
2    18B41A0502   ENGINEERING PHYSICS       3        A      8
3    18B41A0503   BASIC ELECTRICAL          3        B+     7
4    18B41A0504   PROGRAMMING IN C          4        O      10
5    18B41A0505   ENGINEERING WORKSHOP      2        B      6

SGPA: 8.18  CGPA: 8.18`,
    groundTruth: [
      { name: 'MATHEMATICS II', credits: 4, grade: 9, attendance: 'N/A' },
      { name: 'ENGINEERING PHYSICS', credits: 3, grade: 8, attendance: 'N/A' },
      { name: 'BASIC ELECTRICAL', credits: 3, grade: 7, attendance: 'N/A' },
      { name: 'PROGRAMMING IN C', credits: 4, grade: 10, attendance: 'N/A' },
      { name: 'ENGINEERING WORKSHOP', credits: 2, grade: 6, attendance: 'N/A' },
    ]
  },
  {
    id: 'S03',
    label: '8-subject semester with lab entries',
    text: `OSMANIA UNIVERSITY
B.E. III SEMESTER — 2023

Student: ANITHA REDDY  Hall Ticket: 123456

Code       Subject                            Cr  Grade
OU301CS    DATA STRUCTURES                    4   A+   9
OU302CS    DISCRETE MATHEMATICS               3   O    10
OU303CS    DIGITAL LOGIC DESIGN               3   A    8
OU304CS    COMPUTER ORGANIZATION              3   B+   7
OU305CS    PROBABILITY AND STATISTICS         3   B    6
OU306CS    DATA STRUCTURES LAB                2   O    10
OU307CS    DIGITAL DESIGN LAB                 2   A    8
OU308CS    ENVIRONMENTAL SCIENCE              0   P    4

SGPA: 8.25`,
    groundTruth: [
      { name: 'DATA STRUCTURES', credits: 4, grade: 9, attendance: 'N/A' },
      { name: 'DISCRETE MATHEMATICS', credits: 3, grade: 10, attendance: 'N/A' },
      { name: 'DIGITAL LOGIC DESIGN', credits: 3, grade: 8, attendance: 'N/A' },
      { name: 'COMPUTER ORGANIZATION', credits: 3, grade: 7, attendance: 'N/A' },
      { name: 'PROBABILITY AND STATISTICS', credits: 3, grade: 6, attendance: 'N/A' },
      { name: 'DATA STRUCTURES LAB', credits: 2, grade: 10, attendance: 'N/A' },
      { name: 'DIGITAL DESIGN LAB', credits: 2, grade: 8, attendance: 'N/A' },
      { name: 'ENVIRONMENTAL SCIENCE', credits: 0, grade: 4, attendance: 'N/A' },
    ]
  },
  {
    id: 'S04',
    label: 'Noisy OCR with pipe separators and spacing issues',
    text: `COLLEGE OF ENGINEERING AND TECHNOLOGY
| Grade Card | SEMESTER V |
Roll: 19CS001  Branch: CSE

| 19CS501 | MACHINE LEARNING           | A+ | 9 | 3.00 |
| 19CS502 | BIG DATA ANALYTICS         | A  | 8 | 3.00 |
| 19CS503 | COMPUTER NETWORKS          | O  | 10 | 3.00 |
| 19CS504 | SOFTWARE PROJECT MGMT      | B+ | 7 | 2.00 |
| 19CS505 | ML LAB                     | O  | 10 | 1.00 |

SGPA: 8.82`,
    groundTruth: [
      { name: 'MACHINE LEARNING', credits: 3, grade: 9, attendance: 'N/A' },
      { name: 'BIG DATA ANALYTICS', credits: 3, grade: 8, attendance: 'N/A' },
      { name: 'COMPUTER NETWORKS', credits: 3, grade: 10, attendance: 'N/A' },
      { name: 'SOFTWARE PROJECT MGMT', credits: 2, grade: 7, attendance: 'N/A' },
      { name: 'ML LAB', credits: 1, grade: 10, attendance: 'N/A' },
    ]
  },
  {
    id: 'S05',
    label: 'Grade F subjects (failure cases)',
    text: `UNIVERSITY OF EXAMPLE
B.TECH IV SEMESTER SUPPLEMENTARY

Student: MOHIT SHARMA  Roll: 20CSE089

Code    Subject                 Cr  Grade  GP
20CS401 ALGORITHM DESIGN        3   F      0
20CS402 OPERATING SYSTEMS       3   C      5
20CS403 DATABASE SYSTEMS        3   A      8
20CS404 COMPUTER NETWORKS       3   B+     7
20CS405 DBMS LAB                1   O      10

SGPA: 5.00`,
    groundTruth: [
      { name: 'ALGORITHM DESIGN', credits: 3, grade: 0, attendance: 'N/A' },
      { name: 'OPERATING SYSTEMS', credits: 3, grade: 5, attendance: 'N/A' },
      { name: 'DATABASE SYSTEMS', credits: 3, grade: 8, attendance: 'N/A' },
      { name: 'COMPUTER NETWORKS', credits: 3, grade: 7, attendance: 'N/A' },
      { name: 'DBMS LAB', credits: 1, grade: 10, attendance: 'N/A' },
    ]
  },
  {
    id: 'S06',
    label: 'Minimal 3-subject semester',
    text: `STATE UNIVERSITY
FIRST YEAR FIRST SEMESTER

Roll: 23ME001  Department: MECH

CS101  ENGINEERING MATHEMATICS    4   O   10   3.00
CS102  ENGINEERING PHYSICS        3   A+  9    3.00
CS103  WORKSHOP PRACTICE          2   A   8    2.00

SGPA: 9.22`,
    groundTruth: [
      { name: 'ENGINEERING MATHEMATICS', credits: 3, grade: 10, attendance: 'N/A' },
      { name: 'ENGINEERING PHYSICS', credits: 3, grade: 9, attendance: 'N/A' },
      { name: 'WORKSHOP PRACTICE', credits: 2, grade: 8, attendance: 'N/A' },
    ]
  },
  {
    id: 'S07',
    label: 'Multi-line subject name (wrapped text)',
    text: `ENGINEERING COLLEGE
VI SEMESTER GRADE CARD 2024

Roll No: 21ECE045

EE601  POWER SYSTEMS ANALYSIS
       AND STABILITY              3   A+  9   3.00
EE602  DIGITAL SIGNAL PROCESSING 4   O   10  3.00
EE603  VLSI DESIGN               3   A   8   3.00
EE604  MICROPROCESSORS           3   B+  7   3.00
EE605  PSA LAB                   1   O   10  1.00

SGPA: 8.80`,
    groundTruth: [
      { name: 'POWER SYSTEMS ANALYSIS', credits: 3, grade: 9, attendance: 'N/A' }, // may or may not join "AND STABILITY"
      { name: 'DIGITAL SIGNAL PROCESSING', credits: 4, grade: 10, attendance: 'N/A' },
      { name: 'VLSI DESIGN', credits: 3, grade: 8, attendance: 'N/A' },
      { name: 'MICROPROCESSORS', credits: 3, grade: 7, attendance: 'N/A' },
      { name: 'PSA LAB', credits: 1, grade: 10, attendance: 'N/A' },
    ]
  },
  {
    id: 'S08',
    label: 'R22 scheme with grade letter only (no numeric)',
    text: `TECH COLLEGE
B.TECH II YEAR I SEMESTER R22

Registration: 22MC0001

22MC301  COMPUTER NETWORKS                  A+  3.00
22MC302  THEORY OF COMPUTATION              O   3.00
22MC303  OBJECT ORIENTED PROGRAMMING        A   3.00
22MC304  DESIGN AND ANALYSIS OF ALGORITHMS  B+  2.00
22MC305  OOP LAB                            O   1.00

SGPA: 8.58`,
    groundTruth: [
      { name: 'COMPUTER NETWORKS', credits: 3, grade: 9, attendance: 'N/A' },
      { name: 'THEORY OF COMPUTATION', credits: 3, grade: 10, attendance: 'N/A' },
      { name: 'OBJECT ORIENTED PROGRAMMING', credits: 3, grade: 8, attendance: 'N/A' },
      { name: 'DESIGN AND ANALYSIS OF ALGORITHMS', credits: 2, grade: 7, attendance: 'N/A' },
      { name: 'OOP LAB', credits: 1, grade: 10, attendance: 'N/A' },
    ]
  },
  {
    id: 'S09',
    label: 'Mixed O / A+ / S grade letters (100-point scale converted)',
    text: `AUTONOMOUS INSTITUTE
B.TECH SEMESTER VII 2025

Enrollment: 20CSE200

20CS701  ARTIFICIAL INTELLIGENCE   3  S   10  3.00
20CS702  BLOCKCHAIN TECHNOLOGY     3  O   10  3.00
20CS703  CLOUD COMPUTING           3  A+  9   3.00
20CS704  INTERNET OF THINGS        3  A   8   3.00
20CS705  IOT LAB                   2  O   10  2.00
20CS706  PROJECT WORK              4  A   8   0.00

SGPA: 9.31`,
    groundTruth: [
      { name: 'ARTIFICIAL INTELLIGENCE', credits: 3, grade: 10, attendance: 'N/A' },
      { name: 'BLOCKCHAIN TECHNOLOGY', credits: 3, grade: 10, attendance: 'N/A' },
      { name: 'CLOUD COMPUTING', credits: 3, grade: 9, attendance: 'N/A' },
      { name: 'INTERNET OF THINGS', credits: 3, grade: 8, attendance: 'N/A' },
      { name: 'IOT LAB', credits: 2, grade: 10, attendance: 'N/A' },
      { name: 'PROJECT WORK', credits: 4, grade: 8, attendance: 'N/A' },
    ]
  },
  {
    id: 'S10',
    label: 'All F grades — bottom CGPA',
    text: `UNIVERSITY NAME
B.TECH III SEMESTER SUPPLEMENTARY

ID: 20CS901

CS301  MATHEMATICS III              3  F  0   3.00
CS302  DATA STRUCTURES              4  F  0   3.00
CS303  DIGITAL ELECTRONICS          3  F  0   3.00
CS304  COMPUTER ARCHITECTURE        3  F  0   3.00

SGPA: 0.00`,
    groundTruth: [
      { name: 'MATHEMATICS III', credits: 3, grade: 0, attendance: 'N/A' },
      { name: 'DATA STRUCTURES', credits: 4, grade: 0, attendance: 'N/A' },
      { name: 'DIGITAL ELECTRONICS', credits: 3, grade: 0, attendance: 'N/A' },
      { name: 'COMPUTER ARCHITECTURE', credits: 3, grade: 0, attendance: 'N/A' },
    ]
  },
  {
    id: 'S11',
    label: 'Long subject names with abbreviations',
    text: `EXAMPLE UNIVERSITY
B.TECH V SEMESTER

Reg No: 21IT601

21IT501  DISTRIBUTED COMPUTING SYS      3  A  8   3.00
21IT502  HUMAN COMPUTER INTERACTION      3  O  10  3.00
21IT503  NETWORK SECURITY & CRYPTOGRAPHY 3 A+ 9   3.00
21IT504  ADVANCED DATABASE MGMT SYS     3  B+ 7   3.00
21IT505  WEB SERVICES & SOA             3  A  8   3.00
21IT506  NETWORK SECURITY LAB           1  O  10  1.00

SGPA: 8.67`,
    groundTruth: [
      { name: 'DISTRIBUTED COMPUTING SYS', credits: 3, grade: 8, attendance: 'N/A' },
      { name: 'HUMAN COMPUTER INTERACTION', credits: 3, grade: 10, attendance: 'N/A' },
      { name: 'NETWORK SECURITY & CRYPTOGRAPHY', credits: 3, grade: 9, attendance: 'N/A' },
      { name: 'ADVANCED DATABASE MGMT SYS', credits: 3, grade: 7, attendance: 'N/A' },
      { name: 'WEB SERVICES & SOA', credits: 3, grade: 8, attendance: 'N/A' },
      { name: 'NETWORK SECURITY LAB', credits: 1, grade: 10, attendance: 'N/A' },
    ]
  },
  {
    id: 'S12',
    label: 'Credit-0 elective mixed with regular subjects',
    text: `STATE TECHNICAL UNIVERSITY
SEMESTER VI GRADE CARD

Student: KEERTHI VARMA  ID: 20CSE120

20CS601  MACHINE LEARNING           4  O  10  3.00
20CS602  SOFTWARE TESTING           3  A  8   3.00
20CS603  COMPILER DESIGN            3  A+ 9   3.00
20CS604  OPEN ELECTIVE: YOGA        0  P  4   0.00
20CS605  ML LAB                     1  O  10  1.00
20CS606  SOFTWARE TESTING LAB       1  A  8   1.00

SGPA: 8.47`,
    groundTruth: [
      { name: 'MACHINE LEARNING', credits: 3, grade: 10, attendance: 'N/A' },
      { name: 'SOFTWARE TESTING', credits: 3, grade: 8, attendance: 'N/A' },
      { name: 'COMPILER DESIGN', credits: 3, grade: 9, attendance: 'N/A' },
      { name: 'OPEN ELECTIVE YOGA', credits: 0, grade: 4, attendance: 'N/A' },
      { name: 'ML LAB', credits: 1, grade: 10, attendance: 'N/A' },
      { name: 'SOFTWARE TESTING LAB', credits: 1, grade: 8, attendance: 'N/A' },
    ]
  },
]

// ── Evaluation logic ─────────────────────────────────────────────────────────

let totalFieldsChecked = 0
let correctFields      = 0
let sampleResults      = []
let groqFallbackCount  = 0
let deterministicCount = 0

const normalize = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim()

console.log('════════════════════════════════════════════════════════════════')
console.log('  Section 1: OCR / Ingestion Pipeline Accuracy (12 Samples)')
console.log('  Stages tested: ruleParser → gradeMappingService')
console.log('  Note: attendance field = "N/A" in all 12 samples (not in doc)')
console.log('════════════════════════════════════════════════════════════════\n')

for (const sample of samples) {
  let parsed
  try {
    const rawParsed = parseRules(sample.text)
    parsed = mapGrades(rawParsed)
  } catch (err) {
    console.log(`❌ ${sample.id} PARSE ERROR: ${err.message}`)
    sampleResults.push({ id: sample.id, label: sample.label, error: err.message })
    continue
  }

  const extracted = parsed.subjects || []

  // Decide if Groq fallback was invoked (heuristic: low confidence or empty subjects)
  const confidence = parsed.metadata?.layoutConfidence || 0
  const usedGroq = extracted.length === 0 || confidence < 0.3
  if (usedGroq) {
    groqFallbackCount++
  } else {
    deterministicCount++
  }

  const gt = sample.groundTruth
  const matchedGT = new Set()
  let sampleCorrect = 0
  let sampleTotal = 0
  const perSubject = []

  for (const gtSubj of gt) {
    // Try to find the best match in extracted subjects
    const gtNorm = normalize(gtSubj.name)
    let bestMatch = null
    let bestScore = 0

    for (const ext of extracted) {
      const extNorm = normalize(ext.name || '')
      // Simple overlap score
      const gtWords = gtNorm.split(' ')
      const matchWords = gtWords.filter(w => extNorm.includes(w) && w.length > 2)
      const score = matchWords.length / gtWords.length
      if (score > bestScore) {
        bestScore = score
        bestMatch = ext
      }
    }

    const threshold = 0.5
    const nameMatch = bestMatch && bestScore >= threshold

    // Check each field
    const nameOk   = nameMatch ? 1 : 0
    const credOk   = (nameMatch && bestMatch.credits === gtSubj.credits) ? 1 : 0
    const gradeOk  = (nameMatch && bestMatch.finalGrade === gtSubj.grade) ? 1 : 0
    // Attendance: all N/A in these samples

    sampleTotal   += 3  // name, credits, grade per subject (attendance skipped)
    sampleCorrect += nameOk + credOk + gradeOk

    perSubject.push({
      gt: gtSubj.name,
      found: nameMatch ? bestMatch.name : '—',
      matchScore: bestScore.toFixed(2),
      nameOk: nameOk === 1,
      credGT: gtSubj.credits, credEx: nameMatch ? bestMatch.credits : '?', credOk: credOk === 1,
      gradeGT: gtSubj.grade, gradeEx: nameMatch ? bestMatch.finalGrade : '?', gradeOk: gradeOk === 1,
    })
  }

  totalFieldsChecked += sampleTotal
  correctFields      += sampleCorrect
  const accuracy = sampleTotal > 0 ? ((sampleCorrect / sampleTotal) * 100).toFixed(1) : 'N/A'

  console.log(`${usedGroq ? '⚠️ ' : '✅'} ${sample.id}: ${sample.label}`)
  console.log(`   GT subjects: ${gt.length}  Extracted: ${extracted.length}  Fields: ${sampleCorrect}/${sampleTotal} (${accuracy}%)  Groq fallback: ${usedGroq ? 'YES' : 'NO'}`)
  perSubject.forEach(p => {
    const mark = (p.nameOk && p.credOk && p.gradeOk) ? '✅' : p.nameOk ? '⚠️' : '❌'
    console.log(`   ${mark} "${p.gt}"`)
    console.log(`      Found: "${p.found}" (sim=${p.matchScore}) | Cr: ${p.credGT}→${p.credEx}(${p.credOk?'OK':'MISS'}) | Grade: ${p.gradeGT}→${p.gradeEx}(${p.gradeOk?'OK':'MISS'})`)
  })
  console.log()

  sampleResults.push({
    id: sample.id,
    label: sample.label,
    gtCount: gt.length,
    extractedCount: extracted.length,
    fieldsCorrect: sampleCorrect,
    fieldsTotal: sampleTotal,
    accuracy,
    usedGroq,
    parserConfidence: confidence
  })
}

// ── Summary ────────────────────────────────────────────────────────────────────
const overallAccuracy = totalFieldsChecked > 0
  ? ((correctFields / totalFieldsChecked) * 100).toFixed(1)
  : 'N/A'

console.log('════════════════════════════════════════════════════════════════')
console.log('  PIPELINE ACCURACY SUMMARY')
console.log('════════════════════════════════════════════════════════════════')
console.log(`  Samples processed      : ${sampleResults.filter(r => !r.error).length} / ${samples.length}`)
console.log(`  Total fields checked   : ${totalFieldsChecked}  (name + credits + grade; attendance=N/A for all)`)
console.log(`  Fields correctly extracted: ${correctFields}`)
console.log(`  Field-level accuracy   : ${overallAccuracy}%`)
console.log(`  Deterministic parser resolved: ${deterministicCount} / ${samples.length}`)
console.log(`  Groq fallback (stage 13) required: ${groqFallbackCount} / ${samples.length}`)
console.log(`  Note: Groq fallback heuristic = confidence < 0.3 OR 0 subjects extracted`)
console.log('════════════════════════════════════════════════════════════════')
