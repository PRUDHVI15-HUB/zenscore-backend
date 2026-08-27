const careerProfileService = require('./careerProfileService')
const careerCacheService = require('./careerCacheService')

/**
 * CareerIntelligenceService (Stage 3: Career Intelligence Engine)
 * Centralized orchestrator executing readiness scoring, skill gap analysis, dynamic roadmap ordering,
 * ATS evaluation, job matching, interview scoring, risk detection, and AI context building.
 */

// Skill mapping database by target career
const ROLE_SKILL_MATRIX = {
  'Backend Engineer': ['Node.js', 'Express.js', 'MongoDB', 'JavaScript (ES6+)', 'REST API Design', 'Docker', 'System Design', 'Redis Caching', 'Microservices', 'Kubernetes', 'CI/CD Pipelines', 'GraphQL', 'PostgreSQL'],
  'Data Scientist': ['Python', 'SQL', 'Statistics', 'Pandas & NumPy', 'Machine Learning', 'Data Visualization', 'Scikit-Learn', 'Deep Learning', 'PyTorch', 'Big Data / Spark'],
  'Full-Stack Developer': ['HTML5 & CSS3', 'JavaScript (ES6+)', 'React', 'Node.js', 'Express.js', 'MongoDB', 'Tailwind CSS', 'Redux', 'REST API', 'Docker', 'AWS'],
  'Frontend Developer': ['HTML5 & CSS3', 'JavaScript (ES6+)', 'React', 'TypeScript', 'Tailwind CSS', 'Redux / Zustand', 'Web Performance', 'Testing (Jest/Cypress)', 'Next.js'],
  'DevOps Engineer': ['Linux / Bash', 'Git', 'Docker', 'Kubernetes', 'AWS / GCP', 'CI/CD (GitHub Actions)', 'Terraform', 'Monitoring (Prometheus/Grafana)', 'Python / Go'],
  'Product Manager': ['Agile & Scrum', 'User Research', 'Product Analytics', 'Wireframing (Figma)', 'PRD Writing', 'A/B Testing', 'Roadmap Planning', 'Stakeholder Management']
}

class CareerIntelligenceService {
  /**
   * Main orchestrator: evaluates full intelligence suite and updates CareerProfile.
   */
  async evaluateCareerIntelligence(userId) {
    const profile = await careerProfileService.getOrCreateProfile(userId)
    const targetRole = profile.careerGoal.targetCareer || 'Backend Engineer'

    // 1. Run Sub-Engines in Parallel for High Performance
    const [readiness, skillGap, roadmap, resumeEval, jobMatching, interviewEval, risks] = await Promise.all([
      this.calculateReadinessEngine(profile),
      this.calculateSkillGapEngine(profile, targetRole),
      this.calculateRoadmapEngine(profile, targetRole),
      this.calculateATSEngine(profile),
      this.calculateJobRecommendationEngine(profile, targetRole),
      this.calculateInterviewEvaluationEngine(profile),
      this.calculateRiskEngine(profile)
    ])

    // 2. Generate Prioritized Recommendations
    const recommendations = this.generatePrioritizedRecommendations({
      readiness,
      skillGap,
      resumeEval,
      interviewEval,
      risks
    })

    // 3. Update CareerProfile with engine results
    profile.readinessEngine = {
      overallReadinessPct: readiness.overallReadiness,
      learningScore: readiness.componentScores.learning,
      resumeScore: readiness.componentScores.resume,
      interviewScore: readiness.componentScores.interview,
      academicScore: readiness.componentScores.academic,
      jobReadinessScore: readiness.componentScores.job,
      lastCalculated: new Date()
    }

    profile.skillsSummary.completedSkills = skillGap.completedSkills
    profile.skillsSummary.skillsInProgress = skillGap.missingSkills
    profile.skillsSummary.recommendedSkills = skillGap.prioritySkills
    profile.skillsSummary.skillCompletionPct = skillGap.completionPct
    profile.skillsSummary.latestUpdatedTime = new Date()

    profile.aiMetadata = {
      latestRecommendations: recommendations.map(r => r.action),
      latestCareerInsight: `Your placement readiness for ${targetRole} is ${readiness.overallReadiness}% (${readiness.readinessTier}). Focus on: ${skillGap.prioritySkills[0] || 'System Design'}.`,
      nextSuggestedAction: recommendations.length > 0 ? recommendations[0].action : 'Start AI Technical Mock Round.',
      riskFlags: risks.map(r => `${r.level}: ${r.issue}`),
      generatedTime: new Date()
    }

    await profile.save()

    // 4. Invalidate Cache
    careerCacheService.invalidateUser(userId)

    return {
      userId,
      targetRole,
      readiness,
      skillGap,
      roadmap,
      resumeEval,
      jobMatching,
      interviewEval,
      risks,
      recommendations,
      aiContext: this.buildAIContext(profile, { readiness, skillGap, recommendations, risks })
    }
  }

