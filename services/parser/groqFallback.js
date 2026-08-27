/**
 * Groq Fallback — Field-Level Verifier (v2.0)
 *
 * ARCHITECTURAL CHANGE: Groq is NO LONGER the primary parser.
 * It is a surgical field verifier called ONLY when:
 *   - Subjects have per-subject confidence < CONFIDENCE_THRESHOLD (90)
 *   - AND the isolated table text is available
 *
 * Groq receives:
 *   - ONLY the isolated academic table text (never the full transcript)
 *   - ONLY the low-confidence subject rows that need verification
 *
 * Groq returns field-level corrections for ONLY those subjects.
 * High-confidence subjects are NEVER sent to Groq.
 */
const { CONFIDENCE_THRESHOLD } = require('./utils/constants')

/**
 * Builds a targeted Groq prompt for field-level verification.
 * Only sends low-confidence subjects and the isolated table text.
 *
 * @param {string} isolatedTableText - Only the academic table rows
 * @param {Object[]} lowConfidenceSubjects - Subjects needing verification
 * @returns {string} Prompt string
 */
const buildGroqPrompt = (isolatedTableText, lowConfidenceSubjects) => {
  const subjectList = lowConfidenceSubjects.map((s, idx) =>
    `Subject ${idx + 1}: id="${s.id}" name="${s.name}" credits=${s.credits ?? 'UNKNOWN'} rawGrade="${s.rawGrade || 'UNKNOWN'}" finalGrade=${s.finalGrade ?? 'UNKNOWN'}`
  ).join('\n')

  // Build a whitelist of valid IDs so Groq cannot invent new ones
  const validIds = lowConfidenceSubjects.map(s => `"${s.id}"`).join(', ')

  return `You are a precise academic transcript field verifier. You ONLY repair missing fields.

Academic Table (ONLY these rows — no headers, no footers, no student information):
"""
${isolatedTableText.substring(0, 2000)}
"""

Subjects needing field verification (ONLY these):
${subjectList}

STRICT RULES — violating any rule makes your response invalid:
1. Return a JSON array ONLY. No markdown fences, no prose, no explanation.
2. Each object MUST contain the key "id" matching one of these valid IDs: [${validIds}].
3. DO NOT include any id not in the list above. DO NOT invent new subjects.
4. DO NOT change any field that already has a non-null, non-UNKNOWN value.
5. credits must be an integer 0–6. finalGrade must be a number 0–10. rawGrade must be a string.
6. If you cannot determine a field with certainty, set it to null — never guess.
7. DO NOT include sgpa, cgpa, semester, student name, roll number, or any other field.
8. DO NOT change the number of subjects in the list.

Valid output format:
[{"id":"subject_3","credits":4,"rawGrade":"A+","finalGrade":9}]`
}

/**
 * Calls Groq API with the verification prompt.
 * @param {string} prompt - Prompt string
 * @returns {Promise<string>} Raw API response content
 */
const callGroqVerify = async (prompt) => {
  const Groq = require('groq-sdk')
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not defined in environment variables.')
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Groq request timed out')), 25000)
  )

  const requestPromise = groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
    temperature: 0.02,     // Near-zero — deterministic factual lookup only
    max_tokens: 800,       // Limit output space to reduce hallucination surface
    response_format: { type: 'json_object' }
  })

  const response = await Promise.race([requestPromise, timeoutPromise])
  return response.choices[0]?.message?.content || ''
}

/**
 * Parses Groq's JSON array response.
 * @param {string} responseText
 * @returns {Object[]|null}
 */
const parseGroqResponse = (responseText) => {
  if (!responseText) return null
  try {
    let clean = responseText.trim()
    if (clean.startsWith('```')) {
      clean = clean.replace(/^```(?:json)?/, '').replace(/```$/, '').trim()
    }
    const parsed = JSON.parse(clean)
    // Groq sometimes wraps in an object
    if (Array.isArray(parsed)) return parsed
    if (parsed && Array.isArray(parsed.subjects)) return parsed.subjects
    if (parsed && Array.isArray(parsed.results)) return parsed.results
    // Single object fallback
    if (parsed && parsed.id) return [parsed]
    return null
  } catch {
    return null
  }
}

/**
 * Validates and clamps Groq-suggested field values.
 */
const isValidCredits = (v) => {
  const n = parseInt(v)
  return !isNaN(n) && n >= 0 && n <= 6
}
const isValidGrade = (v) => {
  const n = parseFloat(v)
  return !isNaN(n) && n >= 0 && n <= 10
}
const isValidRawGrade = (v) => typeof v === 'string' && v.trim().length > 0

/**
 * Merges Groq field corrections back into the low-confidence subjects.
 * ONLY fills UNKNOWN/null fields — never overwrites confirmed values.
 *
 * @param {Object[]} lowConfidenceSubjects - Original low-confidence subjects (mutated in place)
 * @param {Object[]|null} groqResults - Parsed Groq response array
 * @returns {string[]} Log of repaired fields
 */
