const { calculatePrediction, sumCompletedCredits, countDataRichSemesters } = require('../../services/intelligence/engines/predictionEngine')
const { calculateSGPA, calculateCGPA } = require('../../utils/gpaUtils')

describe('SGPA/CGPA Utils & Prediction Engine', () => {
  describe('GPA Calculation Utilities (utils/gpaUtils)', () => {
    test('calculateSGPA accurately computes credit-weighted average', () => {
      const subjects = [
        { name: 'CS101', credits: 4, finalGrade: 9 }, // 36
        { name: 'CS102', credits: 3, finalGrade: 8 }, // 24
        { name: 'CS103', credits: 1, finalGrade: 10 } // 10
      ]
      // (36 + 24 + 10) / 8 = 70 / 8 = 8.75
      expect(calculateSGPA(subjects)).toBe(8.75)
    })

    test('calculateSGPA returns 0 when subjects array is empty or credits sum to 0', () => {
      expect(calculateSGPA([])).toBe(0)
      expect(calculateSGPA([{ name: 'No Credits', credits: 0, finalGrade: 8 }])).toBe(0)
    })

    test('calculateCGPA accurately computes cumulative grade points across all semesters', () => {
      const semesters = [
        {
          semesterNumber: 1,
          subjects: [
            { credits: 20, finalGrade: 8.0 } // 160
          ]
        },
        {
          semesterNumber: 2,
          subjects: [
            { credits: 20, finalGrade: 9.0 } // 180
          ]
        }
      ]
      // (160 + 180) / 40 = 340 / 40 = 8.50
      expect(calculateCGPA(semesters)).toBe(8.5)
    })
  })

  describe('Prediction Engine (services/intelligence/engines/predictionEngine)', () => {
    test('returns isAvailable: false when no data-rich semesters exist', () => {
      const result = calculatePrediction({ semesters: [] })
      expect(result.isAvailable).toBe(false)
      expect(result.predictedCGPA).toBeNull()
      expect(result.predictedNextSGPA).toBeNull()
      expect(result.trajectory).toBe('none')
    })

    test('predicts next SGPA for single semester record using current CGPA baseline', () => {
      const record = {
        semesters: [
          {
            semesterNumber: 1,
            sgpa: 8.4,
            subjects: [
              { credits: 20, finalGrade: 8.4 }
            ]
          }
        ]
      }
      const result = calculatePrediction(record, 160)
      expect(result.isAvailable).toBe(true)
      expect(result.currentCGPA).toBe(8.4)
      expect(result.predictedNextSGPA).toBe(8.4)
      expect(result.trajectory).toBe('single')
      expect(result.basedOnSemesters).toBe(1)
      expect(result.nextSemesterNumber).toBe(2)
      expect(result.remainingCredits).toBe(140)
    })

    test('applies velocity formula (0.6*CGPA + 0.4*recent) when 2 or more semesters are present', () => {
      const record = {
        semesters: [
          {
            semesterNumber: 1,
            sgpa: 8.0,
            subjects: [{ credits: 20, finalGrade: 8.0 }]
          },
          {
            semesterNumber: 2,
            sgpa: 9.0,
            subjects: [{ credits: 20, finalGrade: 9.0 }]
          }
        ]
      }
      // currentCGPA = (160 + 180) / 40 = 8.5
      // recent SGPA average of last 2 semesters = (8.0 + 9.0) / 2 = 8.5
      // velocity = 0.6 * 8.5 + 0.4 * 8.5 = 8.5
      const result = calculatePrediction(record, 160)
      expect(result.isAvailable).toBe(true)
      expect(result.currentCGPA).toBe(8.5)
      expect(result.predictedNextSGPA).toBe(8.5)
      expect(result.trajectory).toBe('improving') // 9.0 > 8.0 + 0.05
    })

    test('identifies declining trajectory when SGPA drops in latest semester', () => {
      const record = {
        semesters: [
          {
            semesterNumber: 1,
            sgpa: 9.2,
            subjects: [{ credits: 20, finalGrade: 9.2 }]
          },
          {
            semesterNumber: 2,
            sgpa: 7.5,
            subjects: [{ credits: 20, finalGrade: 7.5 }]
          }
        ]
      }
      const result = calculatePrediction(record, 160)
      expect(result.trajectory).toBe('declining')
    })

    test('identifies target achievability when target CGPA is specified', () => {
      const record = {
        targetCGPA: 9.0,
        semesters: [
          {
            semesterNumber: 1,
            sgpa: 8.0,
            subjects: [{ credits: 20, finalGrade: 8.0 }]
          }
        ]
      }
      // Target: 9.0 across 160 credits -> total points = 1440
      // Earned: 20 * 8.0 = 160. Remaining: 1440 - 160 = 1280 across 140 credits -> 1280 / 140 = 9.14 SGPA
      const result = calculatePrediction(record, 160)
      expect(result.targetCGPA).toBe(9.0)
      expect(result.isTargetAchievable).toBe(true) // 9.14 <= 10.0
      expect(result.requiredNextSGPA).toBe(9.14)
    })

    test('flags impossible target when required SGPA mathematically exceeds 10.0', () => {
      const record = {
        targetCGPA: 9.8,
        semesters: [
          {
            semesterNumber: 1,
            sgpa: 6.0,
            subjects: [{ credits: 80, finalGrade: 6.0 }]
          }
        ]
      }
      // 9.8 * 160 = 1568. Earned = 480. Remaining = 1088 / 80 = 13.6 (> 10.0)
      const result = calculatePrediction(record, 160)
      expect(result.isTargetAchievable).toBe(false)
      expect(result.requiredNextSGPA).toBe(13.6)
      expect(result.insight).toContain('exceeds mathematical max')
    })

    test('handles degree completion state where remaining credits is 0', () => {
      const record = {
        semesters: [
          {
            semesterNumber: 1,
            sgpa: 8.5,
            subjects: [{ credits: 160, finalGrade: 8.5 }]
          }
        ]
      }
      const result = calculatePrediction(record, 160)
      expect(result.remainingCredits).toBe(0)
      expect(result.confidenceLabel).toBe('High')
      expect(result.insight).toContain('Degree complete')
      expect(result.scenarioProjection.status).toBe('completed')
      expect(result.scenarioProjection.low).toBe(8.5)
      expect(result.scenarioProjection.expected).toBe(8.5)
      expect(result.scenarioProjection.high).toBe(8.5)
    })
  })

  describe('Task 2 - Graduation CGPA Scenario Projection & Edge Cases', () => {
    test('computes low / expected / high scenario range using student SGPA standard deviation for 2+ semesters', () => {
      const record = {
        semesters: [
          { semesterNumber: 1, sgpa: 8.0, subjects: [{ credits: 20, finalGrade: 8.0 }] },
          { semesterNumber: 2, sgpa: 9.0, subjects: [{ credits: 20, finalGrade: 9.0 }] }
        ]
      }
      const result = calculatePrediction(record, 160)
      expect(result.scenarioProjection).toBeDefined()
      expect(result.scenarioProjection.status).toBe('sufficient history')
      expect(result.scenarioProjection.hasHistory).toBe(true)
      expect(result.scenarioProjection.standardDeviation).toBeGreaterThan(0)
      expect(result.scenarioProjection.low).toBeLessThanOrEqual(result.scenarioProjection.expected)
      expect(result.scenarioProjection.expected).toBeLessThanOrEqual(result.scenarioProjection.high)
      expect(result.scenarioProjection.expected).toBe(result.predictedCGPA)
    })

    test('edge case 1: 1 semester history returns baseline only and flags "insufficient history"', () => {
      const record = {
        semesters: [
          { semesterNumber: 1, sgpa: 8.5, subjects: [{ credits: 20, finalGrade: 8.5 }] }
        ]
      }
      const result = calculatePrediction(record, 160)
      expect(result.scenarioProjection.status).toBe('insufficient history')
      expect(result.scenarioProjection.flag).toBe('insufficient history')
      expect(result.scenarioProjection.hasHistory).toBe(false)
      expect(result.scenarioProjection.standardDeviation).toBeNull()
      expect(result.scenarioProjection.low).toBe(result.predictedCGPA)
      expect(result.scenarioProjection.expected).toBe(result.predictedCGPA)
      expect(result.scenarioProjection.high).toBe(result.predictedCGPA)
    })

    test('edge case 2: 0 remaining credits returns baseline for all scenarios', () => {
      const record = {
        semesters: [
          { semesterNumber: 1, sgpa: 8.0, subjects: [{ credits: 80, finalGrade: 8.0 }] },
          { semesterNumber: 2, sgpa: 8.8, subjects: [{ credits: 80, finalGrade: 8.8 }] }
        ]
      }
      const result = calculatePrediction(record, 160)
      expect(result.remainingCredits).toBe(0)
      expect(result.scenarioProjection.status).toBe('completed')
      expect(result.scenarioProjection.low).toBe(result.currentCGPA)
      expect(result.scenarioProjection.expected).toBe(result.currentCGPA)
      expect(result.scenarioProjection.high).toBe(result.currentCGPA)
    })

    test('edge case 3: SGPA scenario values are strictly clamped at 10.0 max', () => {
      const record = {
        semesters: [
          { semesterNumber: 1, sgpa: 6.0, subjects: [{ credits: 20, finalGrade: 6.0 }] },
          { semesterNumber: 2, sgpa: 10.0, subjects: [{ credits: 20, finalGrade: 10.0 }] }
        ]
      }
      const result = calculatePrediction(record, 160)
      expect(result.scenarioProjection.sgpaNext.high).toBeLessThanOrEqual(10.0)
      expect(result.scenarioProjection.high).toBeLessThanOrEqual(10.0)
      expect(result.scenarioProjection.sgpaNext.low).toBeGreaterThanOrEqual(0.0)
      expect(result.scenarioProjection.low).toBeGreaterThanOrEqual(0.0)
    })
  })
})

