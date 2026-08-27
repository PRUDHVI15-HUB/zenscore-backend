/**
 * atsProvider.js
 * =========================================================================
 * Central Factory & Dispatcher for ATS Provider Integration.
 * Seamlessly manages Provider Abstraction, External API Execution,
 * Timeout Handling, and Deterministic Internal Fallback.
 *
 * Rules:
 *   - Provider Mode: Controlled via ATS_PROVIDER env var ('external' | 'internal' | 'auto').
 *   - Strict Honesty: Explicitly tags provider as 'external' or 'internal'. Never pretends internal score comes from external provider.
 *   - Zero Crash: Always returns a valid normalized ATS object even during complete external downtime.
 */

const externalAtsProvider = require('./externalAtsProvider')
const internalAtsProvider = require('./internalAtsProvider')

/**
 * Main dispatcher entry point for ATS Resume Analysis.
 *
 * @param {Object} params
 * @param {String} [params.filePath] - File path of uploaded resume
 * @param {String} [params.rawText] - Plain extracted text
 * @param {Object} params.parsedResume - Structured resume object (skills, summary, etc.)
 * @param {String} params.targetCareer - Canonical target career goal
 * @param {String} [params.jobDescription] - Optional target job description
 * @returns {Promise<Object>} Normalized ATS Analysis schema object
 */
async function analyzeResume({ filePath, rawText = '', parsedResume = {}, targetCareer = 'Full Stack Developer', jobDescription = null }) {
  const providerMode = (process.env.ATS_PROVIDER || 'auto').toLowerCase()

  // 1. Force Internal Provider if configured explicitly
  if (providerMode === 'internal') {
    return await internalAtsProvider.analyzeResume({ parsedResume, targetCareer, jobDescription })
  }

  // 2. Attempt External ATS Provider (if 'external' or 'auto')
  try {
    const externalResult = await externalAtsProvider.analyzeResume({
      filePath,
      rawText,
      parsedResume,
      targetCareer,
      jobDescription
    })

    if (externalResult.success && externalResult.analysis) {
      return {
        ...externalResult.analysis,
        provider: 'external',
        fallbackNotice: null
      }
    }

    console.warn('[ATSProvider] External ATS notice:', externalResult.error || 'Provider returned incomplete analysis.')
  } catch (err) {
    console.warn('[ATSProvider] External ATS execution error:', err?.message || err)
  }

  // 3. Fallback to Internal Deterministic ATS Engine
  const internalResult = await internalAtsProvider.analyzeResume({ parsedResume, targetCareer, jobDescription })

  return {
    ...internalResult,
    provider: 'internal',
    fallbackNotice: 'External ATS analysis unavailable. Showing ZenScore internal analysis.'
  }
}

module.exports = {
  analyzeResume
}