  /**
   * STEP 2: Career Readiness Engine (Deterministic Weight Distribution)
   * Weights: Academics (20%), Skills (25%), Learning (20%), Resume (15%), Interview (10%), Jobs (10%)
   */
  calculateReadinessEngine(profile) {
    const cgpa = profile.academicsSummary.currentCGPA || 8.2
    const academicScore = Math.min(100, Math.round((cgpa / 10) * 100))

    const skillsScore = profile.skillsSummary.skillCompletionPct || 60
    const learningScore = profile.learningProgress.learningProgressPct || 60
    const resumeScore = profile.resumeSummary.atsScore || 82
    const interviewScore = profile.interviewActivity.averageScore || 84

    const appliedCount = profile.jobActivity.appliedJobs ? profile.jobActivity.appliedJobs.length : 0
    const shortlistedCount = profile.jobActivity.shortlistedJobs || 0
    const jobScore = shortlistedCount > 0 ? 90 : appliedCount > 0 ? 75 : 60

    const overallReadiness = Math.round(
      academicScore * 0.20 +
      skillsScore * 0.25 +
      learningScore * 0.20 +
      resumeScore * 0.15 +
      interviewScore * 0.10 +
      jobScore * 0.10
    )

    const readinessTier = overallReadiness >= 85 ? 'Placement Ready' : overallReadiness >= 70 ? 'Industry Ready' : 'In Training'
    const confidenceScore = Math.min(99, Math.round(80 + (overallReadiness / 5)))

    const improvementAreas = []
    if (skillsScore < 75) improvementAreas.push('Complete core required skills')
    if (resumeScore < 85) improvementAreas.push('Optimize resume ATS score above 85%')
    if (interviewScore < 85) improvementAreas.push('Practice technical mock interview rounds')
    if (academicScore < 80) improvementAreas.push('Maintain CGPA above 8.0')

    return {
      overallReadiness,
      readinessTier,
      confidenceScore,
      componentScores: {
        academic: academicScore,
        skills: skillsScore,
        learning: learningScore,
        resume: resumeScore,
        interview: interviewScore,
        job: jobScore
      },
      improvementAreas
    }
  }

  /**
   * STEP 3: Skill Gap Engine
   */
  calculateSkillGapEngine(profile, targetRole) {
    const requiredList = ROLE_SKILL_MATRIX[targetRole] || ROLE_SKILL_MATRIX['Backend Engineer']
    const studentCompleted = profile.skillsSummary.completedSkills || []

    const completedSkills = requiredList.filter(s => studentCompleted.includes(s))
    const missingSkills = requiredList.filter(s => !studentCompleted.includes(s))
    const prioritySkills = missingSkills.slice(0, 3)
    const criticalSkills = missingSkills.slice(0, 2)

    const completionPct = Math.round((completedSkills.length / requiredList.length) * 100)
    const estimatedHoursRemaining = missingSkills.length * 12

    return {
      targetRole,
      totalRequired: requiredList.length,
      completedCount: completedSkills.length,
      completionPct,
      completedSkills,
      missingSkills,
      prioritySkills,
      criticalSkills,
      estimatedHoursRemaining,
      learningOrder: missingSkills
    }
  }

