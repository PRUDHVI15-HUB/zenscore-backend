/**
 * Unified Career AI Service (Backend)
 * Consolidates all active Groq LLM operations:
 * - Conversational Career Copilot Chat (shared buildCareerContext)
 * - Overview Strategic Coaching
 * - Mock Interview Simulator & STAR Feedback
 * - Technical Challenge & System Design Generator
 */

const { getGroqClient, GROQ_MODEL } = require('./aiProvider')
const { buildCareerContext } = require('./careerContextBuilder')

class CareerAIService {
  /**
   * Primary Conversational Career Copilot Chat
   */
  async generateCareerCopilotChat(userId, message, section = 'overview', explicitContext = {}) {
    const studentContext = await buildCareerContext(userId)
    const activeTarget = explicitContext.targetCareer || studentContext.targetCareer || 'Software Engineer'
    const readiness = studentContext.readinessPct || explicitContext.readinessScore || 0

    const systemPrompt = `You are the ZenScore AI Career Copilot — an expert, encouraging, and highly technical career mentor for university students.
Student Profile Context:
- Target Role: ${activeTarget}
- Career Placement Readiness: ${readiness}%
- Current CGPA: ${studentContext.currentCGPA ? studentContext.currentCGPA + '/10.0' : 'Not recorded'}
- Verified Skills: ${studentContext.verifiedSkills.length > 0 ? studentContext.verifiedSkills.join(', ') : 'None yet'}
- Resume ATS Score: ${studentContext.atsScore > 0 ? studentContext.atsScore + '%' : 'No resume analyzed yet'}
- Active Section in App: ${section}

Guidelines:
1. Provide actionable, concise, and structured guidance tailored specifically to ${activeTarget}.
2. Use markdown formatting with bold text, bullet points, and code snippets where relevant.
3. If giving advice, refer to their real verified skills or skill gaps when applicable.
4. Keep the tone inspiring, professional, and practical.
5. Limit responses to 2-4 focused paragraphs or structured bullet lists.`

    try {
      const groq = getGroqClient()
      const completion = await groq.chat.completions.create({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message || 'How can I improve my placement readiness for my target role?' }
        ],
        temperature: 0.3,
        max_tokens: 800
      })

      const reply = completion.choices?.[0]?.message?.content || ''
      return {
        success: true,
        data: {
          reply,
          insight: reply,
          targetCareer: activeTarget,
          readinessScore: readiness,
          timestamp: new Date().toISOString()
        }
      }
    } catch (err) {
      console.warn('[CareerAIService] Copilot Groq error, using fallback:', err.message)
      const fallbackReply = `Based on your **${activeTarget}** goal (${readiness}% readiness):\n\n• **Action Item**: Focus on completing your next milestone in the Learning Hub to verify core skills.\n• **Resume Strategy**: Upload or update your technical project descriptions to align with industry ATS keywords.\n• **Interview Prep**: Practice 1 mock technical round this week to sharpen problem-solving speed.`
      return {
        success: true,
        data: {
          reply: fallbackReply,
          insight: fallbackReply,
          targetCareer: activeTarget,
          readinessScore: readiness,
          timestamp: new Date().toISOString()
        }
      }
    }
  }

  /**
   * Overview Strategic AI Coaching Banner
   */
  async generateOverviewCoaching(userId, targetCareer, readinessScore) {
    const studentContext = await buildCareerContext(userId)
    const target = targetCareer || studentContext.targetCareer
    const readiness = readinessScore !== undefined ? readinessScore : studentContext.readinessPct

    const prompt = `Generate a personalized daily career briefing for a student aiming for "${target}" with current placement readiness ${readiness}%.
Return ONLY valid JSON in this exact structure:
{
  "careerSummary": "A punchy 1-2 sentence assessment of their trajectory.",
  "todayMission": {
    "title": "A single high-impact daily task",
    "description": "Concrete steps to complete today",
    "estimatedMinutes": 30,
    "category": "Learning"
  },
  "readinessInsights": [
    "Key observation about their skills or profile"
  ],
  "nextMilestone": "Next major career milestone"
}`

    try {
      const groq = getGroqClient()
      const completion = await groq.chat.completions.create({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: 'You are an AI placement director providing structured JSON advice.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 500,
        response_format: { type: 'json_object' }
      })

      const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}')
      return { success: true, data: parsed }
    } catch (err) {
      console.warn('[CareerAIService] Overview coaching Groq error, using safe fallback:', err.message)
      return {
        success: true,
        data: {
          careerSummary: `Your ${target} roadmap is primed. Accelerate progress by verifying remaining required skills.`,
          todayMission: {
            title: `Review ${target} System Design Patterns`,
            description: 'Study standard architectural trade-offs and component diagrams.',
            estimatedMinutes: 30,
            category: 'Learning'
          },
          readinessInsights: [
            `Placement readiness is tracked at ${readiness}%.`,
            'Regular mock interviews significantly increase interview conversion rates.'
          ],
          nextMilestone: `Complete 80% of ${target} roadmap milestones`
        }
      }
    }
  }

  /**
   * Mock Interview AI Simulator
   */
  async generateMockInterviewRound(role, topic = 'technical', difficulty = 'Medium', company = 'Tech Enterprise') {
    const prompt = `Generate a realistic ${difficulty}-level ${topic} interview question for a candidate applying for ${role} at ${company}.
Return ONLY valid JSON:
{
  "questionId": "q-${Date.now()}",
  "role": "${role}",
  "category": "${topic}",
  "difficulty": "${difficulty}",
  "question": "The interview question text",
  "expectedKeyPoints": ["Point 1", "Point 2", "Point 3"],
  "evaluationRubric": {
    "technicalAccuracy": "What constitutes a 5/5 technical answer",
    "communication": "STAR framework structure guidelines",
    "depth": "Advanced insights or edge cases to consider"
  }
}`

    try {
      const groq = getGroqClient()
      const completion = await groq.chat.completions.create({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: 'You are a senior technical interviewer at a top company.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 600,
        response_format: { type: 'json_object' }
      })

      const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}')
      return { success: true, data: parsed }
    } catch (err) {
      console.warn('[CareerAIService] Mock interview Groq error, using safe fallback:', err.message)
      return {
        success: true,
        data: {
          questionId: `q-${Date.now()}`,
          role: role || 'Full Stack Developer',
          category: topic,
          difficulty: difficulty,
          question: `Explain how you would design a scalable caching layer for high-throughput ${role} APIs.`,
          expectedKeyPoints: ['Cache invalidation strategies (TTL, LRU)', 'Redis vs in-memory caching', 'Cache stampede prevention'],
          evaluationRubric: {
            technicalAccuracy: 'Correct understanding of latency reduction and distributed storage',
            communication: 'Clear problem breakdown and architecture trade-offs',
            depth: 'Handling consistency vs availability under high load'
          }
        }
      }
    }
  }
}

module.exports = new CareerAIService()
