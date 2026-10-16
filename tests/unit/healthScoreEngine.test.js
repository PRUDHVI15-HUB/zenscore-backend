const { calculateHealthScore } = require('../../services/intelligence/engines/healthScoreEngine')

describe('Academic Health Score Engine (calculateHealthScore)', () => {
  test('returns default zero state when record or semesters is empty', () => {
    const result = calculateHealthScore(null)
    expect(result.score).toBe(0)
    expect(result.status).toBe('NEEDS IMPROVEMENT')
    expect(result.color).toBe('red')
    expect(result.trend.direction).toBe('STABLE')
  })

  test('calculates accurate health score and breakdown for single semester', () => {
    const record = {
      currentCGPA: 8.5,
      semesters: [
        {
          semesterNumber: 1,
          sgpa: 8.5,
          subjects: [
            { id: 's1', name: 'Math', credits: 4, finalGrade: 8.5, attendance: 90 },
            { id: 's2', name: 'Physics', credits: 3, finalGrade: 8.5, attendance: 80 }
          ]
        }
      ]
    }
    const riskScores = [
      { subjectId: 's1', subject: 'Math', score: 10 },
      { subjectId: 's2', subject: 'Physics', score: 30 }
    ]

    const result = calculateHealthScore(record, riskScores)

    // Mean attendance: (90 + 80) / 2 = 85
    // Mean grade: 8.5 -> (8.5 / 10) * 100 = 85
    // CGPA score: (8.5 / 10) * 100 = 85
    // Mean risk: (10 + 30) / 2 = 20 -> risk score = 100 - 20 = 80
    // rawHealth: 0.3*85 + 0.3*85 + 0.25*85 + 0.15*80 = 25.5 + 25.5 + 21.25 + 12 = 84.25
    expect(result.score).toBe(84.25)
    expect(result.breakdown.attendance).toBe(85)
    expect(result.breakdown.grades).toBe(85)
    expect(result.breakdown.cgpa).toBe(85)
    expect(result.breakdown.risk).toBe(80)
    expect(result.status).toBe('GOOD') // 75 <= 84.25 < 90
    expect(result.trend.direction).toBe('STABLE')
  })

  test('detects positive upward trend when academic health improves across semesters', () => {
    const record = {
      currentCGPA: 8.8,
      semesters: [
        {
          semesterNumber: 1,
          sgpa: 7.0,
          subjects: [
            { id: 's1', name: 'Subject 1', credits: 3, finalGrade: 7.0, attendance: 75 }
          ]
        },
        {
          semesterNumber: 2,
          sgpa: 9.5,
          subjects: [
            { id: 's2', name: 'Subject 2', credits: 3, finalGrade: 9.5, attendance: 95 }
          ]
        }
      ]
    }
    const result = calculateHealthScore(record, [])
    expect(result.trend.direction).toBe('UP')
    expect(result.trend.delta).toBeGreaterThan(0)
  })

  test('detects downward trend when academic health drops in later semester', () => {
    const record = {
      currentCGPA: 7.2,
      semesters: [
        {
          semesterNumber: 1,
          sgpa: 9.0,
          subjects: [
            { id: 's1', name: 'Subject 1', credits: 4, finalGrade: 9.0, attendance: 95 }
          ]
        },
        {
          semesterNumber: 2,
          sgpa: 5.5,
          subjects: [
            { id: 's2', name: 'Subject 2', credits: 4, finalGrade: 5.5, attendance: 65 }
          ]
        }
      ]
    }
    const result = calculateHealthScore(record, [])
    expect(result.trend.direction).toBe('DOWN')
    expect(result.trend.delta).toBeLessThan(0)
  })

  test('categorizes >= 90 as EXCELLENT', () => {
    const record = {
      currentCGPA: 9.6,
      semesters: [
        {
          semesterNumber: 1,
          sgpa: 9.6,
          subjects: [
            { id: 's1', name: 'Algo', credits: 4, finalGrade: 9.6, attendance: 96 }
          ]
        }
      ]
    }
    const result = calculateHealthScore(record, [{ subjectId: 's1', score: 0 }])
    expect(result.score).toBeGreaterThanOrEqual(90)
    expect(result.status).toBe('EXCELLENT')
  })
})
