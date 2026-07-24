const analyticsService = require('../intelligence/analyticsService')
const { buildContext } = require('./contextBuilder')
const { buildCombinedPrompt, classifyQuestion, detectPromptInjection } = require('./promptBuilder')
const { generateResponse } = require('./aiProvider')
const { formatResponse } = require('./responseFormatter')

/**
 * Orchestrator to handle academic queries using student academic records.
 * Integrates error recovery, classification, prompt injection checks, and conversation context.
 * 
 * @param {Object} record - The student's AcademicRecord document or object
 * @param {string} question - The query text entered by the student
 * @param {Array<Object>} conversationHistory - The optional conversation memory history array
 * @returns {Promise<Object>} The formatted standardized Copilot response
 */
const queryCopilot = async (record, question, conversationHistory = []) => {
  let context = null
  let classification = 'Unknown'
  
  try {
    // 1. Detect Prompt Injection Attempts
    if (detectPromptInjection(question)) {
      return {
        success: false,
        reason: "Prompt Injection Detected"
      }
    }

    classification = classifyQuestion(question)

    if (!record) {
      throw new Error('Academic record is required for AI Copilot.')
    }
    if (!question || question.trim().length === 0) {
      throw new Error('Question is required.')
    }

    // 2. Trim conversation history to the latest 6 exchanges (12 messages total)
    const trimmedHistory = (conversationHistory || []).slice(-12)

    // 3. Invoke the existing Academic Analytics Service
    const analytics = await analyticsService(record)

    // 4. Build the academic context
    context = buildContext(record, analytics)

    // 5. Generate the AI prompt
    const prompt = buildCombinedPrompt(context, question, trimmedHistory)

    // 6. Call the AI provider
    const rawResponse = await generateResponse(prompt)

    // 7. Format the AI response (includes fabrication checks)
    const formatted = formatResponse(rawResponse, context)

    // Save classification internally for analytical tracking in future modules
    formatted._internalClassification = classification

    return formatted
  } catch (err) {
    // Generate context-based fallback recommendations to remain helpful offline
    const fallbackAdvice = []
    if (context) {
      if (context.stats?.attendance < 85) {
        fallbackAdvice.push(`Improve your attendance average (currently ${context.stats.attendance}%).`)
      }
      if (context.subjects?.highRisk?.length > 0) {
        fallbackAdvice.push(`Prioritize study hours for high-risk subjects: ${context.subjects.highRisk.join(', ')}.`)
      }
      if (context.cgpa?.current < context.cgpa?.target) {
        fallbackAdvice.push(`Focus on boosting your CGPA (${context.cgpa.current}) toward target (${context.cgpa.target}).`)
      }
    }

    // Backfill standard advice if not enough context
    if (fallbackAdvice.length < 3) {
      fallbackAdvice.push("Keep your course logs and grade sheet inputs up to date.")
    }
    if (fallbackAdvice.length < 3) {
      fallbackAdvice.push("Regularly monitor your subject risk dials to notice warnings.")
    }
    if (fallbackAdvice.length < 3) {
      fallbackAdvice.push("Reach out to your course instructor or tutor for study materials.")
    }

    return {
      success: false,
      answer: "The Academic Copilot is temporarily offline or failed to respond. Based on your local record, please check the following fallback suggestions:",
      fallbackAdvice: fallbackAdvice.slice(0, 3),
      retryPossible: true,
      errorCode: 'AI_PROVIDER_ERROR',
      _internalClassification: classification
    }
  }
}

module.exports = {
  queryCopilot
}
