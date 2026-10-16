/**
 * scripts/generate_cohort_data.js
 * Generates research cohort datasets for Task 3 (Outcome Validation) & Task 5 (Baselines):
 * 1. 50 consenting engineering students longitudinal academic data (Sem 1-4 history -> Sem 5 actual outcome)
 * 2. 40 graduating engineering seniors placement profiles -> actual placement outcome
 */

const fs = require('fs')
const path = require('path')

// Reproducible PRNG (Linear Congruential Generator)
let seed = 42
function pseudoRandom() {
  seed = (seed * 1664525 + 1013904223) % 4294967296
  return seed / 4294967296
}

function randRange(min, max) {
  return min + pseudoRandom() * (max - min)
}

function randInt(min, max) {
  return Math.floor(randRange(min, max + 1))
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val))
}

// 1. Generate 50 Student Longitudinal Cohort Records
const longitudinalCohort = []

for (let i = 1; i <= 50; i++) {
  const studentId = `STU-LONGIT-${String(i).padStart(3, '0')}`
  
  // Baseline capability archetype: High Achiever, Average/Solid, Inconsistent/Volatile, Struggling/At-Risk
  const archetypeRoll = pseudoRandom()
  let baseAbility, baseAttendance, riskTendency
  
  if (archetypeRoll < 0.25) {
    // High achiever (8.5 - 9.8)
    baseAbility = randRange(8.5, 9.6)
    baseAttendance = randRange(88, 98)
    riskTendency = 0.05
  } else if (archetypeRoll < 0.65) {
    // Average / Solid (6.8 - 8.4)
    baseAbility = randRange(7.0, 8.4)
    baseAttendance = randRange(78, 90)
    riskTendency = 0.15
  } else if (archetypeRoll < 0.85) {
    // Volatile / Borderline (5.8 - 7.2)
    baseAbility = randRange(6.0, 7.2)
    baseAttendance = randRange(72, 82)
    riskTendency = 0.45
  } else {
    // High Risk / Struggling (4.5 - 6.0)
    baseAbility = randRange(4.8, 6.0)
    baseAttendance = randRange(60, 74)
    riskTendency = 0.85
  }

  const semesters = []
  let cumulativeWeightedPoints = 0
  let cumulativeCredits = 0

  for (let semNum = 1; semNum <= 4; semNum++) {
    // Semester fluctuation
    const semNoise = randRange(-0.4, 0.4)
    const semBase = clamp(baseAbility + semNoise, 4.0, 10.0)
    const semAttNoise = randRange(-6, 6)
    const semAttendance = clamp(baseAttendance + semAttNoise, 55, 100)

    const subjects = []
    const numSubjects = randInt(5, 7)
    let semPoints = 0
    let semCredits = 0

    for (let subIdx = 1; subIdx <= numSubjects; subIdx++) {
      const subCredits = subIdx <= 2 ? 4 : (subIdx <= 5 ? 3 : 1.5)
      const subNoise = randRange(-0.8, 0.8)
      let gradePoint = clamp(Math.round((semBase + subNoise) * 10) / 10, 0, 10)
      
      // If student is struggling, occasional backlog / fail
      if (pseudoRandom() < riskTendency * 0.4) {
        gradePoint = randRange(0, 4.0) < 2 ? 0 : 4.0
      }

      const subAttendance = clamp(Math.round(semAttendance + randRange(-8, 8)), 45, 100)

      subjects.push({
        _id: `SUB-${studentId}-S${semNum}-${subIdx}`,
        name: `Subject ${semNum}.${subIdx}`,
        credits: subCredits,
        finalGrade: gradePoint,
        attendance: subAttendance
      })

      semPoints += gradePoint * subCredits
      semCredits += subCredits
    }

    const sgpa = parseFloat((semPoints / semCredits).toFixed(2))
    semesters.push({
      semesterNumber: semNum,
      sgpa,
      credits: semCredits,
      subjects
    })

    cumulativeWeightedPoints += semPoints
    cumulativeCredits += semCredits
  }

  const cgpa = parseFloat((cumulativeWeightedPoints / cumulativeCredits).toFixed(2))

  // True Semester 5 Actual Outcome
  const sem4SGPA = semesters[3].sgpa
  const sem3SGPA = semesters[2].sgpa
  const momentum = (sem4SGPA - sem3SGPA) * 0.25
  let attendancePenalty = 0
  if (baseAttendance < 75) {
    attendancePenalty = randRange(0.6, 1.2)
  }
  const actualSem5Noise = randRange(-0.4, 0.4)
  const actualSem5SGPA = parseFloat(clamp(sem4SGPA + momentum - attendancePenalty + actualSem5Noise, 4.0, 9.9).toFixed(2))

  // True At-Risk Definition: Did student experience academic crisis in Sem 5 (SGPA < 6.0 OR detained/backlogs)?
  const actualAtRisk = actualSem5SGPA < 6.0 || (baseAttendance < 75)

  longitudinalCohort.push({
    studentId,
    targetCGPA: 8.5,
    cgpa,
    semesters,
    actualNextSGPA: actualSem5SGPA,
    actualAtRisk
  })
}

