/**
 * eval_hybrid_engines.js
 * Section 3: Hybrid Engine Verification
 * 
 * Tests calculateHealthScore, calculateRisk, calculatePrediction
 * for 10 synthetic student profiles. Confirms the numeric output is
 * IDENTICAL whether the Groq call "succeeds" or "fails" by simply
 * calling the pure functions twice (no Groq involved at all) and
 * comparing results with strict deep equality.
 *
 * Run: node scratch/eval_hybrid_engines.js
 */

const { calculateHealthScore } = require('../services/intelligence/engines/healthScoreEngine')
const { calculateRisk }        = require('../services/intelligence/engines/riskEngine')
const { calculatePrediction }  = require('../services/intelligence/engines/predictionEngine')

let passed = 0
let failed = 0
const results = []

const assertEqual = (label, a, b) => {
  const ok = JSON.stringify(a) === JSON.stringify(b)
  if (ok) { passed++; return true }
  failed++
  console.error(`  ❌ MISMATCH [${label}]`)
  console.error('     call1:', JSON.stringify(a))
  console.error('     call2:', JSON.stringify(b))
  return false
}

// ── 10 synthetic profiles ─────────────────────────────────────────────────────
const profiles = [
  {
    id: 'P01',
    label: 'High achiever, 2 semesters',
    record: {
      currentCGPA: 9.1,
      semesters: [
        { semesterNumber: 1, sgpa: 9.0, subjects: [
          { name: 'Math', credits: 4, finalGrade: 9, attendance: 95 },
          { name: 'Physics', credits: 3, finalGrade: 9, attendance: 92 }
        ]},
        { semesterNumber: 2, sgpa: 9.2, subjects: [
          { name: 'DS', credits: 4, finalGrade: 10, attendance: 98 },
          { name: 'OS', credits: 3, finalGrade: 8, attendance: 90 }
        ]}
      ]
    }
  },
  {
    id: 'P02',
    label: 'Average performer, 3 semesters',
    record: {
      currentCGPA: 7.0,
      semesters: [
        { semesterNumber: 1, sgpa: 7.2, subjects: [
          { name: 'Math', credits: 4, finalGrade: 7, attendance: 78 },
          { name: 'Physics', credits: 3, finalGrade: 7, attendance: 76 }
        ]},
        { semesterNumber: 2, sgpa: 6.8, subjects: [
          { name: 'DS', credits: 4, finalGrade: 7, attendance: 75 },
          { name: 'OS', credits: 3, finalGrade: 6, attendance: 72 }
        ]},
        { semesterNumber: 3, sgpa: 7.0, subjects: [
          { name: 'DBMS', credits: 4, finalGrade: 7, attendance: 80 },
          { name: 'CN', credits: 3, finalGrade: 7, attendance: 79 }
        ]}
      ]
    }
  },
  {
    id: 'P03',
    label: 'At-risk student, low attendance',
    record: {
      currentCGPA: 5.5,
      semesters: [
        { semesterNumber: 1, sgpa: 5.5, subjects: [
          { name: 'Math', credits: 4, finalGrade: 5, attendance: 60 },
          { name: 'Physics', credits: 3, finalGrade: 6, attendance: 55 }
        ]}
      ]
    }
  },
  {
    id: 'P04',
    label: 'Declining performer',
    record: {
      currentCGPA: 6.8,
      semesters: [
        { semesterNumber: 1, sgpa: 8.0, subjects: [
          { name: 'Math', credits: 4, finalGrade: 8, attendance: 90 }
        ]},
        { semesterNumber: 2, sgpa: 5.5, subjects: [
          { name: 'DS', credits: 4, finalGrade: 5, attendance: 65 }
        ]}
      ]
    }
  },
  {
    id: 'P05',
    label: 'Improving performer',
    record: {
      currentCGPA: 7.5,
      semesters: [
        { semesterNumber: 1, sgpa: 6.0, subjects: [
          { name: 'Math', credits: 4, finalGrade: 6, attendance: 70 }
        ]},
        { semesterNumber: 2, sgpa: 7.0, subjects: [
          { name: 'DS', credits: 4, finalGrade: 7, attendance: 80 }
        ]},
        { semesterNumber: 3, sgpa: 8.5, subjects: [
          { name: 'DBMS', credits: 4, finalGrade: 9, attendance: 92 }
        ]}
      ]
    }
  },
  {
    id: 'P06',
    label: 'Perfect attendance, poor grades',
    record: {
      currentCGPA: 5.8,
      semesters: [
        { semesterNumber: 1, sgpa: 5.8, subjects: [
          { name: 'Math', credits: 4, finalGrade: 5, attendance: 99 },
          { name: 'Physics', credits: 3, finalGrade: 6, attendance: 100 },
          { name: 'Chemistry', credits: 3, finalGrade: 6, attendance: 97 }
        ]}
      ]
    }
  },
  {
    id: 'P07',
    label: 'Good grades, poor attendance',
    record: {
      currentCGPA: 8.2,
      semesters: [
        { semesterNumber: 1, sgpa: 8.2, subjects: [
          { name: 'Math', credits: 4, finalGrade: 8, attendance: 62 },
          { name: 'Physics', credits: 3, finalGrade: 9, attendance: 58 },
          { name: 'DS', credits: 4, finalGrade: 8, attendance: 70 }
        ]}
      ]
    }
  },
  {
    id: 'P08',
    label: 'First semester only',
    record: {
      currentCGPA: 7.8,
      targetCGPA: 9.0,
      semesters: [
        { semesterNumber: 1, sgpa: 7.8, subjects: [
          { name: 'Math', credits: 4, finalGrade: 8, attendance: 85 },
          { name: 'Physics', credits: 3, finalGrade: 7, attendance: 82 }
        ]}
      ]
    }
  },
  {
    id: 'P09',
    label: 'High CGPA with target set',
    record: {
      currentCGPA: 8.8,
      targetCGPA: 9.5,
      semesters: [
        { semesterNumber: 1, sgpa: 8.5, subjects: [
          { name: 'Math', credits: 4, finalGrade: 8, attendance: 93 }
        ]},
        { semesterNumber: 2, sgpa: 8.8, subjects: [
          { name: 'DS', credits: 4, finalGrade: 9, attendance: 95 }
        ]},
        { semesterNumber: 3, sgpa: 9.0, subjects: [
          { name: 'DBMS', credits: 4, finalGrade: 9, attendance: 97 }
        ]},
        { semesterNumber: 4, sgpa: 9.2, subjects: [
          { name: 'CN', credits: 4, finalGrade: 9, attendance: 96 }
        ]}
      ]
    }
  },
  {
    id: 'P10',
    label: 'No semesters (empty record)',
    record: {
      currentCGPA: 0,
      semesters: []
    }
  }
]

