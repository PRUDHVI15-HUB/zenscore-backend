const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/authMiddleware')

router.use(protect)

router.post('/chat', async (req, res) => {
  try {
    const { messages } = req.body
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array required' })
    }

    const Groq = require('groq-sdk')
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are an expert engineering tutor helping undergraduate students in India.
You specialize in DSA, Operating Systems, DBMS, Computer Networks, Electronics, Signals & Systems, DevOps, Mathematics, Python, and all core engineering subjects.
Explain concepts clearly with real-world examples. Use **bold** for key terms.
Structure your responses well with proper sections when needed.
Be thorough, helpful, and friendly like a senior student explaining to a junior.
End every response with exactly this on a new line: [YT:4 word youtube search query]`
        },
        ...messages.map(m => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content
        }))
      ],
      max_tokens: 1024,
      temperature: 0.7
    })

    const reply = completion.choices[0]?.message?.content || 'Sorry, could not generate a response.'
    res.json({ reply })

  } catch (err) {
    console.error('AI Tutor error:', err)
    res.status(500).json({ error: err.message || 'AI Tutor failed' })
  }
})

module.exports = router