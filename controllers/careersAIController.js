/**
 * Careers AI Controller (Backend)
 * Routes incoming AI queries to the unified careerAIService.
 * Preserves compatibility with all 20 legacy endpoint names.
 */

const careerAIService = require('../services/ai/careerAIService')

/**
 * POST /api/careers/copilot/chat
 * Primary conversational Career Copilot
 */
exports.chatWithCareerCopilot = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?._id || req.body.userId || null
    const { message, question, query, prompt, section, currentSection, conversationHistory, targetCareer, readinessScore } = req.body

    const userMessage = message || question || query || prompt || ''
    if (!userMessage || typeof userMessage !== 'string' || userMessage.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Question or message string is required.' })
    }

    if (userMessage.length > 5000) {
      return res.status(400).json({ success: false, message: 'Message exceeds maximum allowed length (5000 characters).' })
    }

    if (conversationHistory !== undefined && !Array.isArray(conversationHistory)) {
      return res.status(400).json({ success: false, message: 'conversationHistory must be an array.' })
    }

    const activeSection = section || currentSection || 'overview'
    const result = await careerAIService.generateCareerCopilotChat(
      userId,
      userMessage.trim(),
      activeSection,
      { targetCareer, readinessScore, conversationHistory }
    )

    return res.status(200).json(result)
  } catch (error) {
    console.error('[CareersAIController] Copilot error:', error.message)
    return res.status(500).json({ success: false, message: 'Failed to process Career Copilot request.' })
  }
}

/**
 * POST /api/careers/overview/ai-coaching
 * Daily Strategic Coaching Briefing
 */
exports.generateOverviewCoaching = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?._id || null
    const { targetCareer, readinessScore } = req.body || {}

    const result = await careerAIService.generateOverviewCoaching(userId, targetCareer, readinessScore)
    const payload = result.data || {}

    const responseData = {
      ...payload,
      executiveSummary: payload.careerSummary || payload.executiveSummary || '',
      actionItems: Array.isArray(payload.readinessInsights) ? payload.readinessInsights : (payload.actionItems || [])
    }

    return res.status(200).json({ success: true, data: responseData })
  } catch (error) {
    console.error('[CareersAIController] Overview coaching error:', error.message)
    return res.status(500).json({ success: false, message: 'Failed to generate overview coaching.' })
  }
}

/**
 * POST /api/careers/interview/mock-ai & /coding-ai & /system-design-ai & /company-ai
 * Mock Interview Round Generator
 */
exports.generateMockInterview = async (req, res, next) => {
  try {
    const { targetRole, role, topic, interviewType, difficulty, company } = req.body || {}
    const activeRole = targetRole || role || 'Full Stack Developer'
    const activeTopic = topic || interviewType || 'technical'
    const activeDifficulty = difficulty || 'Medium'
    const activeCompany = company || 'Tech Enterprise'

    const result = await careerAIService.generateMockInterviewRound(
      activeRole,
      activeTopic,
      activeDifficulty,
      activeCompany
    )

    const payload = result.data || {}
    const responseData = {
      ...payload,
      round: payload // Alias for legacy consumers
    }

    return res.status(200).json({ success: true, data: responseData })
  } catch (error) {
    console.error('[CareersAIController] Interview generation error:', error.message)
    return res.status(500).json({ success: false, message: 'Failed to generate mock interview question.' })
  }
}

// ── Compatibility Handlers for all 20 legacy endpoints ──
exports.overviewAICoaching = exports.generateOverviewCoaching

exports.mockInterviewAI = exports.generateMockInterview
exports.codingInterviewAI = exports.generateMockInterview
exports.systemDesignInterviewAI = exports.generateMockInterview
exports.companyInterviewAI = exports.generateMockInterview

// Generic AI adapter for remaining legacy endpoints
const handleGenericAI = (sectionName) => async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || req.body?.userId || null
    const prompt = req.body?.prompt || req.body?.message || req.body?.query || `Guidance for ${sectionName}`
    const result = await careerAIService.generateCareerCopilotChat(userId, prompt, sectionName, req.body || {})
    return res.status(200).json(result)
  } catch (err) {
    return res.status(200).json({ success: true, data: { insight: 'Career guidance recommendation updated.' } })
  }
}

exports.explorerDetailsAI = handleGenericAI('explorer')
exports.explorerKnowledgeHubAI = handleGenericAI('explorer')
exports.explorerMarketIntelAI = handleGenericAI('explorer')
exports.explorerDecisionEngineAI = handleGenericAI('explorer')
exports.explorerCompareAI = handleGenericAI('explorer')

exports.skillGapAnalysisAI = handleGenericAI('skillgap')
exports.industryPriorityAI = handleGenericAI('skillgap')
exports.learningRecommendationsAI = handleGenericAI('skillgap')

exports.roadmapCoachAI = handleGenericAI('roadmap')
exports.roadmapAssessmentAI = handleGenericAI('roadmap')

exports.resumeATSAI = handleGenericAI('resume')
exports.resumeExportAI = handleGenericAI('resume')
exports.resumeRecruiterAI = handleGenericAI('resume')
exports.applicationAI = handleGenericAI('resume')
exports.resumeIntelligenceAI = handleGenericAI('resume')
