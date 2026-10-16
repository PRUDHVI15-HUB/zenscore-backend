const { calculateRisk } = require('../../services/intelligence/engines/riskEngine')

describe('Risk Engine (calculateRisk) - Unit & Edge Case Tests', () => {
  test('returns empty array when given empty subjects array or undefined', () => {
    expect(calculateRisk([])).toEqual([])
    expect(calculateRisk()).toEqual([])
  })

  describe('Attendance Risk Edge Cases (40% weight)', () => {
    test('attendance exactly 75% triggers attendance risk = 100 with reason', () => {
      // At 75%: attendance < 75 is false, falls into ((85 - 75) / 10) * 100 = 100
      const result = calculateRisk([
        { id: 'sub-75', name: 'Software Eng', attendance: 75, finalGrade: 9.0, credits: 3 }
      ])
      expect(result[0].score).toBe(40 * 1.0 + 40 * 0 + 20 * 0.5) // 40 + 0 + 10 = 50
      expect(result[0].level).toBe('MEDIUM')
      expect(result[0].reasons).toContain('Attendance below 85%')
    })

    test('attendance exactly 85% yields 0 attendance risk and no attendance penalty', () => {
      // At 85%: attendance < 85 is false, so attendanceRisk = 0
      const result = calculateRisk([
        { id: 'sub-85', name: 'Database Systems', attendance: 85, finalGrade: 9.0, credits: 3 }
      ])
      expect(result[0].score).toBe(0 + 0 + 10) // 10
      expect(result[0].level).toBe('LOW')
      expect(result[0].reasons).toHaveLength(0)
    })

    test('attendance strictly below 75% triggers full 100% attendance risk', () => {
      const result = calculateRisk([
        { id: 'sub-74', name: 'Operating Systems', attendance: 74.9, finalGrade: 9.0, credits: 3 }
      ])
      expect(result[0].reasons).toContain('Attendance below 75%')
      expect(result[0].score).toBe(50)
    })

    test('attendance scaled between 75% and 85% (e.g. 80%) yields scaled risk', () => {
      // ((85 - 80) / 10) * 100 = 50% attendance risk -> 0.40 * 50 = 20 pts
      const result = calculateRisk([
        { id: 'sub-80', name: 'Computer Networks', attendance: 80, finalGrade: 9.0, credits: 3 }
      ])
      // rawScore: 0.4*50 + 0 + 0.2*50 = 20 + 10 = 30
      expect(result[0].score).toBe(30)
      expect(result[0].level).toBe('LOW')
    })

    test('defaults to 100% attendance when attendance field is omitted or null', () => {
      const result = calculateRisk([
        { id: 'sub-null-att', name: 'AI Ethics', attendance: null, finalGrade: 9.0, credits: 3 }
      ])
      expect(result[0].score).toBe(10) // Only credit risk: 0.2 * 50 = 10
      expect(result[0].level).toBe('LOW')
    })
  })

  describe('Credits Risk Edge Cases (20% weight)', () => {
    test('credits 0 evaluates using fallback or zero bounds', () => {
      // In JS: sub.credits || 3 fallback to 3 when 0
      const result = calculateRisk([
        { id: 'sub-cred-0', name: 'Audit Course', attendance: 90, finalGrade: 9.0, credits: 0 }
      ])
      expect(result[0].score).toBe(10) // (3/6)*100 = 50% -> 0.2*50 = 10
    })

    test('credits exactly 6 yields maximum credit risk (100% -> 20 pts)', () => {
      const result = calculateRisk([
        { id: 'sub-cred-6', name: 'Major Capstone Project', attendance: 90, finalGrade: 9.0, credits: 6 }
      ])
      // (6 / 6) * 100 = 100% -> 0.20 * 100 = 20 pts
      expect(result[0].score).toBe(20)
      expect(result[0].level).toBe('LOW')
    })

    test('credits 3 (standard course) yields 50% credit risk (10 pts)', () => {
      const result = calculateRisk([
        { id: 'sub-cred-3', name: 'Discrete Math', attendance: 90, finalGrade: 9.0, credits: 3 }
      ])
      expect(result[0].score).toBe(10)
    })
  })

  describe('Grade Risk Edge Cases (40% weight)', () => {
    test('grade below 6.0 triggers full 100% grade risk', () => {
      const result = calculateRisk([
        { id: 'sub-g5', name: 'Compiler Design', attendance: 90, finalGrade: 5.5, credits: 3 }
      ])
      // Grade risk: 100 -> 0.40 * 100 = 40 pts. Total: 40 + 10 = 50 pts
      expect(result[0].score).toBe(50)
      expect(result[0].reasons).toContain('Grade below 6')
    })

    test('grade exactly 6.0 falls into scaled grade range', () => {
      // ((8.5 - 6.0) / 2.5) * 100 = 100%
      const result = calculateRisk([
        { id: 'sub-g6', name: 'Algorithms', attendance: 90, finalGrade: 6.0, credits: 3 }
      ])
      expect(result[0].score).toBe(50)
      expect(result[0].reasons).toContain('Grade below 8.5')
    })

    test('grade >= 8.5 yields 0 grade risk', () => {
      const result = calculateRisk([
        { id: 'sub-g85', name: 'Cloud Computing', attendance: 90, finalGrade: 8.5, credits: 3 }
      ])
      expect(result[0].score).toBe(10)
      expect(result[0].reasons).not.toContain('Grade below 8.5')
    })
  })

  describe('Overall Risk Classification & Severity Thresholds', () => {
    test('HIGH risk (score >= 70) maps to red color and HIGH level', () => {
      // low attendance (< 75: 40 pts) + low grade (< 6: 40 pts) + credits 6 (20 pts) = 100 pts
      const result = calculateRisk([
        { id: 'sub-high', name: 'Data Structures', attendance: 65, finalGrade: 4.0, credits: 6 }
      ])
      expect(result[0].score).toBe(100)
      expect(result[0].level).toBe('HIGH')
      expect(result[0].color).toBe('red')
      expect(result[0].reasons).toEqual(expect.arrayContaining(['Attendance below 75%', 'Grade below 6']))
    })

    test('MEDIUM risk (35 <= score < 70) maps to yellow color and MEDIUM level', () => {
      const result = calculateRisk([
        { id: 'sub-med', name: 'Digital Logic', attendance: 75, finalGrade: 7.0, credits: 3 }
      ])
      // att: 100 -> 40 pts. grade: ((8.5 - 7.0)/2.5)*100 = 60 -> 24 pts. cred: 10 pts. Total = 74
      // Let's create an exact 50 score
      const res50 = calculateRisk([
        { id: 'sub-med50', name: 'Theory of Computation', attendance: 85, finalGrade: 6.0, credits: 3 }
      ])
      // att: 0. grade: 100 -> 40 pts. cred: 10 pts. Total = 50 pts
      expect(res50[0].score).toBe(50)
      expect(res50[0].level).toBe('MEDIUM')
      expect(res50[0].color).toBe('yellow')
    })

    test('LOW risk (score < 35) maps to green color and LOW level', () => {
      const result = calculateRisk([
        { id: 'sub-low', name: 'Web Dev', attendance: 92, finalGrade: 9.5, credits: 3 }
      ])
      expect(result[0].score).toBe(10)
      expect(result[0].level).toBe('LOW')
      expect(result[0].color).toBe('green')
    })
  })

  describe('Task 1 - Bounded Risk Component Exact Values & Grid Property Tests', () => {
    const { computeAttendanceRisk, computeGradeRisk, computeCreditRisk } = require('../../services/intelligence/engines/riskEngine')

    test('g = 6.0 gives Rg = 100', () => {
      expect(computeGradeRisk(6.0)).toBe(100)
    })

    test('g = 8.5 gives Rg = 0', () => {
      expect(computeGradeRisk(8.5)).toBe(0)
    })

    test('credits = 9 gives Rc = 100 (bounded at 100 max)', () => {
      expect(computeCreditRisk(9)).toBe(100)
    })

    test('a = 75 gives Ra = 100', () => {
      expect(computeAttendanceRisk(75)).toBe(100)
    })

    test('a = 85 gives Ra = 0', () => {
      expect(computeAttendanceRisk(85)).toBe(0)
    })

    test('property test over a comprehensive grid of inputs: asserts 0 <= Risk <= 100', () => {
      const attendanceGrid = [-20, 0, 50, 74.9, 75, 80, 85, 85.1, 95, 100, 120]
      const gradeGrid = [-1, 0, 3.5, 5.9, 6.0, 7.25, 8.5, 8.51, 9.5, 10.0, 15.0]
      const creditsGrid = [-2, 0, 1, 2, 3, 4, 5, 6, 9, 12, 16]

      let combinationsTested = 0
      for (const a of attendanceGrid) {
        for (const g of gradeGrid) {
          for (const c of creditsGrid) {
            const res = calculateRisk([{
              id: `grid-${a}-${g}-${c}`,
              name: 'Grid Subject',
              attendance: a,
              finalGrade: g,
              credits: c
            }])
            expect(res).toHaveLength(1)
            const score = res[0].score
            expect(score).toBeGreaterThanOrEqual(0)
            expect(score).toBeLessThanOrEqual(100)
            expect(['LOW', 'MEDIUM', 'HIGH']).toContain(res[0].level)
            combinationsTested++
          }
        }
      }
      expect(combinationsTested).toBe(attendanceGrid.length * gradeGrid.length * creditsGrid.length)
    })
  })
})

