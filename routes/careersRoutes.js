const express = require('express')
const router = express.Router()

const { protect, optionalAuth } = require('../middleware/authMiddleware')

// Career Profile Management Controllers
const {
  getCareerProfile,
  createCareerProfile,
  updateCareerProfile,
  completeOnboarding,
  syncCareerProfile,
  refreshReadiness
} = require('../controllers/careerProfileController')

// Unified Aggregation Controllers
const {
  getDashboard,
  getLearningHub,
  getResumeCenter,
  getOpportunities,
  getInterviewCenter,
  getCopilotContext,
  syncModule
} = require('../controllers/careerAggregationController')

// Intelligence Engine Controllers
const {
  getCareerIntelligence,
  recalculateCareerIntelligence
} = require('../controllers/careerIntelligenceController')

// Legacy / Compatibility Controllers
const {
  getCareerPaths,
  getRoles,
  getSkillGap
} = require('../controllers/careersController')

// Career AI Controllers
const careersAIController = require('../controllers/careersAIController')

// ── 1. PRIMARY PROFILE MANAGEMENT ──
router.get('/profile', protect, getCareerProfile)
router.post('/profile', protect, createCareerProfile)
router.put('/profile', protect, updateCareerProfile)
router.post('/profile/complete', protect, completeOnboarding)
router.post('/profile/sync', protect, syncCareerProfile)
router.post('/profile/readiness/refresh', protect, refreshReadiness)

// ── 2. UNIFIED AGGREGATION & SUBMODULES ──
router.get('/dashboard', protect, getDashboard)
router.get('/learning', protect, getLearningHub)
router.get('/resume', protect, getResumeCenter)
router.get('/opportunities', protect, getOpportunities)
router.get('/interview', protect, getInterviewCenter)
router.get('/copilot/context', protect, getCopilotContext)
router.post('/sync/:module', protect, syncModule)

// ── 3. CAREER INTELLIGENCE ENGINE ──
router.get('/intelligence', protect, getCareerIntelligence)
router.post('/intelligence/recalculate', protect, recalculateCareerIntelligence)

// ── 4. CONVERSATIONAL CAREER COPILOT (PRIMARY AI) ──
router.post('/copilot/chat', optionalAuth, careersAIController.chatWithCareerCopilot)

// ── 5. AI ENDPOINTS & COMPATIBILITY WRAPPERS ──
router.post('/overview/ai-coaching', optionalAuth, careersAIController.overviewAICoaching)
router.post('/explorer/details-ai', optionalAuth, careersAIController.explorerDetailsAI)
router.post('/explorer/knowledge-hub-ai', optionalAuth, careersAIController.explorerKnowledgeHubAI)
router.post('/explorer/market-intel-ai', optionalAuth, careersAIController.explorerMarketIntelAI)
router.post('/explorer/decision-engine-ai', optionalAuth, careersAIController.explorerDecisionEngineAI)
router.post('/explorer/compare-ai', optionalAuth, careersAIController.explorerCompareAI)
router.post('/skillgap/analysis-ai', optionalAuth, careersAIController.skillGapAnalysisAI)
router.post('/skillgap/industry-priority-ai', optionalAuth, careersAIController.industryPriorityAI)
router.post('/skillgap/learning-recommendations-ai', optionalAuth, careersAIController.learningRecommendationsAI)
router.post('/roadmap/coach-ai', optionalAuth, careersAIController.roadmapCoachAI)
router.post('/roadmap/assessment-ai', optionalAuth, careersAIController.roadmapAssessmentAI)
router.post('/resume/ats-ai', optionalAuth, careersAIController.resumeATSAI)
router.post('/resume/export-ai', optionalAuth, careersAIController.resumeExportAI)
router.post('/resume/recruiter-ai', optionalAuth, careersAIController.resumeRecruiterAI)
router.post('/resume/application-ai', optionalAuth, careersAIController.applicationAI)
router.post('/resume/intelligence-ai', optionalAuth, careersAIController.resumeIntelligenceAI)
router.post('/interview/mock-ai', optionalAuth, careersAIController.mockInterviewAI)
router.post('/interview/coding-ai', optionalAuth, careersAIController.codingInterviewAI)
router.post('/interview/system-design-ai', optionalAuth, careersAIController.systemDesignInterviewAI)
router.post('/interview/company-ai', optionalAuth, careersAIController.companyInterviewAI)

// ── 6. BACKWARD COMPATIBILITY PROTOTYPE ROUTES ──
router.get('/paths', protect, getCareerPaths)
router.get('/roles', protect, getRoles)
router.post('/skill-gap', protect, getSkillGap)

module.exports = router
