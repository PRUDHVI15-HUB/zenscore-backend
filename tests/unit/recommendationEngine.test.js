const { generateRecommendations } = require('../../services/intelligence/engines/recommendationEngine')

describe('Academic Recommendation Engine (generateRecommendations) - Unit Tests', () => {
  test('returns empty array when given empty record or no semesters', () => {
    expect(generateRecommendations(null)).toEqual([])
    expect(generateRecommendations({ semesters: [] })).toEqual([])
  })

  test('generates critical attendance recommendation when subject attendance is below 80%', () => {
    const record = {
      semesters: [
        {
          semesterNumber: 1,
          sgpa: 8.0,
          subjects: [
            { id: 'sub-att-low', name: 'Operating Systems', credits: 4, finalGrade: 8.5, attendance: 68 }
          ]
        }
      ]
    }

    const recs = generateRecommendations(record)
    expect(recs.length).toBeGreaterThan(0)
    const attRec = recs.find(r => r.category === 'ATTENDANCE' && r.subject === 'Operating Systems')
    expect(attRec).toBeDefined()
    expect(attRec.priority).toBe('HIGH')
    expect(attRec.title).toBe('Attendance Critical')
  })

  test('generates HIGH priority performance risk recommendation when risk score exceeds 70', () => {
    // Low grade (< 6.0: 40 pts) + Low attendance (< 75: 40 pts) + 3 credits (10 pts) = 90 pts (>= 70)
    const record = {
      semesters: [
        {
          semesterNumber: 2,
          sgpa: 5.5,
          subjects: [
            { id: 'sub-high-risk', name: 'Theory of Computation', credits: 3, finalGrade: 5.0, attendance: 70 }
          ]
        }
      ]
    }

    const recs = generateRecommendations(record)
    const perfRec = recs.find(r => r.category === 'PERFORMANCE' && r.subject === 'Theory of Computation')
    expect(perfRec).toBeDefined()
    expect(perfRec.priority).toBe('HIGH')
    expect(perfRec.title).toBe('Performance Risk')
  })

  test('generates ACADEMIC category recommendation for heavy credit subjects with grade < 8.0', () => {
    const record = {
      semesters: [
        {
          semesterNumber: 3,
          sgpa: 7.5,
          subjects: [
            { id: 'sub-heavy', name: 'Algorithms', credits: 4, finalGrade: 7.5, attendance: 90 }
          ]
        }
      ]
    }

    const recs = generateRecommendations(record)
    const acadRec = recs.find(r => r.category === 'ACADEMIC' && r.subject === 'Algorithms')
    expect(acadRec).toBeDefined()
    expect(acadRec.priority).toBe('MEDIUM')
    expect(acadRec.title).toBe('Heavy Credit Target')
  })

  test('sorts recommendations in strict order of priority: HIGH -> MEDIUM -> LOW', () => {
    const record = {
      semesters: [
        {
          semesterNumber: 1,
          sgpa: 7.0,
          subjects: [
            { id: 's1', name: 'Subject High Risk', credits: 4, finalGrade: 4.5, attendance: 70 }, // HIGH
            { id: 's2', name: 'Subject Medium Credit', credits: 4, finalGrade: 7.2, attendance: 90 }, // MEDIUM
            { id: 's3', name: 'Subject Low Grade', credits: 3, finalGrade: 6.8, attendance: 90 }  // LOW
          ]
        }
      ]
    }

    const recs = generateRecommendations(record)
    const priorityWeights = { HIGH: 3, MEDIUM: 2, LOW: 1 }
    for (let i = 0; i < recs.length - 1; i++) {
      expect(priorityWeights[recs[i].priority]).toBeGreaterThanOrEqual(priorityWeights[recs[i + 1].priority])
    }
  })
})
