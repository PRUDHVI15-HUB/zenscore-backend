/**
 * eval_latency.js
 * Section 4: Response Latency
 *
 * Measures wall-clock time for:
 *   (a) Pure pipeline computation (deterministic engines — no I/O)
 *       Note: Full transcript ingestion end-to-end requires DB+file upload,
 *       so this measures the pure parse+analyze computation.
 *   (b) ATS resume-scoring call (analyzeATS — pure function)
 *   (c) Health/Risk engine computation (pure function)
 *   (d) Academic Copilot: NOT measurable without live Groq API call — see report
 *
 * All measured via process.hrtime.bigint() — 10 runs each.
 * Reports min/median/max in milliseconds.
 */

const { parseRules }          = require('../services/parser/ruleParser')
const { mapGrades }           = require('../services/parser/gradeMappingService')
const { analyzeATS }          = require('../services/resume/resumeAnalysisService')
const { calculateHealthScore }= require('../services/intelligence/engines/healthScoreEngine')
const { calculateRisk }       = require('../services/intelligence/engines/riskEngine')
const { calculatePrediction } = require('../services/intelligence/engines/predictionEngine')

const RUNS = 10

const time = (fn) => {
  const start = process.hrtime.bigint()
  fn()
  const end = process.hrtime.bigint()
  return Number(end - start) / 1e6  // convert nanoseconds to ms
}

const stats = (arr) => {
  const sorted = [...arr].sort((a, b) => a - b)
  const min    = sorted[0]
  const max    = sorted[sorted.length - 1]
  const median = sorted.length % 2 === 0
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : sorted[Math.floor(sorted.length / 2)]
  return { min: min.toFixed(3), median: median.toFixed(3), max: max.toFixed(3), rawMs: sorted.map(v => v.toFixed(3)) }
}

// ── Payload fixtures ─────────────────────────────────────────────────────────

const sampleTranscriptText = `CMR TECHNICAL CAMPUS
AUTONOMOUS
GRADE CARD
BTECH IV SEMESTER R22
COMPUTER SCIENCE AND ENGINEERING
CHINTHAPALLI PRUDHVI Month & Year of Exam: JUNE 2025
1 22CS401PC DISCRETE MATHEMATICS A 9 wo
2 22CS402PC DATABASE MANAGEMENT SYSTEMS als so
3 22CS403PC OPERATING SYSTEMS a+ 9 300
4 22CS404PC WEB TECHNOLOGIES o 10 soo
5 22CS405PC SOFTWARE ENGINEERING o 10 3.00
6 22CS406PC DATABASE MANAGEMENT SYSTEMS LAB o 10 red
7 22CS407PC WEB TECHNOLOGIES LAB o 10 100
8 22CS408PC DATA VISUALIZATION o 10 100
9 22CS409PC REAL TIME RESEARCH PROJECT o 10 2
10 22ENA10MC CONSTITUTION OF INDIA a 7 000
SGPA: 9.40  CGPA: 8.51`

const sampleResume = {
  candidate: { email: 'a@a.com', phone: '9000000001', location: 'Hyderabad', linkedin: 'li/a' },
  summary: 'Experienced full-stack developer with 2 years of professional experience.',
  education: [{ degree: 'B.Tech CSE', institution: 'XYZ University', year: 2025 }],
  experience: [
    { company: 'TechCorp', title: 'Software Engineer', duration: '1 year' },
    { company: 'StartupXY', title: 'Intern', duration: '6 months' }
  ],
  internships: [],
  projects: [
    { title: 'Portfolio Site', tech: 'React, Node.js' },
    { title: 'E-commerce App', tech: 'Next.js, MongoDB' }
  ],
  skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Express', 'SQL', 'MongoDB', 'HTML', 'CSS', 'Docker', 'Git'],
  certifications: [{ name: 'AWS Cloud Practitioner' }],
  achievements: []
}

