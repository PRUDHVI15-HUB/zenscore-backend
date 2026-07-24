const Groq = require('groq-sdk')

/**
 * Call the existing LLM provider (Groq) to generate a response.
 * @param {string} prompt - The prompt text for the model
 * @returns {Promise<string>} The raw text response from the model
 */
const generateResponse = async (prompt) => {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not defined in environment variables.')
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

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
    model: 'llama-3.3-70b-specdec', // Using a stable, high-performance Groq model
    temperature: 0.2
  })

  // Race request against timeout
  const completion = await Promise.race([requestPromise, timeoutPromise])

  return completion.choices[0]?.message?.content || ''
}

module.exports = {
  generateResponse
}
