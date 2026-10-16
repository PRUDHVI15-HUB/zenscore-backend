const fs = require('fs')
const path = require('path')

const universities = [
  {
    name: 'JNTUH_R22',
    label: 'JNTU Hyderabad (R22 Regulation)',
    codes: ['22CS401PC', '22CS402PC', '22CS403PC', '22CS404PC', '22CS405PC', '22CS406PC', '22CS407PC', '22CS408PC'],
    subjects: [
      'DISCRETE MATHEMATICS',
      'DATABASE MANAGEMENT SYSTEMS',
      'OPERATING SYSTEMS',
      'WEB TECHNOLOGIES',
      'SOFTWARE ENGINEERING',
      'DATABASE MANAGEMENT SYSTEMS LAB',
      'WEB TECHNOLOGIES LAB',
      'DATA VISUALIZATION - R PROGRAMMING'
    ],
    credits: [3, 3, 3, 3, 3, 1.5, 1.5, 1]
  },
  {
    name: 'JNTUH_R18',
    label: 'JNTU Hyderabad (R18 Regulation)',
    codes: ['CS501PC', 'CS502PC', 'CS503PC', 'CS504PC', 'CS505PC', 'CS506PC', 'CS507PC', 'CS508PC'],
    subjects: [
      'FORMAL LANGUAGES AND AUTOMATA THEORY',
      'SOFTWARE ENGINEERING',
      'COMPUTER NETWORKS',
      'WEB TECHNOLOGIES',
      'PROFESSIONAL ELECTIVE-I',
      'SOFTWARE ENGINEERING LAB',
      'COMPUTER NETWORKS LAB',
      'ADVANCED COMMUNICATION SKILLS LAB'
    ],
    credits: [4, 4, 4, 3, 3, 1.5, 1.5, 1.5]
  },
  {
    name: 'AUTONOMOUS',
    label: 'Autonomous Engineering College (UGC Affiliated)',
    codes: ['21CSE301', '21CSE302', '21CSE303', '21CSE304', '21CSE305', '21CSL306', '21CSL307'],
    subjects: [
      'DESIGN AND ANALYSIS OF ALGORITHMS',
      'COMPUTER ORGANIZATION AND ARCHITECTURE',
      'OBJECT ORIENTED PROGRAMMING USING JAVA',
      'PROBABILITY AND QUEUING THEORY',
      'ENVIRONMENTAL SCIENCE AND SUSTAINABILITY',
      'ALGORITHMS AND DATA STRUCTURES LAB',
      'JAVA AND WEB APPLICATIONS LAB'
    ],
    credits: [4, 3, 3, 4, 0, 1.5, 1.5]
  },
  {
    name: 'VTU',
    label: 'Visvesvaraya Technological University (VTU Belagavi)',
    codes: ['21CS51', '21CS52', '21CS53', '21CS54', '21CSL55', '21CSL56', '21CIV57'],
    subjects: [
      'MANAGEMENT AND ENTREPRENEURSHIP',
      'COMPUTER NETWORKS AND SECURITY',
      'DATABASE MANAGEMENT SYSTEM',
      'AUTOMATA THEORY AND COMPILER DESIGN',
      'DBMS LABORATORY WITH MINI PROJECT',
      'COMPUTER NETWORKS LABORATORY',
      'ENVIRONMENTAL STUDIES'
    ],
    credits: [3, 4, 4, 3, 1.5, 1.5, 1]
  },
  {
    name: 'ANNA_UNIV',
    label: 'Anna University Chennai (Regulation 2021)',
    codes: ['CS3451', 'CS3491', 'CS3492', 'CS3401', 'GE3451', 'CS3461', 'CS3481'],
    subjects: [
      'INTRODUCTION TO OPERATING SYSTEMS',
      'ARTIFICIAL INTELLIGENCE AND MACHINE LEARNING',
      'DATABASE MANAGEMENT SYSTEMS',
      'ALGORITHMS',
      'ENVIRONMENTAL SCIENCES AND SUSTAINABILITY',
      'OPERATING SYSTEMS LABORATORY',
      'DATABASE MANAGEMENT SYSTEMS LABORATORY'
    ],
    credits: [3, 4, 3, 4, 2, 1.5, 1.5]
  }
]

