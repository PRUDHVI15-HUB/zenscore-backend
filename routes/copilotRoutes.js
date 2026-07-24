const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/authMiddleware')
const { chatWithCopilot } = require('../controllers/copilotController')

// Apply JWT authentication to all copilot routes
router.use(protect)

/**
 * POST /api/academics/copilot/chat
 *
 * Academic AI Copilot Chat Endpoint.
 * Accepts a student question and optional conversation history.
 * Returns a structured AI-generated academic answer with suggestions.
 *
 * Authentication: Required (Bearer JWT)
 * Rate Limit: 15 requests per minute per user
 */
router.post('/chat', chatWithCopilot)

module.exports = router