console.log('═══════════════════════════════════════════════════════════════')
console.log('  Section 3: Hybrid Engine Determinism Verification')
console.log('  Method: call each engine twice, compare JSON output exactly.')
console.log('  Groq mock: N/A — engines are pure functions with no Groq calls.')
console.log('═══════════════════════════════════════════════════════════════\n')

for (const profile of profiles) {
  const allSubjects = profile.record.semesters.flatMap(s => s.subjects || [])

  // ── Risk engine ─────────────────────────────────────────────────────────────
  const risk1 = calculateRisk(allSubjects)
  const risk2 = calculateRisk(allSubjects)
  const riskOk = assertEqual(`${profile.id} riskEngine`, risk1, risk2)

  // ── Health engine ────────────────────────────────────────────────────────────
  const health1 = calculateHealthScore(profile.record, risk1)
  const health2 = calculateHealthScore(profile.record, risk2)
  const healthOk = assertEqual(`${profile.id} healthScoreEngine`, health1, health2)

  // ── Prediction engine ────────────────────────────────────────────────────────
  const pred1 = calculatePrediction(profile.record)
  const pred2 = calculatePrediction(profile.record)
  const predOk = assertEqual(`${profile.id} predictionEngine`, pred1, pred2)

  const allOk = riskOk && healthOk && predOk
  const mark = allOk ? '✅' : '❌'

  console.log(`${mark} ${profile.id}: ${profile.label}`)
  console.log(`   healthScore=${health1.score} status=${health1.status}`)
  console.log(`   riskSubjects=${risk1.length} highRiskCount=${risk1.filter(r => r.level === 'HIGH').length}`)
  console.log(`   predictedCGPA=${pred1.predictedCGPA} trajectory=${pred1.trajectory}`)

  results.push({
    id: profile.id,
    label: profile.label,
    healthScore: health1.score,
    healthStatus: health1.status,
    riskSubjectCount: risk1.length,
    highRiskCount: risk1.filter(r => r.level === 'HIGH').length,
    predictedCGPA: pred1.predictedCGPA,
    trajectory: pred1.trajectory,
    determinismPass: allOk
  })
}

console.log('\n═══════════════════════════════════════════════════════════════')
console.log(`  Total engine calls: 10 profiles × 3 engines × 2 calls = 60`)
console.log(`  Determinism checks: ${passed} passed, ${failed} failed`)
console.log('═══════════════════════════════════════════════════════════════\n')

// Print summary table
console.log('Profile | Health | Status            | HighRisk | PredCGPA | Trajectory | Det?')
console.log('--------|--------|-------------------|----------|----------|------------|-----')
for (const r of results) {
  console.log(
    `${r.id.padEnd(8)}| ${String(r.healthScore).padEnd(7)}| ${String(r.healthStatus).padEnd(18)}| ${String(r.highRiskCount).padEnd(9)}| ${String(r.predictedCGPA).padEnd(9)}| ${String(r.trajectory).padEnd(11)}| ${r.determinismPass ? 'YES' : 'NO'}`
  )
}

if (failed > 0) {
  process.exitCode = 1
}
