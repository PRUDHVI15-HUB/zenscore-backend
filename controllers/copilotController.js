const AcademicRecord = require('../models/AcademicRecord')
const StudentProfile = require('../models/StudentProfile')
const CareerProfile = require('../models/CareerProfile')
const { queryCopilot } = require('../services/ai/academicCopilotService')

// In-memory sliding-window rate limiter: 15 requests per 60 seconds per user
const rateLimitMap = new Map()
const RATE_LIMIT_WINDOW_MS = 60 * 1000
const RATE_LIMIT_MAX_REQUESTS = 15

/**
 * Checks rate limit for a given user ID.
 * Returns true if allowed, false if limit exceeded.
 */
const checkRateLimit = (userId) => {
  const now = Date.now()
  const userTimestamps = rateLimitMap.get(userId) || []

  // Filter out timestamps outside the window
  const validTimestamps = userTimestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW_MS)

  if (validTimestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
    rateLimitMap.set(userId, validTimestamps)
    return false
  }

  validTimestamps.push(now)
  rateLimitMap.set(userId, validTimestamps)
  return true
}

/**
 * Returns seconds remaining until rate limit window resets for a user.
 */
const getRateLimitRetryAfter = (userId) => {
  const now = Date.now()
  const userTimestamps = rateLimitMap.get(userId) || []
  if (userTimestamps.length === 0) return 0
  const oldest = userTimestamps[0]
  const elapsed = now - oldest
  return Math.max(1, Math.ceil((RATE_LIMIT_WINDOW_MS - elapsed) / 1000))
}

const validateQuestion = (question) => {
  if (!question || typeof question !== 'string') {
    return 'Question is required and must be a string.'
  }
  const trimmed = question.trim()
  if (trimmed.length < 2) {
    return 'Question must be at least 2 characters long.'
  }
  if (trimmed.length > 1000) {
    return 'Question must not exceed 1000 characters.'
  }
  return null
}

const validateConversationHistory = (history) => {
  if (history === undefined || history === null) return null
  if (!Array.isArray(history)) {
    return 'conversationHistory must be an array.'
  }
  for (let i = 0; i < history.length; i++) {
    const msg = history[i]
    if (!msg || typeof msg !== 'object') {
      return `conversationHistory[${i}] must be an object.`
    }
    if (!['user', 'assistant'].includes(msg.role)) {
      return `conversationHistory[${i}].role must be "user" or "assistant".`
    }
    if (typeof msg.content !== 'string') {
      return `conversationHistory[${i}].content must be a string.`
    }
  }
  return null
}

/**
 * POST /api/academics/copilot/chat
 *
 * Handles an authenticated student's academic question.
 * Loads their AcademicRecord, StudentProfile, CareerProfile, validates input, enforces rate limits,
 * delegates to the AI Copilot service, and returns a standardized response.
 */
const chatWithCopilot = async (req, res) => {
  const startTime = Date.now()
  const userId = req.user._id.toString()
  let classification = 'Unknown'

  // 1. Rate Limiting
  if (!checkRateLimit(userId)) {
    const retryAfter = getRateLimitRetryAfter(userId)
    console.warn(`[Copilot] Rate limit exceeded | userId=${userId}`)
    return res.status(429).json({
      success: false,
      message: 'Too many requests. Please wait before asking another question.',
      retryAfter,
      retryPossible: true
    })
  }

  // 2. Input Validation
  const { question, conversationHistory } = req.body

  const questionError = validateQuestion(question)
  if (questionError) {
    return res.status(400).json({ success: false, message: questionError })
  }

  const historyError = validateConversationHistory(conversationHistory)
  if (historyError) {
    return res.status(400).json({ success: false, message: historyError })
  }

  // 3. Load Academic Record & Profile Context in parallel
  let record = null
  let studentProfile = null
  let careerProfile = null

  try {
    const [rec, sp, cp] = await Promise.all([
      AcademicRecord.findOne({ $or: [{ user: req.user._id }, { userId: req.user._id }] }),
      StudentProfile.findOne({ $or: [{ user: req.user._id }, { userId: req.user._id }] }).catch(() => null),
      CareerProfile.findOne({ $or: [{ user: req.user._id }, { userId: req.user._id }] }).catch(() => null)
    ])
    record = rec
    studentProfile = sp
    careerProfile = cp
  } catch (dbErr) {
    console.error(`[Copilot] DB error fetching record | userId=${userId}`, dbErr.message)
    return res.status(500).json({ success: false, message: 'Failed to retrieve academic record.' })
  }

  // Gracefully handle students with no academic records yet
  if (!record || !record.semesters || record.semesters.length === 0) {
    return res.status(200).json({
      success: true,
      data: {
        answer: 'No academic records are available yet. Please upload your semester memo or log your courses under "My Subjects" so I can evaluate your performance and provide personalized advice.',
        suggestions: ['How do I upload a memo?', 'How is CGPA calculated?', 'What are graduation credit requirements?'],
        classification: 'General Academic',
        timestamp: new Date().toISOString()
      }
    })
  }

  // 4. Invoke AI Copilot Service with real academic & profile context
  let result
  try {
    result = await queryCopilot(record, question.trim(), conversationHistory || [], { studentProfile, careerProfile })
  } catch (aiErr) {
    const execMs = Date.now() - startTime
    console.error(`[Copilot] Unhandled service error | userId=${userId} | ${execMs}ms`, aiErr.message)
    return res.status(503).json({
      success: false,
      message: 'AI service temporarily unavailable. Please try again shortly.',
      retryPossible: true
    })
  }

  const execMs = Date.now() - startTime
  classification = result._internalClassification || 'Unknown'

  // 5. Handle Prompt Injection Rejection
  if (result.success === false && result.reason === 'Prompt Injection Detected') {
    console.warn(`[Copilot] Injection attempt blocked | userId=${userId} | ${execMs}ms`)
    return res.status(400).json({
      success: false,
      message: 'Your message contains disallowed content. Please ask a valid academic question.'
    })
  }

  // 6. Handle AI Provider Failure (503)
  if (result.success === false && result.errorCode === 'AI_PROVIDER_ERROR') {
    console.warn(`[Copilot] AI provider fallback active | userId=${userId} | classification=${classification} | ${execMs}ms`)
    return res.status(200).json({
      success: true,
      data: {
        answer: result.answer || "The Academic Copilot is temporarily in offline fallback mode. Focus on maintaining steady attendance and high-credit courses.",
        suggestions: result.fallbackAdvice || result.suggestions || ['Review weak subjects', 'Check CGPA status', 'Generate study schedule'],
        classification,
        timestamp: new Date().toISOString()
      }
    })
  }

  console.log(`[Copilot] userId=${userId} | classification=${classification} | execMs=${execMs} | success=true`)

  // 7. Return Standardized Success Response
  return res.status(200).json({
    success: true,
    data: {
      answer: result.answer,
      suggestions: result.suggestions || [],
      classification,
      timestamp: new Date().toISOString()
    }
  })
}

module.exports = {
  chatWithCopilot
}
