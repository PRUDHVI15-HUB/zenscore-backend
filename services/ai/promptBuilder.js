/**
 * Generates the system prompt instructing the AI on rules and behaviors.
 * Enforces strict hallucination guardrails.
 * @returns {string} System prompt instruction string
 */
const buildSystemPrompt = () => {
  return `You are the ZenScore AI Academic Copilot, a high-precision student advising agent.

CRITICAL RULES:
1. Answer ONLY using the supplied Academic Context. If the context does not contain enough information to answer, you MUST reply with exactly: "I don't have enough academic data to answer that." Do not say anything else.
2. Never hallucinate, guess, or invent any CGPA, target CGPA, attendance percentages, course grades, semester names, recommendations, or subject names.
3. Be highly supportive and offer practical, actionable academic advice.
4. Prefer short, concise answers unless the student explicitly asks for a detailed explanation.
5. If the user asks general non-academic questions, politely refuse to answer them.
6. Understand Indian academic terminology: students commonly refer to semester grade cards / marks sheets as 'memo' or 'marks memo'. If a student refers to a memo, understand that it is their official semester marks/grade document.`
}

/**
 * Combines the student's academic context and question into a user prompt.
 * @param {Object} context - The structured context from contextBuilder
 * @param {string} question - The student's query
 * @returns {string} Compiled user prompt string
 */
const buildUserPrompt = (context, question) => {
  const cleanContext = { ...context }
  delete cleanContext.metadata

  return `Academic Context:
${JSON.stringify(cleanContext, null, 2)}

Student Question:
"${question}"`
}

/**
 * Compiles a combined prompt including system guidelines, optional trimmed conversation history, and user context/question.
 * @param {Object} context - The structured context from contextBuilder
 * @param {string} question - The student's query
 * @param {Array<Object>} conversationHistory - Trimming history list
 * @returns {string} Combined prompt containing all injected context elements
 */
const buildCombinedPrompt = (context, question, conversationHistory = []) => {
  const system = buildSystemPrompt()
  const user = buildUserPrompt(context, question)

  if (!conversationHistory || conversationHistory.length === 0) {
    return `${system}

---
${user}`
  }

  // format history messages cleanly
  const historyLines = conversationHistory.map(msg => {
    const roleLabel = msg.role === 'user' ? 'User' : 'Assistant'
    return `${roleLabel}: ${msg.content}`
  }).join('\n')

  return `${system}

---
Conversation History:
${historyLines}

---
${user}`
}

/**
 * Validates whether the student query contains prompt injection keywords or bypass phrases.
 * @param {string} question - The query string
 * @returns {boolean} True if prompt injection is detected
 */
const detectPromptInjection = (question) => {
  if (!question || typeof question !== 'string') return false
  const cleanQ = question.toLowerCase().trim()

  const attackPhrases = [
    'ignore previous instructions',
    'ignore instructions',
    'forget context',
    'forget previous',
    'reveal system prompt',
    'show hidden instructions',
    'pretend you are chatgpt',
    'pretend you are',
    'you are now',
    'ignore academic data',
    'bypass rules',
    'jailbreak'
  ]

  return attackPhrases.some(phrase => cleanQ.includes(phrase))
}

/**
 * Classifies an incoming academic query into defined semantic categories.
 * @param {string} question - Student question
 * @returns {string} Question category string
 */
const classifyQuestion = (question) => {
  if (!question || typeof question !== 'string') return 'Unknown'
  const cleanQ = question.toLowerCase().trim()

  if (cleanQ.includes('cgpa') || cleanQ.includes('gpa') || cleanQ.includes('overall grade') || cleanQ.includes('cumulative')) {
    return 'CGPA'
  }
  if (cleanQ.includes('attendance') || cleanQ.includes('absent') || cleanQ.includes('present') || cleanQ.includes('class') || cleanQ.includes('attend')) {
    return 'Attendance'
  }
  if (cleanQ.includes('recommendation') || cleanQ.includes('advice') || cleanQ.includes('suggest') || cleanQ.includes('rec ')) {
    return 'Recommendation'
  }
  if (cleanQ.includes('health') || cleanQ.includes('wellbeing') || cleanQ.includes('index') || cleanQ.includes('status')) {
    return 'Health Score'
  }
  if (cleanQ.includes('subject') || cleanQ.includes('course') || cleanQ.includes('dsa') || cleanQ.includes('oop') || cleanQ.includes('math') || cleanQ.includes('algorithms')) {
    return 'Subject'
  }
  if (cleanQ.includes('semester') || cleanQ.includes('term') || cleanQ.includes('sem')) {
    return 'Semester'
  }
  if (cleanQ.includes('academic') || cleanQ.includes('credits') || cleanQ.includes('study') || cleanQ.includes('plan')) {
    return 'General Academic'
  }
  return 'Unknown'
}

module.exports = {
  buildSystemPrompt,
  buildUserPrompt,
  buildCombinedPrompt,
  detectPromptInjection,
  classifyQuestion
}
