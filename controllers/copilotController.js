const AcademicRecord = require('../models/AcademicRecord')
const { queryCopilot } = require('../services/ai/academicCopilotService')

// ─────────────────────────────────────────────
//  Per-user in-memory rate limiter
//  Limit: 15 requests per 60 seconds per user
// ─────────────────────────────────────────────
const RATE_LIMIT_MAX = 15
const RATE_LIMIT_WINDOW_MS = 60 * 1000 // 60 seconds

// Map<userId, { count: number, windowStart: number }>
const rateLimitStore = new Map()

/**
 * Checks and updates the per-user rate limit.
 * Returns true if the user is within limits, false if exceeded.
 * @param {string} userId
 * @returns {boolean}
 */
const checkRateLimit = (userId) => {
  const now = Date.now()
  const entry = rateLimitStore.get(userId)

  if (!entry || now - entry.windowStart >= RATE_LIMIT_WINDOW_MS) {
    // Start a fresh window
    rateLimitStore.set(userId, { count: 1, windowStart: now })
    return true
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false // Limit exceeded
  }

  entry.count += 1
  return true
}

/**
 * Returns the number of seconds remaining before the rate limit window resets.
 * @param {string} userId
 * @returns {number} seconds remaining
 */
const getRateLimitRetryAfter = (userId) => {
  const entry = rateLimitStore.get(userId)
  if (!entry) return 60
  const elapsed = Date.now() - entry.windowStart
  const remaining = Math.ceil((RATE_LIMIT_WINDOW_MS - elapsed) / 1000)
  return remaining > 0 ? remaining : 60
}

// ─────────────────────────────────────────────
//  Input Validation
// ─────────────────────────────────────────────

/**
 * Validates the `question` field from the request body.
 * Returns an error message string if invalid, or null if valid.
 * @param {*} question
 * @returns {string|null}
 */
const validateQuestion = (question) => {
  if (question === undefined || question === null) {
    return 'Question is required.'
  }
  if (typeof question !== 'string') {
    return 'Question must be a string.'
  }
  if (question.trim().length === 0) {
    return 'Question cannot be empty.'
  }
  if (question.trim().length > 1000) {
    return 'Question must not exceed 1000 characters.'
  }
  return null
}

/**
 * Validates the `conversationHistory` field (optional).
 * Returns an error message string if invalid, or null if valid.
 * @param {*} history
 * @returns {string|null}
 */
const validateConversationHistory = (history) => {
  if (history === undefined || history === null) return null // Optional field
  if (!Array.isArray(history)) {
    return 'conversationHistory must be an array.'
  }
  for (const msg of history) {
    if (typeof msg !== 'object' || msg === null) {
      return 'Each conversationHistory entry must be an object.'
    }
    if (!['user', 'assistant'].includes(msg.role)) {
      return 'Each conversationHistory entry must have a role of "user" or "assistant".'
    }
    if (typeof msg.content !== 'string' || msg.content.trim().length === 0) {
      return 'Each conversationHistory entry must have a non-empty string content.'
    }
  }
  return null
}

// ─────────────────────────────────────────────
//  Controller
// ─────────────────────────────────────────────

/**
 * POST /api/academics/copilot/chat
 *
 * Handles an authenticated student's academic question.
 * Loads their AcademicRecord, validates input, enforces rate limits,
 * delegates to the AI Copilot service, and returns a standardized response.
 */
const chatWithCopilot = async (req, res) => {
  const startTime = Date.now()
  const userId = req.user._id.toString()
  let classification = 'Unknown'

  // ── 1. Rate Limiting ──
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

  // ── 2. Input Validation ──
  const { question, conversationHistory } = req.body

  const questionError = validateQuestion(question)
  if (questionError) {
    return res.status(400).json({ success: false, message: questionError })
  }

  const historyError = validateConversationHistory(conversationHistory)
  if (historyError) {
    return res.status(400).json({ success: false, message: historyError })
  }

  // ── 3. Load Academic Record ──
  let record
  try {
    record = await AcademicRecord.findOne({ user: userId })
  } catch (dbErr) {
    console.error(`[Copilot] DB error fetching record | userId=${userId}`, dbErr.message)
    return res.status(500).json({ success: false, message: 'Failed to retrieve academic record.' })
  }

  if (!record) {
    return res.status(404).json({
      success: false,
      message: 'Academic record not found. Please set up your academic profile first.'
    })
  }

  // ── 4. Invoke AI Copilot Service ──
  let result
  try {
    result = await queryCopilot(record, question.trim(), conversationHistory || [])
  } catch (aiErr) {
    // Unexpected unhandled error from service layer
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

  // ── 5. Handle Prompt Injection Rejection ──
  if (result.success === false && result.reason === 'Prompt Injection Detected') {
    console.warn(`[Copilot] Injection attempt blocked | userId=${userId} | ${execMs}ms`)
    return res.status(400).json({
      success: false,
      message: 'Your message contains disallowed content. Please ask a valid academic question.'
    })
  }

  // ── 6. Handle AI Provider Failure (503) ──
  if (result.success === false && result.errorCode === 'AI_PROVIDER_ERROR') {
    console.warn(`[Copilot] AI provider failed | userId=${userId} | classification=${classification} | ${execMs}ms | success=false`)
    return res.status(503).json({
      success: false,
      message: 'AI service temporarily unavailable.',
      retryPossible: true
    })
  }

  // ── 7. Log Success (never log prompt, response, or conversation) ──
  console.log(`[Copilot] userId=${userId} | classification=${classification} | execMs=${execMs} | success=true`)

  // ── 8. Return Standardized Success Response ──
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
