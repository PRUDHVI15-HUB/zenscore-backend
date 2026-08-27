/**
 * externalAtsProvider.js
 * =========================================================================
 * External ATS Provider Integration for ZenScore AI.
 * Communicates with third-party ATS API or AI ATS Engine via REST,
 * enforcing timeout controls, rate-limit resilience, and strict schema normalization.
 */

const internalAtsProvider = require('./internalAtsProvider')

/**
 * Sends parsed resume and text to external ATS service.
 *
 * @param {Object} params
 * @param {String} [params.filePath] - Local file path of resume
 * @param {String} [params.rawText] - Extracted plain text
 * @param {Object} params.parsedResume - Structured resume object
 * @param {String} params.targetCareer - Canonical target career goal
 * @param {String} [params.jobDescription] - Optional target job description
 * @returns {Promise<Object>} { success: boolean, analysis?: Object, error?: string }
 */
async function analyzeResume({ filePath, rawText = '', parsedResume = {}, targetCareer = 'Full Stack Developer', jobDescription = null }) {
  const apiUrl = process.env.ATS_API_URL
  const apiKey = process.env.ATS_API_KEY || process.env.GROQ_API_KEY

  if (!apiUrl && !process.env.GROQ_API_KEY) {
    return {
      success: false,
      error: 'External ATS API URL (ATS_API_URL) or GROQ_API_KEY is not configured in backend environment.'
    }
  }

  // 1. External REST ATS Endpoint (if ATS_API_URL is configured)
  if (apiUrl) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 second timeout

      const payload = {
        targetCareer,
        jobDescription,
        candidate: parsedResume.candidate || {},
        skills: parsedResume.skills || [],
        experience: parsedResume.experience || [],
        education: parsedResume.education || [],
        rawTextLength: rawText.length
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        return {
          success: false,
          error: `External ATS Provider returned status HTTP ${response.status} (${response.statusText}).`
        }
      }

      const data = await response.json()
      const normalized = normalizeExternalPayload(data, parsedResume, targetCareer)

      return {
        success: true,
        analysis: normalized
      }

    } catch (err) {
      const errorMsg = err.name === 'AbortError' ? 'External ATS API request timed out after 8000ms.' : (err.message || String(err))
      return {
        success: false,
        error: errorMsg
      }
    }
  }

  // 2. Groq AI Structured ATS Provider (when GROQ_API_KEY is present)
  if (process.env.GROQ_API_KEY) {
    try {
      const { Groq } = require('groq-sdk')
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

      const prompt = `You are an elite Applicant Tracking System (ATS) Auditor. Analyze the following resume against target career: "${targetCareer}".
Return ONLY a valid JSON object matching this structure:
{
  "atsScore": 85,
  "keywordMatch": 80,
  "formattingScore": 90,
  "contentScore": 85,
  "sectionScore": 88,
  "matchingKeywords": ["React", "JavaScript"],
  "missingKeywords": ["TypeScript", "Next.js"],
  "missingSections": ["Certifications"],
  "formatIssues": ["Bullet points should include metrics"],
  "recommendations": [
    { "issue": "Missing TypeScript", "whyItMatters": "Crucial for target role", "recommendedAction": "Add TypeScript projects", "priority": "HIGH" }
  ],
  "strengths": ["Clear project section"],
  "weaknesses": ["Lack of quantified impact"]
}

Resume Text / Skills:
${JSON.stringify({ skills: parsedResume.skills, summary: parsedResume.summary, exp: parsedResume.experience?.length || 0, edu: parsedResume.education?.length || 0 })}`

      const completion = await groq.chat.completions.create({
        model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.2,
        max_tokens: 1000
      })

      const content = completion.choices[0]?.message?.content
      if (content) {
        const rawJson = JSON.parse(content)
        const normalized = normalizeExternalPayload(rawJson, parsedResume, targetCareer)
        return {
          success: true,
          analysis: normalized
        }
      }
    } catch (groqErr) {
      return {
        success: false,
        error: `Groq ATS Provider error: ${groqErr.message}`
      }
    }
  }

  return {
    success: false,
    error: 'No active external ATS provider configuration found.'
  }
}

/**
 * Normalizes external provider JSON payload into ZenScore standard ATS schema.
 */
function normalizeExternalPayload(payload = {}, parsedResume = {}, targetCareer = 'Full Stack Developer') {
  const internalFallback = internalAtsProvider.analyzeResume({ parsedResume, targetCareer })

  const atsScore = Math.min(100, Math.max(0, Number(payload.atsScore || payload.score || internalFallback.atsScore)))
  const keywordMatch = Math.min(100, Math.max(0, Number(payload.keywordMatch || payload.matchScore || internalFallback.keywordMatch)))
  const formattingScore = Math.min(100, Math.max(0, Number(payload.formattingScore || internalFallback.formattingScore)))
  const contentScore = Math.min(100, Math.max(0, Number(payload.contentScore || internalFallback.contentScore)))
  const sectionScore = Math.min(100, Math.max(0, Number(payload.sectionScore || internalFallback.sectionScore)))
  const completeness = Math.min(100, Math.round((contentScore + sectionScore) / 2))

  const matchingKeywords = Array.isArray(payload.matchingKeywords) ? payload.matchingKeywords : internalFallback.matchingKeywords
  const missingKeywords = Array.isArray(payload.missingKeywords) ? payload.missingKeywords : internalFallback.missingKeywords
  const formatIssues = Array.isArray(payload.formatIssues) ? payload.formatIssues : internalFallback.formatIssues
  const missingSections = Array.isArray(payload.missingSections) ? payload.missingSections : internalFallback.missingSections
  const strengths = Array.isArray(payload.strengths) ? payload.strengths : internalFallback.strengths
  const weaknesses = Array.isArray(payload.weaknesses) ? payload.weaknesses : internalFallback.weaknesses

  const recommendations = Array.isArray(payload.recommendations) && payload.recommendations.length > 0
    ? payload.recommendations
    : internalFallback.recommendations

  return {
    provider: 'external',
    atsScore,
    keywordMatch,
    formattingScore,
    contentScore,
    sectionScore,
    completeness,
    skillsDetected: parsedResume.skills || [],
    matchingKeywords,
    missingKeywords,
    missingSections,
    formatIssues,
    recommendations,
    strengths,
    weaknesses,
    scoringReasons: strengths,
    careerMatch: {
      targetCareer,
      matchScore: keywordMatch,
      matchingSkills: matchingKeywords,
      missingSkills: missingKeywords,
      recommendedSkills: missingKeywords.slice(0, 4)
    },
    rawProviderResponse: payload,
    analyzedAt: new Date()
  }
}

module.exports = {
  analyzeResume
}