  /**
   * STEP 4: Roadmap Recommendation Engine
   */
  calculateRoadmapEngine(profile, targetRole) {
    const skillGap = this.calculateSkillGapEngine(profile, targetRole)
    const currentRoadmapName = profile.learningProgress.currentRoadmap || `${targetRole} Career Roadmap`

    const stages = [
      { name: 'Stage 1: Core Fundamentals', status: skillGap.completedCount >= 3 ? 'Completed' : 'In Progress' },
      { name: 'Stage 2: Applied Engineering & Frameworks', status: skillGap.completedCount >= 6 ? 'Completed' : 'In Progress' },
      { name: 'Stage 3: Advanced Architecture & System Design', status: skillGap.completedCount >= 9 ? 'In Progress' : 'Locked' },
      { name: 'Stage 4: Placement Readiness & Mock Projects', status: skillGap.completionPct >= 80 ? 'Available' : 'Locked' }
    ]

    return {
      currentRoadmapName,
      currentStage: profile.learningProgress.currentStage,
      completedMilestones: profile.learningProgress.completedMilestones,
      remainingMilestones: profile.learningProgress.remainingMilestones,
      progressPct: profile.learningProgress.learningProgressPct,
      stages,
      nextAction: skillGap.prioritySkills[0] ? `Start learning module: ${skillGap.prioritySkills[0]}` : 'Build capstone project'
    }
  }

  /**
   * STEP 5: Resume Intelligence Engine
   */
  calculateATSEngine(profile) {
    const score = profile.resumeSummary.atsScore || 82
    const status = profile.resumeSummary.resumeStatus || 'ATS Verified'

    const strengths = [
      'Clean single-column standard formatting',
      'Strong technical skill section alignment',
      'Clear project impact descriptions'
    ]

    const weaknesses = []
    if (score < 85) weaknesses.push('Missing high-frequency ATS keywords for microservices and cloud deployment')
    if (score < 80) weaknesses.push('Project descriptions lack quantified numerical metrics (% improvement, latency reduction)')

    const keywordRecommendations = ['Docker', 'Kubernetes', 'Redis', 'CI/CD', 'RESTful APIs', 'Unit Testing']

    return {
      uploaded: profile.resumeSummary.resumeUploaded,
      atsScore: score,
      version: profile.resumeSummary.resumeVersion,
      status,
      strengths,
      weaknesses,
      keywordRecommendations,
      improvementSuggestions: [
        'Include numerical metrics in project bullet points (e.g. "Reduced API latency by 35%")',
        'Align summary paragraph with target job description keywords'
      ]
    }
  }

  /**
   * STEP 6: Job Recommendation Engine
   */
  calculateJobRecommendationEngine(profile, targetRole) {
    const completedSkills = profile.skillsSummary.completedSkills || []
    const atsScore = profile.resumeSummary.atsScore || 82

    const baseMatch = Math.min(96, Math.round(70 + (completedSkills.length * 2) + (atsScore * 0.1)))

    return {
      targetRole,
      overallMatchScore: baseMatch,
      matchedJobCount: profile.jobActivity.recommendedJobsCount || 245,
      applicationPriority: baseMatch >= 85 ? 'High (Apply Now)' : 'Medium (Complete 1 More Skill)',
      recommendedCompanies: ['Google', 'Amazon', 'Microsoft', 'Flipkart', 'Swiggy', 'Razorpay'],
      missingSkillsForJobs: profile.skillsSummary.recommendedSkills.slice(0, 2)
    }
  }

  /**
   * STEP 7: Interview Evaluation Engine
   */
  calculateInterviewEvaluationEngine(profile) {
    const historyCount = profile.interviewActivity.mockInterviews || 12
    const avgScore = profile.interviewActivity.averageScore || 84
    const techScore = profile.interviewActivity.technicalScore || 86
    const hrScore = profile.interviewActivity.hrScore || 88
    const commScore = profile.interviewActivity.communicationScore || 82

    return {
      readinessPct: profile.interviewActivity.interviewReadiness || avgScore,
      mockInterviewsCompleted: historyCount,
      averageScore: avgScore,
      scoresBreakdown: {
        technical: techScore,
        hr: hrScore,
        communication: commScore
      },
      strongAreas: ['REST API Architecture', 'HR Behavioral STAR responses', 'Code Clarity'],
      weakAreas: ['Database Indexing & Sharding', 'System Design Scale Trade-offs'],
      nextInterviewDifficulty: avgScore >= 85 ? 'Hard' : avgScore >= 70 ? 'Medium' : 'Easy',
      recommendedPractice: 'Mock Interview on System Design & Microservices'
    }
  }