const sampleAcademicRecord = {
  currentCGPA: 7.5,
  semesters: [
    { semesterNumber: 1, sgpa: 7.0, subjects: [
      { name: 'Math', credits: 4, finalGrade: 7, attendance: 78 },
      { name: 'Physics', credits: 3, finalGrade: 7, attendance: 76 }
    ]},
    { semesterNumber: 2, sgpa: 7.5, subjects: [
      { name: 'DS', credits: 4, finalGrade: 7, attendance: 80 },
      { name: 'OS', credits: 3, finalGrade: 8, attendance: 82 }
    ]},
    { semesterNumber: 3, sgpa: 8.0, subjects: [
      { name: 'DBMS', credits: 4, finalGrade: 8, attendance: 85 },
      { name: 'CN', credits: 3, finalGrade: 8, attendance: 83 }
    ]}
  ]
}

// ─────────────────────────────────────────────────────────────────────────────

console.log('════════════════════════════════════════════════════════════════')
console.log(`  Section 4: Response Latency — ${RUNS} runs each`)
console.log('  All measurements: process.hrtime.bigint() → milliseconds')
console.log('════════════════════════════════════════════════════════════════\n')

// ── (a) Transcript Parse + GradeMap computation (deterministic pipeline stages)
const aTimes = []
for (let i = 0; i < RUNS; i++) {
  aTimes.push(time(() => {
    const raw = parseRules(sampleTranscriptText)
    mapGrades(raw)
  }))
}
const aStats = stats(aTimes)
console.log('(a) Transcript parse+gradeMap pipeline computation (pure JS):')
console.log(`    Runs:   ${aTimes.map(t => t.toFixed(3) + 'ms').join(' | ')}`)
console.log(`    Min: ${aStats.min}ms  Median: ${aStats.median}ms  Max: ${aStats.max}ms\n`)

// ── (b) ATS resume-scoring call
const bTimes = []
for (let i = 0; i < RUNS; i++) {
  bTimes.push(time(() => analyzeATS(sampleResume)))
}
const bStats = stats(bTimes)
console.log('(b) ATS resume-scoring (analyzeATS — pure function):')
console.log(`    Runs:   ${bTimes.map(t => t.toFixed(3) + 'ms').join(' | ')}`)
console.log(`    Min: ${bStats.min}ms  Median: ${bStats.median}ms  Max: ${bStats.max}ms\n`)

// ── (c) Health+Risk engine computation
const cTimes = []
for (let i = 0; i < RUNS; i++) {
  cTimes.push(time(() => {
    const allSubjects = sampleAcademicRecord.semesters.flatMap(s => s.subjects)
    const risks = calculateRisk(allSubjects)
    calculateHealthScore(sampleAcademicRecord, risks)
    calculatePrediction(sampleAcademicRecord)
  }))
}
const cStats = stats(cTimes)
console.log('(c) Health + Risk + Prediction engine computation (pure functions):')
console.log(`    Runs:   ${cTimes.map(t => t.toFixed(3) + 'ms').join(' | ')}`)
console.log(`    Min: ${cStats.min}ms  Median: ${cStats.median}ms  Max: ${cStats.max}ms\n`)

// ── (d) Academic Copilot round-trip
console.log('(d) Academic Copilot (Groq round-trip):')
console.log('    NOT MEASURED in this session.')
console.log('    Reason: Making 10 live Groq API calls from a pure-latency eval script')
console.log('    would incur rate limits and real cost. The server is running (npm run dev)')
console.log('    and the API endpoint is /api/copilot/chat, but a controlled 10-run')
console.log('    measurement requires authenticated HTTP sessions with valid user tokens.')
console.log('    A single informal request to the running server was not timed because')
console.log('    the user must be authenticated — this section is marked NOT MEASURED.')

console.log('\n════════════════════════════════════════════════════════════════')
console.log('  LATENCY SUMMARY TABLE')
console.log('════════════════════════════════════════════════════════════════')
console.log('  Operation                    Min(ms)    Median(ms)  Max(ms)')
console.log('  --------------------------   ---------- ----------- --------')
console.log(`  (a) Transcript parse+map     ${String(aStats.min).padEnd(10)} ${String(aStats.median).padEnd(11)} ${aStats.max}`)
console.log(`  (b) ATS resume scoring       ${String(bStats.min).padEnd(10)} ${String(bStats.median).padEnd(11)} ${bStats.max}`)
console.log(`  (c) Health+Risk+Prediction   ${String(cStats.min).padEnd(10)} ${String(cStats.median).padEnd(11)} ${cStats.max}`)
console.log('  (d) Copilot (Groq r-trip)    NOT MEASURED — see above')
console.log('════════════════════════════════════════════════════════════════')
