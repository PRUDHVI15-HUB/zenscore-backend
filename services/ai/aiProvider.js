const Groq = require('groq-sdk')

let groqClientInstance = null
const GROQ_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b'

function getGroqClient() {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not defined in environment variables.')
  }
  if (!groqClientInstance) {
    groqClientInstance = new Groq({ apiKey: process.env.GROQ_API_KEY })
  }
  return groqClientInstance
}

/**
 * Call the existing LLM provider (Groq) to generate a response.
 * @param {string} prompt - The prompt text for the model
 * @returns {Promise<string>} The raw text response from the model
 */
const generateResponse = async (prompt) => {
  const groq = getGroqClient()
  const modelName = GROQ_MODEL

  // 30-second timeout safeguard
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('AI provider request timed out')), 30000)
  )

  const requestPromise = groq.chat.completions.create({
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ],
    model: modelName,
    temperature: 0.2
  })

  try {
    const completion = await Promise.race([requestPromise, timeoutPromise])
    return completion.choices[0]?.message?.content || ''
  } catch (primaryErr) {
    console.error('[AIProvider] Groq request failed:', primaryErr.message)
    throw primaryErr
  }
}

module.exports = {
  getGroqClient,
  GROQ_MODEL,
  generateResponse
}
