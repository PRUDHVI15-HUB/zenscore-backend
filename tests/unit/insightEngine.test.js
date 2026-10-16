const { generateInsights } = require('../../services/intelligence/engines/insightEngine')

describe('Academic Insight Engine (generateInsights) - Unit Tests', () => {
  test('returns default zero state when record or semesters is empty', () => {
    const emptyResult = generateInsights(null)
    expect(emptyResult.strongestSubject).toBeNull()
    expect(emptyResult.weakestSubject).toBeNull()
    expect(emptyResult.creditsCompleted).toBe(0)
    expect(emptyResult.creditsRemaining).toBe(160)
    expect(emptyResult.improvementTrend.direction).toBe('STABLE')
  })

  test('correctly identifies strongest and weakest subject by grade and credit tiebreaker', () => {
    const record = {
      semesters: [
        {
          semesterNumber: 1,
          sgpa: 8.0,
          subjects: [
            { id: 'sub-1', name: 'Math I', credits: 4, finalGrade: 7.0, attendance: 90 },
            { id: 'sub-2', name: 'Physics', credits: 4, finalGrade: 9.5, attendance: 95 },
            { id: 'sub-3', name: 'Basic EE', credits: 3, finalGrade: 5.5, attendance: 70 }
          ]
        }
      ]
    }

    const insights = generateInsights(record)
    expect(insights.strongestSubject.name).toBe('Physics')
    expect(insights.strongestSubject.finalGrade).toBe(9.5)
    expect(insights.weakestSubject.name).toBe('Basic EE')
    expect(insights.weakestSubject.finalGrade).toBe(5.5)
    expect(insights.creditsCompleted).toBe(11)
    expect(insights.creditsRemaining).toBe(149)
    expect(insights.dataQuality.totalSubjects).toBe(3)
    expect(insights.dataQuality.missingGradesCount).toBe(0)
  })

  test('detects positive improvement trend between consecutive semesters', () => {
    const record = {
      semesters: [
        {
          semesterNumber: 1,
          sgpa: 7.2,
          subjects: [{ name: 'Sub A', credits: 20, finalGrade: 7.2, attendance: 85 }]
        },
        {
          semesterNumber: 2,
          sgpa: 8.8,
          subjects: [{ name: 'Sub B', credits: 20, finalGrade: 8.8, attendance: 90 }]
        }
      ]
    }

    const insights = generateInsights(record)
    expect(insights.bestSemester.semester).toBe(2)
    expect(insights.worstSemester.semester).toBe(1)
    expect(insights.improvementTrend.direction).toBe('UP')
    expect(insights.improvementTrend.delta).toBe(1.6)
  })

  test('detects downward trend when performance declines in later semesters', () => {
    const record = {
      semesters: [
        {
          semesterNumber: 1,
          sgpa: 8.5,
          subjects: [{ name: 'Sub A', credits: 20, finalGrade: 8.5, attendance: 90 }]
        },
        {
          semesterNumber: 2,
          sgpa: 6.5,
          subjects: [{ name: 'Sub B', credits: 20, finalGrade: 6.5, attendance: 75 }]
        }
      ]
    }

    const insights = generateInsights(record)
    expect(insights.bestSemester.semester).toBe(1)
    expect(insights.worstSemester.semester).toBe(2)
    expect(insights.improvementTrend.direction).toBe('DOWN')
    expect(insights.improvementTrend.delta).toBe(-2.0)
  })
})
