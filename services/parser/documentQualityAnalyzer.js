/**
 * Document Quality Analyzer
 *
 * Analyzes OCR-extracted text quality BEFORE parsing begins.
 * Returns a quality rating and diagnostic metrics so the pipeline can:
 *   - Warn users of poor scan quality
 *   - Reject only truly unreadable documents
 *   - Adjust parser confidence expectations
 *
 * Operates purely on extracted text — no image processing required.
 * This avoids the need for sharp/jimp dependencies while still
 * providing useful quality signals.
 *
 * Quality Ratings:
 *   EXCELLENT — Clean digital PDF, high text density, structured layout
 *   GOOD      — Minor OCR artifacts, all critical data present
 *   FAIR      — Notable artifacts, some fields may need Groq verification
 *   POOR      — Heavy noise, low density, many broken lines
 *   REJECT    — Completely unreadable, < MIN_CHAR_THRESHOLD characters
 */

const MIN_CHAR_THRESHOLD = 30        // Below this → REJECT
const MIN_LINES_THRESHOLD = 3        // Below this → REJECT
const HIGH_NOISE_RATIO = 0.40        // > 40% noise chars → POOR
const MEDIUM_NOISE_RATIO = 0.20      // > 20% noise chars → FAIR
const LOW_DENSITY_RATIO = 0.30       // < 30% meaningful chars → POOR

/**
 * Estimates OCR text density: ratio of printable alphanumeric chars
 * to total chars (higher is cleaner).
 *
 * @param {string} text
 * @returns {number} 0.0–1.0
 */
const estimateTextDensity = (text) => {
  if (!text || text.length === 0) return 0
  const printable = (text.match(/[A-Za-z0-9]/g) || []).length
  return printable / text.length
}

/**
 * Estimates OCR noise ratio: proportion of clearly garbled characters
 * (control chars, replacement chars, random symbol clusters).
 *
 * @param {string} text
 * @returns {number} 0.0–1.0
 */
const estimateNoiseRatio = (text) => {
  if (!text || text.length === 0) return 1
  // Characters that should NOT appear in any academic transcript
  const noiseChars = (text.match(/[^\x20-\x7E\n\r\t]/g) || []).length
  return noiseChars / text.length
}

/**
 * Checks for structural signals that a real academic table is present.
 * Returns a score 0–5 (higher = more confident table exists).
 *
 * @param {string[]} lines
 * @returns {number}
 */
const detectTableStructureScore = (lines) => {
  let score = 0
  const joined = lines.join(' ').toLowerCase()

  // Has table header keywords
  if (/\b(course\s*code|subject|credits?|grade|result|s\.?no)\b/.test(joined)) score += 2

  // Has at least 3 lines with digits (likely rows)
  const linesWithDigits = lines.filter(l => /\d/.test(l))
  if (linesWithDigits.length >= 3) score += 1
  if (linesWithDigits.length >= 6) score += 1

  // Has potential course code patterns
  if (/\b[A-Za-z0-9]{5,12}\b/.test(joined)) score += 1

  return score
}

/**
 * Counts lines that appear to be completely garbled OCR output.
 * A garbled line has very short average word length or >50% non-alpha chars.
 *
 * @param {string[]} lines
 * @returns {number}
 */
const countGarbledLines = (lines) => {
  return lines.filter(line => {
    if (line.length < 3) return false
    const words = line.split(/\s+/).filter(w => w.length > 0)
    if (words.length === 0) return false
    const avgWordLen = words.reduce((s, w) => s + w.length, 0) / words.length
    const alphaRatio = (line.match(/[A-Za-z]/g) || []).length / line.length
    return avgWordLen < 2 || alphaRatio < 0.20
  }).length
}

/**
 * Main document quality analysis function.
 *
 * @param {string} rawText - Full raw OCR/PDF text
 * @param {string} mimeType - File MIME type
 * @param {Object} classifierResult - Document classifier result
 * @returns {{
 *   quality: 'EXCELLENT'|'GOOD'|'FAIR'|'POOR'|'REJECT',
 *   shouldReject: boolean,
 *   metrics: Object,
 *   warnings: string[]
 * }}
 */
const analyzeDocumentQuality = (rawText, mimeType, classifierResult = null) => {
  const warnings = []

  // Guard: empty text
  if (!rawText || typeof rawText !== 'string') {
    return {
      quality: 'REJECT',
      shouldReject: true,
      metrics: { charCount: 0, lineCount: 0 },
      warnings: ['No text could be extracted from the document.']
    }
  }

  const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0)
  const charCount = rawText.replace(/\s/g, '').length
  const lineCount = lines.length

  // Hard reject: completely empty
  if (charCount < MIN_CHAR_THRESHOLD || lineCount < MIN_LINES_THRESHOLD) {
    return {
      quality: 'REJECT',
      shouldReject: true,
      metrics: { charCount, lineCount, textDensity: 0, noiseRatio: 1 },
      warnings: ['Document appears to be blank or completely unreadable.']
    }
  }

  const textDensity    = estimateTextDensity(rawText)
  const noiseRatio     = estimateNoiseRatio(rawText)
  const structureScore = detectTableStructureScore(lines)
  const garbledLines   = countGarbledLines(lines)
  const garbledRatio   = garbledLines / Math.max(lineCount, 1)
  const isDigitalPDF   = classifierResult?.documentType === 'DIGITAL_PDF'

  const metrics = {
    charCount,
    lineCount,
    textDensity: parseFloat(textDensity.toFixed(3)),
    noiseRatio: parseFloat(noiseRatio.toFixed(3)),
    structureScore,
    garbledLines,
    garbledRatio: parseFloat(garbledRatio.toFixed(3)),
    isDigitalPDF
  }

  // Build warnings
  if (noiseRatio > MEDIUM_NOISE_RATIO) {
    warnings.push(`High OCR noise detected (${(noiseRatio * 100).toFixed(1)}% of characters are garbled).`)
  }
  if (textDensity < LOW_DENSITY_RATIO) {
    warnings.push(`Low text density (${(textDensity * 100).toFixed(1)}%) — scan may be blurred or rotated.`)
  }
  if (garbledRatio > 0.3) {
    warnings.push(`${(garbledRatio * 100).toFixed(0)}% of lines appear garbled — consider re-uploading a cleaner image.`)
  }
  if (structureScore < 2) {
    warnings.push('Could not detect a clear academic table structure in the document.')
  }

  // Quality rating logic
  let quality

  if (isDigitalPDF && noiseRatio < 0.05 && textDensity > 0.50 && structureScore >= 3) {
    quality = 'EXCELLENT'
  } else if (noiseRatio < MEDIUM_NOISE_RATIO && textDensity > 0.35 && structureScore >= 2) {
    quality = 'GOOD'
  } else if (noiseRatio < HIGH_NOISE_RATIO && structureScore >= 1) {
    quality = 'FAIR'
  } else if (charCount >= MIN_CHAR_THRESHOLD && lineCount >= MIN_LINES_THRESHOLD) {
    quality = 'POOR'
  } else {
    quality = 'REJECT'
  }

  // Reject only truly unreadable — POOR is not rejected
  const shouldReject = quality === 'REJECT'

  return { quality, shouldReject, metrics, warnings }
}

module.exports = {
  analyzeDocumentQuality,
  estimateTextDensity,
  estimateNoiseRatio,
  detectTableStructureScore
}
