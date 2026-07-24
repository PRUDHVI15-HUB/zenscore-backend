/**
 * Profile Detector
 * Analyzes OCR text signals to automatically select the best matching
 * university parser profile from the registry.
 *
 * Detection is signal-based: each profile declares detectionSignals (regex array).
 * The profile with the most matching signals wins.
 * If no signals match, the AUTONOMOUS fallback is returned.
 */
const { PROFILES, getFallbackProfile } = require('./profiles/profileRegistry')

/**
 * Detects the best matching university profile from raw/table text.
 *
 * @param {string} rawText - Full raw OCR text or isolated table text
 * @param {string[]} tableLines - Isolated table lines for additional signals
 * @returns {{ profile: Object, profileId: string, detectionConfidence: number }}
 */
const detectProfile = (rawText, tableLines = []) => {
  if (!rawText || typeof rawText !== 'string') {
    const fallback = getFallbackProfile()
    return { profile: fallback, profileId: fallback.id, detectionConfidence: 0 }
  }

  // Combine raw text + first 15 table lines for signal scanning
  const sampleText = rawText.substring(0, 2000) + '\n' + tableLines.slice(0, 15).join('\n')

  const scores = []

  for (const profile of PROFILES) {
    if (!profile.detectionSignals || profile.detectionSignals.length === 0) {
      // AUTONOMOUS fallback — score 0, used only when nothing else matches
      scores.push({ profile, score: 0 })
      continue
    }

    let matchCount = 0
    for (const signal of profile.detectionSignals) {
      if (signal.test(sampleText)) {
        matchCount++
      }
    }

    // Also check if course code pattern matches any word in first 50 lines
    const sampleLines = sampleText.split('\n').slice(0, 50)
    for (const line of sampleLines) {
      if (profile.courseCodePattern && profile.courseCodePattern.test(line)) {
        matchCount += 2  // Course code match is a strong signal
        break
      }
    }

    scores.push({ profile, score: matchCount })
  }

  // Sort by score descending — highest match wins
  scores.sort((a, b) => b.score - a.score)

  const best = scores[0]

  // If top score is 0 and only AUTONOMOUS has a score, return AUTONOMOUS
  if (best.score === 0) {
    const fallback = getFallbackProfile()
    return { profile: fallback, profileId: fallback.id, detectionConfidence: 0 }
  }

  // Detection confidence: ratio of matched signals vs total signals available
  const totalSignals = best.profile.detectionSignals?.length || 1
  const detectionConfidence = Math.min(100, Math.round((best.score / (totalSignals + 2)) * 100))

  return {
    profile: best.profile,
    profileId: best.profile.id,
    detectionConfidence
  }
}

module.exports = {
  detectProfile
}
