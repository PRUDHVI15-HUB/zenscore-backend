/**
 * personalBrainService.js - Central Personal AI Brain Orchestrator
 * Connects intent classification, student snapshot data, two-level memory,
 * prompt compilation, Groq LLM provider, and 9-domain anti-fabrication validation.
 * 
 * Note: Decoupled from conversation database CRUD (handled by aiTutorConversationController).
 */

const { classifyIntent, INTENTS } = require('./intentClassifier')
const { getStudentSnapshot } = require('./studentSnapshotService')
const { routeContext } = require('./contextRouter')
const { compressContext } = require('./contextCompressor')
const { buildBrainSystemPrompt } = require('./brainPromptBuilder')
const { validateAndCorrectBrainResponse } = require('./brainResponseValidator')
const {
  extractUserPreferences,
  loadStudentPreferences,
  saveStudentPreference,
  trimConversationHistory
} = require('./memoryService')
const { generateResponse } = require('../aiProvider')
const Groq = require('groq-sdk')

let groqInstance = null
function getGroq() {
  if (!groqInstance && process.env.GROQ_API_KEY) {
    groqInstance = new Groq({ apiKey: process.env.GROQ_API_KEY })
  }
  return groqInstance
}

/**
 * Handle a chat conversation turn with the Personal AI Brain
 * @param {Object} params
 * @param {string|ObjectId} params.userId - Authenticated Mongoose User ID
 * @param {Array<Object>} params.messages - Conversation history
 * @returns {Promise<Object>} Response payload { reply, intent, studentName, timestamp }
 */
async function chatWithPersonalBrain({ userId, messages }) {
  if (!userId) {
    throw new Error('Authenticated user ID is required for Personal AI Brain')
  }

  // 1. Sanitize & trim conversation history (strips client-side system injection)
  const trimmedMessages = trimConversationHistory(messages, 8)
  const latestUserMessage = trimmedMessages
    .filter(m => m.role === 'user')
    .slice(-1)[0]?.content || ''

  // 2. Classify user intent across 9 domains
  const intent = classifyIntent(latestUserMessage)

  // 3. Extract & persist conversational preferences (Level 2 memory)
  const extractedGoal = extractUserPreferences(latestUserMessage)
  if (extractedGoal) {
    saveStudentPreference(userId, extractedGoal).catch(() => null)
  }

  // 4. Fetch authoritative student snapshot (Level 1 memory from MongoDB)
  const snapshot = await getStudentSnapshot(userId)
  const studentName = snapshot?.profile?.name || 'Student'

  // 5. Route and compress relevant domain context
  const routedContext = routeContext(snapshot, intent)
  const compressedContext = compressContext(routedContext)

  // 6. Load active goals / memory notes
  const activeGoals = await loadStudentPreferences(userId)

  // 7. Compile grounded system prompt
  const systemPrompt = buildBrainSystemPrompt(studentName, compressedContext, activeGoals, intent)

  // 8. Execute LLM completion with Groq
  const groq = getGroq()
  const modelName = process.env.GROQ_MODEL || 'openai/gpt-oss-120b'

  const fullPromptMessages = [
    { role: 'system', content: systemPrompt },
    ...trimmedMessages
  ]

  let reply = ''

  if (groq) {
    try {
      const completion = await groq.chat.completions.create({
        model: modelName,
        messages: fullPromptMessages,
        max_tokens: 1024,
        temperature: intent === INTENTS.GREETING_OR_CASUAL ? 0.5 : 0.4
      })
      reply = completion.choices[0]?.message?.content || ''
    } catch (groqErr) {
      console.warn('[PersonalBrainService] Direct Groq chat error, falling back to generateResponse:', groqErr?.message)
      const combinedFallback = `${systemPrompt}\n\nUser: ${latestUserMessage}`
      reply = await generateResponse(combinedFallback)
    }
  } else {
    const combinedFallback = `${systemPrompt}\n\nUser: ${latestUserMessage}`
    reply = await generateResponse(combinedFallback)
  }

  if (!reply) {
    reply = `Hi ${studentName}! I'm ready to help you with your coursework, skills, or career preparation. What would you like to work on?`
  }

  // 9. Deterministic 9-Domain Anti-Fabrication & Grounding Validation
  const validationResult = validateAndCorrectBrainResponse(reply, snapshot)
  const cleanReply = validationResult.cleanReply

  return {
    reply: cleanReply,
    intent,
    studentName,
    activeGoalRecorded: Boolean(extractedGoal),
    anomaliesDetected: validationResult.detectedAnomalies.length,
    timestamp: new Date().toISOString()
  }
}

module.exports = {
  chatWithPersonalBrain
}