  /**
   * STEP 8: Prioritized Recommendation Engine
   */
  generatePrioritizedRecommendations({ readiness, skillGap, resumeEval, interviewEval, risks }) {
    const recommendations = []

    // High Priority
    if (risks.some(r => r.level === 'HIGH')) {
      const highRisk = risks.find(r => r.level === 'HIGH')
      recommendations.push({ priority: 'HIGH', category: 'Risk Mitigation', action: highRisk.suggestedAction })
    }

    if (skillGap.prioritySkills.length > 0) {
      recommendations.push({ priority: 'HIGH', category: 'Skill Upgrading', action: `Master ${skillGap.prioritySkills[0]} to boost readiness by +8%` })
    }

    // Medium Priority
    if (resumeEval.atsScore < 85) {
      recommendations.push({ priority: 'MEDIUM', category: 'Resume Optimization', action: 'Update resume with missing ATS keywords (Docker, Redis)' })
    }

    if (interviewEval.averageScore < 85) {
      recommendations.push({ priority: 'MEDIUM', category: 'Interview Practice', action: `Complete a Mock Technical Round on ${interviewEval.weakAreas[0] || 'System Design'}` })
    }

    // Low Priority
    recommendations.push({ priority: 'LOW', category: 'Job Discovery', action: 'Review top 5 matched jobs for Amazon & Google and bookmark target roles' })

    return recommendations
  }

  /**
   * STEP 9: Career Risk Engine
   */
  calculateRiskEngine(profile) {
    const risks = []

    if (!profile.resumeSummary.resumeUploaded) {
      risks.push({ level: 'HIGH', issue: 'Resume not uploaded', suggestedAction: 'Upload target resume in Resume Center' })
    } else if (profile.resumeSummary.atsScore < 70) {
      risks.push({ level: 'HIGH', issue: 'ATS Score below 70%', suggestedAction: 'Run Resume ATS Scanner to resolve keyword gaps' })
    }

    if (profile.interviewActivity.averageScore < 60) {
      risks.push({ level: 'HIGH', issue: 'Interview score below 60%', suggestedAction: 'Complete 2 guided mock interview practice sessions' })
    }

    if (profile.academicsSummary.currentCGPA < 7.0) {
      risks.push({ level: 'MEDIUM', issue: 'CGPA below 7.0 placement criteria', suggestedAction: 'Focus on upcoming academic subject assessments' })
    }

    if (!profile.jobActivity.appliedJobs || profile.jobActivity.appliedJobs.length === 0) {
      risks.push({ level: 'LOW', issue: 'No job applications submitted yet', suggestedAction: 'Explore recommended jobs and submit your first application' })
    }

    return risks
  }

  /**
   * STEP 10: AI Context Builder
   */
  buildAIContext(profile, intelligenceData = {}) {
    return {
      userId: profile.user,
      targetRole: profile.careerGoal.targetCareer,
      careerStatus: profile.careerGoal.status,
      experienceLevel: profile.careerGoal.experienceLevel,
      overallReadinessPct: intelligenceData.readiness ? intelligenceData.readiness.overallReadiness : profile.readinessEngine.overallReadinessPct,
      currentCGPA: profile.academicsSummary.currentCGPA,
      completedSkills: profile.skillsSummary.completedSkills,
      missingSkills: intelligenceData.skillGap ? intelligenceData.skillGap.missingSkills : profile.skillsSummary.skillsInProgress,
      atsScore: profile.resumeSummary.atsScore,
      interviewAverageScore: profile.interviewActivity.averageScore,
      shortlistedJobsCount: profile.jobActivity.shortlistedJobs,
      appliedJobsCount: profile.jobActivity.appliedJobs ? profile.jobActivity.appliedJobs.length : 0,
      activeRisks: intelligenceData.risks ? intelligenceData.risks.map(r => r.issue) : profile.aiMetadata.riskFlags,
      topRecommendations: intelligenceData.recommendations ? intelligenceData.recommendations.map(r => r.action) : profile.aiMetadata.latestRecommendations
    }
  }
}

module.exports = new CareerIntelligenceService()