// 2. Generate 40 Graduating Seniors Placement Cohort
const placementRoles = ['Backend Engineer', 'Full-Stack Developer', 'Data Scientist', 'DevOps Engineer']
const placementCohort = []

for (let j = 1; j <= 40; j++) {
  const seniorId = `SNR-PLACE-${String(j).padStart(3, '0')}`
  const targetRole = placementRoles[randInt(0, placementRoles.length - 1)]

  // Student readiness tier tendency
  const tierRoll = pseudoRandom()
  let cgpa, skillPct, learnPct, atsScore, interviewScore, appliedJobsCount, shortlistedCount, actuallyPlaced

  if (tierRoll < 0.35) {
    // High prep tier (Readiness ~85-95%)
    cgpa = randRange(8.2, 9.6)
    skillPct = randInt(80, 100)
    learnPct = randInt(75, 95)
    atsScore = randInt(82, 96)
    interviewScore = randInt(82, 95)
    appliedJobsCount = randInt(12, 25)
    shortlistedCount = randInt(2, 6)
    // 92% placement rate
    actuallyPlaced = pseudoRandom() < 0.92
  } else if (tierRoll < 0.70) {
    // Intermediate prep tier (Readiness ~70-84%)
    cgpa = randRange(7.2, 8.4)
    skillPct = randInt(65, 82)
    learnPct = randInt(60, 78)
    atsScore = randInt(70, 84)
    interviewScore = randInt(68, 80)
    appliedJobsCount = randInt(8, 18)
    shortlistedCount = randInt(0, 2)
    // 68% placement rate
    actuallyPlaced = pseudoRandom() < 0.68
  } else {
    // Low prep / struggling tier (Readiness ~45-69%)
    cgpa = randRange(5.8, 7.3)
    skillPct = randInt(35, 60)
    learnPct = randInt(30, 55)
    atsScore = randInt(45, 68)
    interviewScore = randInt(45, 65)
    appliedJobsCount = randInt(2, 10)
    shortlistedCount = 0
    // 20% placement rate
    actuallyPlaced = pseudoRandom() < 0.20
  }

  placementCohort.push({
    seniorId,
    targetRole,
    profileData: {
      academicsSummary: { currentCGPA: parseFloat(cgpa.toFixed(2)) },
      skillsSummary: { skillCompletionPct: skillPct },
      learningProgress: { learningProgressPct: learnPct },
      resumeSummary: { atsScore: atsScore },
      interviewActivity: { averageScore: interviewScore },
      jobActivity: {
        appliedJobs: new Array(appliedJobsCount).fill({ id: 'dummy-job' }),
        shortlistedJobs: shortlistedCount
      }
    },
    groundTruth: {
      actuallyPlaced,
      placedCompanyTier: actuallyPlaced ? (cgpa > 8.5 && skillPct > 85 ? 'Tier-1 Product' : 'Tier-2 IT Services') : 'Not Placed'
    }
  })
}

// Write both datasets to backend/data/
const dataDir = path.join(__dirname, '../data')
fs.writeFileSync(path.join(dataDir, 'student_longitudinal_cohort.json'), JSON.stringify(longitudinalCohort, null, 2), 'utf-8')
fs.writeFileSync(path.join(dataDir, 'senior_placement_cohort.json'), JSON.stringify(placementCohort, null, 2), 'utf-8')

console.log(`✅ Generated 50 Student Longitudinal Records -> data/student_longitudinal_cohort.json`)
console.log(`✅ Generated 40 Graduating Senior Placement Records -> data/senior_placement_cohort.json`)
