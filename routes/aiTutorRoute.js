const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/authMiddleware')
const { chatWithPersonalBrain } = require('../services/ai/personalBrain')
const {
  getConversations,
  createConversation,
  getConversationById,
  updateConversation,
  deleteConversation
} = require('../controllers/aiTutorConversationController')

router.use(protect)

// In-memory sliding-window rate limiter: 20 requests per 60 seconds per user
const rateLimitMap = new Map()
const RATE_LIMIT_WINDOW_MS = 60 * 1000
const RATE_LIMIT_MAX_REQUESTS = 20

const checkAITutorRateLimit = (userId) => {
  const now = Date.now()
  const userTimestamps = rateLimitMap.get(userId) || []
  const validTimestamps = userTimestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW_MS)

  if (validTimestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
    rateLimitMap.set(userId, validTimestamps)
    return false
  }

  validTimestamps.push(now)
  rateLimitMap.set(userId, validTimestamps)
  return true
}

const getRateLimitRetryAfter = (userId) => {
  const now = Date.now()
  const userTimestamps = rateLimitMap.get(userId) || []
  if (userTimestamps.length === 0) return 0
  const oldest = userTimestamps[0]
  const elapsed = now - oldest
  return Math.max(1, Math.ceil((RATE_LIMIT_WINDOW_MS - elapsed) / 1000))
}

/**
 * Conversation Persistence CRUD Endpoints
 */
router.get('/conversations', getConversations)
router.post('/conversations', createConversation)
router.get('/conversations/:id', getConversationById)
router.patch('/conversations/:id', updateConversation)
router.delete('/conversations/:id', deleteConversation)

/**
 * POST /api/ai-tutor/chat
 * Central Personal AI Brain Chat Endpoint with 20 req/min rate limiting.
 */
router.post('/chat', async (req, res) => {
  try {
    const userId = req.user?._id?.toString() || req.user?.id?.toString()
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authenticated user required' })
    }

    // Enforce 20 req/60s rate limit
    if (!checkAITutorRateLimit(userId)) {
      const retryAfter = getRateLimitRetryAfter(userId)
      console.warn(`[AITutorRoute] Rate limit exceeded | userId=${userId}`)
      return res.status(429).json({
        success: false,
        error: 'Too many requests. Please wait a moment before sending more messages.',
        retryAfter,
        retryPossible: true
      })
    }

    const { messages, conversationId } = req.body
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ success: false, error: 'Messages array required' })
    }

    const result = await chatWithPersonalBrain({
      userId,
      messages,
      conversationId
    })

    return res.status(200).json({
      success: true,
      reply: result.reply,
      intent: result.intent,
      studentName: result.studentName,
      timestamp: result.timestamp,
      conversationId
    })
  } catch (err) {
    console.error('[AITutorRoute] Error in chatWithPersonalBrain:', err)
    return res.status(500).json({ success: false, error: err.message || 'AI Tutor failed' })
  }
})

module.exports = router