const mergeVerifications = (lowConfidenceSubjects, groqResults) => {
  const repairLog = []
  if (!groqResults || !Array.isArray(groqResults)) return repairLog

  // Build a whitelist of valid input IDs — Groq must not invent new ones
  const validInputIds = new Set(lowConfidenceSubjects.map(s => s.id))

  for (const verified of groqResults) {
    // Security: reject any result whose ID wasn't in the input (invented subject)
    if (!verified || !verified.id || !validInputIds.has(verified.id)) {
      if (verified?.id) {
        repairLog.push(`REJECTED: Groq returned unknown id '${verified.id}' — discarded`)
      }
      continue
    }

    const origSub = lowConfidenceSubjects.find(s => s.id === verified.id)
    if (!origSub) continue

    // Credits — only fill if currently null/invalid AND Groq value is valid
    if ((origSub.credits === null || origSub.credits === undefined) && isValidCredits(verified.credits)) {
      const cInt = parseInt(verified.credits, 10)
      if (cInt >= 0 && cInt <= 6) {  // Double-clamp
        repairLog.push(`${origSub.id}: credits null→${cInt}`)
        origSub.credits = cInt
        origSub.rawCredits = String(cInt)
      }
    }

    // rawGrade — only fill if empty
    if (!origSub.rawGrade && isValidRawGrade(verified.rawGrade)) {
      const cleanGrade = String(verified.rawGrade).trim().toUpperCase()
      const ALLOWED_GRADES = new Set(['O', 'S', 'A+', 'A', 'B+', 'B', 'C', 'P', 'F'])
      if (ALLOWED_GRADES.has(cleanGrade) || /^\d+(\.\d+)?$/.test(cleanGrade)) {
        repairLog.push(`${origSub.id}: rawGrade ''→'${cleanGrade}'`)
        origSub.rawGrade = cleanGrade
      }
    }

    // finalGrade — only fill if null AND Groq value is in range
    if ((origSub.finalGrade === null || origSub.finalGrade === undefined) && isValidGrade(verified.finalGrade)) {
      const fGrade = parseFloat(verified.finalGrade)
      if (fGrade >= 0 && fGrade <= 10) {  // Double-clamp
        repairLog.push(`${origSub.id}: finalGrade null→${fGrade}`)
        origSub.finalGrade = fGrade
      }
    }
  }

  return repairLog
}

/**
 * Main Groq Verification Entry Point.
 *
 * @param {string} isolatedTableText - Isolated academic table text ONLY
 * @param {Object[]} lowConfidenceSubjects - Subjects with confidence < threshold
 * @returns {Promise<{ repairedSubjects: Object[], repairLog: string[], groqCalled: boolean, groqError: string|null }>}
 */
const verifyWithGroq = async (isolatedTableText, lowConfidenceSubjects) => {
  if (!lowConfidenceSubjects || lowConfidenceSubjects.length === 0) {
    return { repairedSubjects: [], repairLog: [], groqCalled: false, groqError: null }
  }

  const startTime = Date.now()
  let groqError = null
  let repairLog = []

  try {
    const prompt = buildGroqPrompt(isolatedTableText, lowConfidenceSubjects)
    const responseText = await callGroqVerify(prompt)
    const groqResults = parseGroqResponse(responseText)
    repairLog = mergeVerifications(lowConfidenceSubjects, groqResults)
  } catch (err) {
    groqError = err.message || String(err)
  }

  return {
    repairedSubjects: lowConfidenceSubjects,
    repairLog,
    groqCalled: true,
    groqError,
    executionTimeMs: Date.now() - startTime
  }
}

/**
 * Legacy entry point for backward compatibility.
 * Maps old repairWithGroq(rawText, contract) signature to new verifier.
 */
const repairWithGroq = async (rawText, validatedObject) => {
  if (!validatedObject) return validatedObject
  const contract = JSON.parse(JSON.stringify(validatedObject))
  if (!contract.metadata) contract.metadata = {}

  const shouldVerify = contract.metadata?.shouldUseGroq === true ||
                       (contract.confidence !== undefined && contract.confidence < 90)

  if (!shouldVerify) {
    contract.metadata.groqSkipped = true
    contract.metadata.skipReason = 'HIGH_CONFIDENCE'
    return contract
  }

  // In legacy mode, send all subjects as low-confidence
  const tableText = contract.metadata?.isolatedTableText || rawText.substring(0, 3000)
  const result = await verifyWithGroq(tableText, contract.subjects || [])

  contract.metadata.groqRepair = result.groqCalled
  contract.metadata.groqSkipped = !result.groqCalled
  contract.metadata.repairSuccessful = result.groqCalled && !result.groqError
  contract.metadata.repairedFields = result.repairLog
  contract.metadata.groqError = result.groqError || null
  contract.source = result.groqCalled ? 'Groq' : contract.source

  return contract
}

module.exports = {
  verifyWithGroq,
  repairWithGroq,        // Legacy compat
  buildGroqPrompt,
  callGroqVerify,
  parseGroqResponse,
  mergeVerifications
}