const gradePointsMap = {
  'O': 10, 'A+': 9, 'A': 8, 'B+': 7, 'B': 6, 'C': 5, 'F': 0
}

function generate50Transcripts() {
  const transcripts = []

  for (let i = 1; i <= 50; i++) {
    const univ = universities[(i - 1) % universities.length]
    const semNum = ((i % 8) || 8)
    const isDegraded = i % 4 === 0 // 25% are degraded OCR quality with OCR noise
    const isBorderline = i % 5 === 0 // Contains low-confidence borderline recognition

    const subjectsData = []
    let totalGradePoints = 0
    let totalCredits = 0

    const gradePool = isBorderline ? ['B', 'B+', 'C', 'F', 'A'] : ['O', 'A+', 'A', 'A+', 'B+', 'O']

    univ.subjects.forEach((subName, sIdx) => {
      const code = univ.codes[sIdx]
      const credits = univ.credits[sIdx]
      const grade = gradePool[(i + sIdx) % gradePool.length]
      const points = gradePointsMap[grade]
      const result = points > 0 ? 'PASS' : 'FAIL'

      if (credits > 0) {
        totalGradePoints += points * credits
        totalCredits += credits
      }

      subjectsData.push({
        id: `sub_${i}_${sIdx + 1}`,
        code,
        name: subName,
        credits,
        grade,
        gradePoints: points,
        result
      })
    })

    const sgpa = totalCredits > 0 ? parseFloat((totalGradePoints / totalCredits).toFixed(2)) : 0
    const cgpa = parseFloat((Math.max(6.0, sgpa - 0.2 + (i % 5) * 0.1)).toFixed(2))

    // Synthesize rawText as extracted by OCR
    let rawText = ''
    rawText += `EXAMINATION RESULTS / GRADE CARD\n`
    rawText += `${univ.label.toUpperCase()}\n`
    rawText += `B.TECH SEMESTER ${semNum} REGULAR EXAMINATIONS\n`
    rawText += `STUDENT ANONYMIZED_RECORD_${i.toString().padStart(3, '0')}   MONTH/YEAR: MAY 2025\n\n`
    rawText += `COURSE CODE | COURSE TITLE | CREDITS | GRADE | GRADE POINTS | RESULT\n`

    subjectsData.forEach((s, idx) => {
      let codeText = s.code
      let nameText = s.name
      let gradeText = s.grade
      let creditText = s.credits.toFixed(2)
      let pointsText = String(s.gradePoints)
      if (isDegraded) {
        // inject authentic OCR noise (smudged columns from real scans)
        if (idx === 1) { gradeText = 'als'; pointsText = '—' } // OCR reading 'als' without grade points
        if (idx === 2) codeText = codeText.replace('C', '(').replace('S', '5')
        if (idx === 3) { gradeText = '0'; pointsText = '?' }   // OCR misreading 'O' as digit '0'
        if (idx === 4) creditText = creditText.replace('.', ',') // Comma decimal artifact
      }

      rawText += `${idx + 1} | ${codeText} | ${nameText} | ${gradeText} | ${pointsText} | ${creditText} | ${s.result}\n`
    })

    rawText += `\nSEMESTER GRADE POINT AVERAGE (SGPA): ${sgpa.toFixed(2)}\n`
    rawText += `CUMULATIVE GRADE POINT AVERAGE (CGPA): ${cgpa.toFixed(2)}\n`
    rawText += `TOTAL CREDITS EARNED: ${totalCredits.toFixed(2)}\n`
    rawText += `CONTROLLER OF EXAMINATIONS\n`

    transcripts.push({
      id: `TR${i.toString().padStart(2, '0')}`,
      university: univ.name,
      universityLabel: univ.label,
      semesterNumber: semNum,
      isDegraded,
      rawText,
      groundTruth: subjectsData,
      summary: {
        totalCredits,
        sgpa,
        cgpa
      }
    })
  }

  return transcripts
}

const dataDir = path.join(__dirname, '../data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const transcripts = generate50Transcripts()
const filePath = path.join(dataDir, 'ground_truth_transcripts.json')
fs.writeFileSync(filePath, JSON.stringify(transcripts, null, 2), 'utf-8')
console.log(`✅ Generated ${transcripts.length} ground truth transcripts in ${filePath}`)
