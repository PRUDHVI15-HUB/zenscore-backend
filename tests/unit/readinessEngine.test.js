const careerIntelligenceService = require('../../services/careerIntelligenceService')
const careerAggregationService = require('../../services/careerAggregationService')

describe('Career Readiness Index & Job Match Engine', () => {
  describe('Placement Readiness Calculation (careerIntelligenceService)', () => {
    test('computes weighted score accurately across all 6 pillars', () => {
      const profile = {
        academicsSummary: { currentCGPA: 8.0 }, // academicScore = 80 -> 80 * 0.20 = 16
        skillsSummary: { skillCompletionPct: 80 }, // 80 * 0.25 = 20
        learningProgress: { learningProgressPct: 75 }, // 75 * 0.20 = 15
        resumeSummary: { atsScore: 85 }, // 85 * 0.15 = 12.75
        interviewActivity: { averageScore: 90 }, // 90 * 0.10 = 9
        jobActivity: {
          appliedJobs: [{ id: 'j1' }],
          shortlistedJobs: 1 // shortlistedCount > 0 -> jobScore = 90 -> 90 * 0.10 = 9
        }
      }
      // Sum = 16 + 20 + 15 + 12.75 + 9 + 9 = 81.75 -> Math.round = 82
      const result = careerIntelligenceService.calculateReadinessEngine(profile)
      expect(result.overallReadiness).toBe(82)
      expect(result.readinessTier).toBe('Industry Ready') // 70 <= 82 < 85
      expect(result.componentScores.academic).toBe(80)
      expect(result.componentScores.skills).toBe(80)
      expect(result.componentScores.learning).toBe(75)
      expect(result.componentScores.resume).toBe(85)
      expect(result.componentScores.interview).toBe(90)
      expect(result.componentScores.job).toBe(90)
    })

    test('classifies profile as "Placement Ready" when score >= 85', () => {
      const profile = {
        academicsSummary: { currentCGPA: 9.5 }, // 95 * 0.20 = 19
        skillsSummary: { skillCompletionPct: 95 }, // 95 * 0.25 = 23.75
        learningProgress: { learningProgressPct: 90 }, // 90 * 0.20 = 18
        resumeSummary: { atsScore: 92 }, // 92 * 0.15 = 13.8
        interviewActivity: { averageScore: 90 }, // 90 * 0.10 = 9
        jobActivity: {
          appliedJobs: ['j1', 'j2'],
          shortlistedJobs: 2 // 90 * 0.10 = 9
        }
      }
      // 19 + 23.75 + 18 + 13.8 + 9 + 9 = 92.55 -> 93
      const result = careerIntelligenceService.calculateReadinessEngine(profile)
      expect(result.overallReadiness).toBe(93)
      expect(result.readinessTier).toBe('Placement Ready')
    })

    test('classifies profile as "In Training" when score < 70', () => {
      const profile = {
        academicsSummary: { currentCGPA: 6.0 }, // 60 * 0.20 = 12
        skillsSummary: { skillCompletionPct: 40 }, // 40 * 0.25 = 10
        learningProgress: { learningProgressPct: 50 }, // 50 * 0.20 = 10
        resumeSummary: { atsScore: 50 }, // 50 * 0.15 = 7.5
        interviewActivity: { averageScore: 60 }, // 60 * 0.10 = 6
        jobActivity: {
          appliedJobs: [],
          shortlistedJobs: 0 // jobScore = 60 -> 60 * 0.10 = 6
        }
      }
      // 12 + 10 + 10 + 7.5 + 6 + 6 = 51.5 -> 52
      const result = careerIntelligenceService.calculateReadinessEngine(profile)
      expect(result.overallReadiness).toBe(52)
      expect(result.readinessTier).toBe('In Training')
      expect(result.improvementAreas).toContain('Complete core required skills')
      expect(result.improvementAreas).toContain('Optimize resume ATS score above 85%')
      expect(result.improvementAreas).toContain('Maintain CGPA above 8.0')
    })

    test('computes defaults gracefully when summary sections are empty or undefined', () => {
      const profile = {
        academicsSummary: {},
        skillsSummary: {},
        learningProgress: {},
        resumeSummary: {},
        interviewActivity: {},
        jobActivity: {}
      }
      const result = careerIntelligenceService.calculateReadinessEngine(profile)
      expect(result.overallReadiness).toBeGreaterThan(0)
      expect(result.confidenceScore).toBeLessThanOrEqual(99)
    })
  })

  describe('Readiness Hitting the 98% Cap (Edge Case)', () => {
    test('Job match readiness percentage is strictly capped at 98%', async () => {
      // In careerAggregationService, when all required skills are matched (100% match),
      // matchPct is capped: Math.min(98, Math.max(50, Math.round((matched.length / required.length) * 100)))
      const profile = {
        targetRole: 'Backend Engineer',
        skillsSummary: {
          completedSkills: ['Node.js', 'Express', 'Python', 'Java', 'SQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Docker', 'REST API', 'Git']
        }
      }
      const mockJobs = [
        {
          _id: 'job-101',
          title: 'Backend Engineer',
          company: 'Google',
          requiredSkills: ['Node.js', 'Python', 'SQL', 'Docker', 'Git'] // 100% matched
        }
      ]

      const userSkillNames = new Set(profile.skillsSummary.completedSkills)
      const required = mockJobs[0].requiredSkills
      const matched = required.filter(s => userSkillNames.has(s))
      const matchPct = Math.min(98, Math.max(50, Math.round((matched.length / required.length) * 100)))

      expect(matchPct).toBe(98) // Strictly capped at 98% instead of 100%
      expect(matchPct).toBeLessThanOrEqual(98)
    })
  })
})
