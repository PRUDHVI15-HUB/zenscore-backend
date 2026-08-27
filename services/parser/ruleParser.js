/**
 * Rule Parser — Course-Code Anchor Strategy (v3.1.0)
 *
 * Hardened production version. Key improvements over v3.0:
 *
 * HARDENING:
 *  - Strip table border artifacts (│, ═, ─, ●, ▪, ·) before tokenizing
 *  - OCR map '0'→'O' removed (too dangerous — 0 is a valid grade point)
 *  - 'red|' pipe artifact in OCR list normalized before comparison
 *  - Number stripping preserves Roman numeral suffixes (II, III, IV) in subject names
 *  - Grade token scanner uses strict integer check (not parseInt which accepts "10abc")
 *  - Credit token scanner de-prioritizes tokens that appear before grade (correct order)
 *  - Lookback for wrapped names now scans up to 2 previous lines (not just 1)
 *  - Empty/null/undefined tokens are filtered before processing
 *  - All try/catch guards on each subject row — a single bad line never crashes the loop
 *  - Parser version bumped to 3.1.0
 *
 * PRESERVED:
 *  - Course-code anchor strategy (proven accurate)
 *  - Profile-driven parsing
 *  - Fuzzy credit mapping
 *  - Grade point integer trust priority
 *  - Backward-compatible parseRules() signature
 */
const { LAYOUTS, DEFAULT_PIPELINE_STATE, SEMESTER_LABELS } = require('./utils/constants')
const { REGEX } = require('./utils/regex')
const { cleanText, isNoiseLine } = require('./utils/cleanText')
const { createSubject, resetIdCounter } = require('./utils/subjectFactory')

const PARSER_VERSION = '3.1.0'

// ─── Course Code Detection ────────────────────────────────────────────────────

/**
 * Checks if a word token looks like a course code.
 * Broad heuristics — profile-specific validation occurs after detection.
 */
const isCourseCode = (word) => {
  if (!word || typeof word !== 'string') return false
  const clean = word.replace(/^[|\[\]\(\)\s●▪·─═│\.,;:'"€\$¢®§]+|[|\[\]\(\)\s●▪·─═│\.,;:'"€\$¢®§]+$/g, '').trim()
  if (clean.length < 5 || clean.length > 12) return false

  const lower = clean.toLowerCase()
  const excluded = ['semester', 'sem', 'year', 'exam', 'grade', 'gpa', 'roll', 'date', 'page', 'point', 'p0int', 'ects', 'l0ects', 'loects']
  if (excluded.some(kw => lower.includes(kw))) return false

  if (!/\d/.test(clean)) return false
  if (!/[a-zA-Z]/.test(clean)) return false
  if (/[^a-zA-Z0-9\-_]/.test(clean)) return false

  const digitCount = (clean.match(/\d/g) || []).length
  if (digitCount >= 2) return true

  // Handle single-digit OCR misreads of course codes (e.g. 22CS409PC read as 2zcsaoorc)
  if (digitCount === 1) {
    if (/^\d[a-z0-9]{5,10}$/i.test(clean) || /[a-z]{2}\d/i.test(clean) || /\d[a-z]{2}/i.test(clean)) {
      return true
    }
  }

  return false
}

/**
 * Strips table border artifacts from a line before tokenizing.
 * These are common in OCR of printed grade card tables.
 */
const stripBorderArtifacts = (line) => {
  return line
    .replace(/[│║╪╫╬═─┼┤├┬┴┘└┐┌╔╗╚╝╠╣╦╩╬▪●·]/g, ' ')
    .replace(/\|/g, ' ')           // Pipe chars are table borders
    .replace(/\s{2,}/g, ' ')      // Collapse multiple spaces
    .trim()
}

// ─── Grade & Credit Token Parsing ────────────────────────────────────────────

const GRADE_LETTERS = new Set(['O', 'S', 'A+', 'A', 'B+', 'B', 'C', 'P', 'F'])

/**
 * OCR confusion mappings for grade letters.
 * Note: '0'→'O' deliberately REMOVED — 0 is a valid grade point (fail),
 * mapping it to 'O' (10 points) would cause catastrophic grade corruption.
 */
const GRADE_OCR_MAP = Object.freeze({
  'ALS': 'A',
  'AL': 'A',
  'A+.': 'A+',
  'O.': 'O',
  'B+.': 'B+'
})

/**
 * Strictly parses an integer from a token string.
 * Returns null if the token contains any non-digit characters (unlike parseInt).
 * This prevents "10abc" or "300" from being treated as grade 10 or 300.
 *
 * @param {string} token
 * @returns {number|null}
 */
const strictParseInt = (token) => {
  if (!/^\d+$/.test(token)) return null
  return parseInt(token, 10)
}

/**
 * Determines whether a token (by position) likely belongs to the grade/credit
 * section rather than the subject name.
 */
const isGradeOrCreditToken = (token, idx, total) => {
  if (!token) return false
  // Only consider tokens in the last 5 positions
  if (idx < total - 5) return false

  // Strip any residual pipe/artifact prefix
  const clean = token.replace(/^[|\s]+/, '')

  // Strict integer check for grade points
  const asInt = strictParseInt(clean)
  if (asInt !== null) return true

  // Decimal credit notation (3.00, 1.00)
  if (/^\d+\.\d+$/.test(clean)) return true

  // Letter grade
  const upper = clean.toUpperCase()
  if (GRADE_LETTERS.has(upper) || GRADE_OCR_MAP[upper]) return true

  // Known OCR confusion strings (strip trailing | artifacts before checking)
  const lower = clean.toLowerCase().replace(/\|+$/, '')
  const knownOCR = ['als', 'al', 'wo', 'so', 'soo', 'red', '000', '100', '200', '300', '400']
  if (knownOCR.includes(lower)) return true

  return false
}

/**
 * Extracts raw grade letter and integer grade point from trailing tokens.
 * Trusts integer grade point over letter (more reliable in JNTU OCR).
 */
const parseGradeTokens = (tokens, profile) => {
  if (!tokens || tokens.length === 0) {
    return { rawGrade: '', finalGrade: null, gradePointFound: false, gradeLetterFound: false }
  }

  const pointToGrade = (profile && profile.pointToGrade)
    ? profile.pointToGrade
    : { 10: 'O', 9: 'A+', 8: 'A', 7: 'B+', 6: 'B', 5: 'C', 4: 'P', 0: 'F' }
  const gradeMap = (profile && profile.gradeMap) ? profile.gradeMap : {}

  let gradePointToken = null
  let gradeLetterToken = null

  // Pass 1: Find integer grade point (0 = fail, 4–10 = valid range)
  for (const token of tokens) {
    if (!token) continue
    const clean = token.replace(/^[|\s]+/, '')
    const num = strictParseInt(clean)
    if (num !== null && (num === 0 || (num >= 4 && num <= 10))) {
      gradePointToken = num
      break
    }
  }

  // Pass 2: Find letter grade
  for (const token of tokens) {
    if (!token) continue
    const upper = token.replace(/^[|\s]+/, '').toUpperCase()
    if (GRADE_LETTERS.has(upper)) {
      gradeLetterToken = upper
      break
    }
    if (GRADE_OCR_MAP[upper]) {
      gradeLetterToken = GRADE_OCR_MAP[upper]
      break
    }
  }

  let rawGrade = ''
  let finalGrade = null
  let gradePointFound = false
  let gradeLetterFound = false

  if (gradePointToken !== null) {
    finalGrade = gradePointToken
    rawGrade = pointToGrade[gradePointToken] || gradeLetterToken || String(gradePointToken)
    gradePointFound = true
    gradeLetterFound = gradeLetterToken !== null
  } else if (gradeLetterToken !== null) {
    rawGrade = gradeLetterToken
    finalGrade = gradeMap[gradeLetterToken] !== undefined ? gradeMap[gradeLetterToken] : null
    gradeLetterFound = true
  } else if (tokens.length > 0) {
    // Nothing recognizable — store first token as raw, leave finalGrade null
    rawGrade = String(tokens[0]).trim()
  }

  return { rawGrade, finalGrade, gradePointFound, gradeLetterFound }
}

/**
 * Fuzzy credit parser. Handles OCR decimal noise and alphanumeric misreads.
 */
const parseCredits = (creditStr, courseName, creditRange = [0, 6]) => {
  const [minC, maxC] = creditRange

  if (!creditStr || typeof creditStr !== 'string') {
    return useHeuristic(courseName)
  }

  // Strip trailing pipe artifacts before cleaning
  const raw = creditStr.replace(/\|+$/, '').trim()
  const clean = raw.toLowerCase().replace(/[^a-z0-9.]/g, '')

  if (!clean) return useHeuristic(courseName)

  // Exact decimal mappings (OCR reads "3.00" → 3)
  const decimalMap = {
    '300': 3, '30': 3, '3.00': 3, '3.0': 3,
    '200': 2, '20': 2, '2.00': 2, '2.0': 2,
    '1.5': 1.5, '1.50': 1.5, '15': 1.5, '100': 1, '10': 1, '1.00': 1, '1.0': 1,
    '000': 0, '00': 0, '0.00': 0, '0.0': 0,
    '400': 4, '40': 4, '4.00': 4,
    '500': 5, '50': 5, '5.00': 5,
    '600': 6, '60': 6, '6.00': 6
  }
  if (decimalMap[clean] !== undefined) {
    return { credits: decimalMap[clean], usedFuzzyCredit: false, usedCreditHeuristic: false }
  }

  // OCR word-confusion strings
  const ocrMap = {
    'wo': 3, 'so': 3, 'soo': 3,
    'red': 1,
    'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6, 'one': 1, 'zero': 0
  }
  if (ocrMap[clean] !== undefined) {
    return { credits: ocrMap[clean], usedFuzzyCredit: true, usedCreditHeuristic: false }
  }

  // Plain integer
  const intMatch = clean.match(/^(\d+(?:\.\d+)?)$/)
  if (intMatch) {
    const val = parseFloat(intMatch[1])
    if (val >= minC && val <= maxC) {
      return { credits: val, usedFuzzyCredit: false, usedCreditHeuristic: false }
    }
  }

  // Plain decimal
  const decMatch = clean.match(/^(\d+)\.(\d+)$/)
  if (decMatch) {
    const val = Math.round(parseFloat(`${decMatch[1]}.${decMatch[2]}`))
    if (val >= minC && val <= maxC) {
      return { credits: val, usedFuzzyCredit: true, usedCreditHeuristic: false }
    }
  }

  return useHeuristic(courseName)
}

/**
 * Name-based credit heuristic (last resort).
 */
const useHeuristic = (courseName) => {
  const lower = (courseName || '').toLowerCase()
  let credits = 3
  if (/\b(?:lab|practical|seminar|viva|workshop|drawing)\b/.test(lower)) credits = 1
  else if (/\bproject\b/.test(lower)) credits = 2
  return { credits, usedFuzzyCredit: false, usedCreditHeuristic: true }
}

// ─── Name Noise Filter ────────────────────────────────────────────────────────

const NOISE_NAME_PATTERN = /branch|campus|autonomous|grade[\s_]*card|serial|roll|hall|ticket|exam|university|college|page\s*\d|date:|gpa|marksheet|transcript|medium[\s_]*of|verified|controller|authorized/i

const isNoiseName = (name) => {
  if (!name || typeof name !== 'string') return true
  if (name.trim().length < 2) return true
  return NOISE_NAME_PATTERN.test(name)
}

/**
 * Cleans a course name by removing:
 * - Standalone single digits (OCR number artifacts)
 * - Table border chars
 * - Trailing punctuation
 *
 * PRESERVES Roman numerals (II, III, IV) and subject codes in names.
 */
const cleanCourseName = (name) => {
  if (!name) return ''
  return name
    .replace(/[│║═─●▪·]/g, ' ')        // Border artifacts
    .replace(/\b\d{1}\b/g, '')          // Single-digit OCR artifacts only (not 2+ digit sequences)
    .replace(/[:\-,./]+$/, '')          // Trailing punctuation
    .replace(/\s{2,}/g, ' ')            // Collapse spaces
    .trim()
}

// ─── Semester Extraction ──────────────────────────────────────────────────────

const extractSemesterCandidates = (lines) => {
  const romanDashMap = {
    'i-i': 1, 'i-ii': 2,
    'ii-i': 3, 'ii-ii': 4,
    'iii-i': 5, 'iii-ii': 6,
    'iv-i': 7, 'iv-ii': 8
  }
  const romanMap = { i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8 }
  const candidates = []

  for (const line of lines) {
    try {
      if (!line || typeof line !== 'string') continue
      const lower = line.toLowerCase()

      // 1. JNTU roman-dash format (most specific — check first: I-I, II-II, IV-I, etc.)
      const rdMatch = lower.match(/\b(iv|iii|ii|i)\s*-\s*(ii|i)\b/)
      if (rdMatch) {
        const key = `${rdMatch[1]}-${rdMatch[2]}`
        const val = romanDashMap[key]
        if (val && !candidates.some(c => c.num === val)) {
          candidates.push({ num: val, label: key.toUpperCase() })
        }
        continue
      }

      // 2. Degree / Header + Roman (e.g. "BTECH IV SEMESTER", "IV SEMESTER", "SEMESTER IV")
      const rMatch = lower.match(/\b(iv|vi{0,2}|i{1,3})\s+(?:semester|sem)\b/) ||
                     lower.match(/\b(?:semester|sem)\s+(iv|vi{0,2}|i{1,3})\b/)
      if (rMatch) {
        const val = romanMap[rMatch[1]]
        if (val && !candidates.some(c => c.num === val)) {
          candidates.push({ num: val, label: rMatch[1].toUpperCase() })
        }
        continue
      }

      // 3. Numeric semester (e.g. "4th Semester", "Semester 4")
      const numMatch = lower.match(/\b(?:semester|sem)\s*([1-8])\b/) ||
                      lower.match(/\b([1-8])\s*(?:st|nd|rd|th)?\s+(?:semester|sem)\b/)
      if (numMatch) {
        const val = parseInt(numMatch[1], 10)
        if (val >= 1 && val <= 8 && !candidates.some(c => c.num === val)) {
          const romanLabels = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII']
          candidates.push({ num: val, label: romanLabels[val - 1] })
        }
      }
    } catch {
      // Skip unparseable lines
    }
  }

  return candidates
}

// ─── Duplicate Detection ──────────────────────────────────────────────────────

const flagDuplicates = (subjects) => {
  const nameCount = new Map()

  // Count occurrences
  subjects.forEach(sub => {
    const key = (sub.name || '').toLowerCase().trim()
    nameCount.set(key, (nameCount.get(key) || 0) + 1)
  })

  // Tag duplicates
  subjects.forEach(sub => {
    const key = (sub.name || '').toLowerCase().trim()
    if (nameCount.get(key) > 1) {
      sub.duplicate = true
      sub.duplicateGroup = sub.name
    } else {
      sub.duplicate = false
      sub.duplicateGroup = null
    }
  })
}

// ─── Core Parsing Loop ────────────────────────────────────────────────────────

const extractSubjectsFromTable = (tableLines, profile) => {
  const subjects = []
  const parsingIssues = []
  const confidenceContexts = []

  for (let i = 0; i < tableLines.length; i++) {
    try {
      const rawLine = tableLines[i]
      if (!rawLine || typeof rawLine !== 'string') continue

      // Strip border artifacts before any processing
      const line = stripBorderArtifacts(rawLine)

      if (!line || line.length < 3) continue
      if (isNoiseLine(line)) continue
      if (REGEX.tableHeader.test(line)) continue
      if (REGEX.tableFooter.test(line)) break  // Stop at footer (safety net)

      // Find course code within first 15 chars
      const words = line.split(/\s+/).filter(w => w.length > 0)
      let foundCode = null

      for (const w of words) {
        if (isCourseCode(w)) {
          const clean = w.replace(/^[|\[\]\s●▪·─═│]+|[|\[\]\s●▪·─═│]+$/g, '')
          const idx = line.indexOf(clean)
          if (idx <= 15) {
            foundCode = clean
            break
          }
        }
      }

      if (!foundCode) continue

      // Extract text after course code
      const codeIdx = line.indexOf(foundCode)
      const afterCode = line.substring(codeIdx + foundCode.length)

      // Clean and tokenize — preserve decimal notation
      const cleanAfter = afterCode
        .replace(/[|\[\]\/:\-═─│]/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim()
      const tokens = cleanAfter.split(' ').filter(t => t && t.length > 0)

      // Find name/grade boundary
      let boundaryIdx = tokens.length
      for (let j = 0; j < tokens.length; j++) {
        if (isGradeOrCreditToken(tokens[j], j, tokens.length)) {
          boundaryIdx = j
          break
        }
      }

      const nameWords     = tokens.slice(0, boundaryIdx)
      const trailingTokens = tokens.slice(boundaryIdx)

      let courseName = cleanCourseName(nameWords.join(' '))
      if (isNoiseName(courseName)) continue

      // Lookback: recover wrapped name from up to 2 previous lines
      let usedNameFragment = false

      if (courseName.length < 8 || nameWords.length < 2) {
        for (let lookBack = 1; lookBack <= 2; lookBack++) {
          const prevIdx = i - lookBack
          if (prevIdx < 0) break

          const prevRaw = tableLines[prevIdx]
          if (!prevRaw) break

          const prevLine = stripBorderArtifacts(prevRaw).trim()
          if (prevLine.length <= 3) continue

          const prevWords = prevLine.split(/\s+/)
          const prevHasCode = prevWords.some(w => isCourseCode(w))

          // Stop lookback at table headers, footers, or another subject row
          const prevIsHeader = REGEX.tableHeader.test(prevLine)
          const prevIsFooter = REGEX.tableFooter.test(prevLine)
          const prevIsNoise  = /semester|sem|term|roll|hall|ticket|exam|university|college|page|date|gpa|marksheet|transcript|course\s*code|subject\s*name|sl\.no|s\.no|serial\s*no/i.test(prevLine)

          if (prevHasCode || prevIsHeader || prevIsFooter || prevIsNoise) break

          // Valid fragment — prepend
          courseName = (prevLine + ' ' + courseName).trim()
          courseName = cleanCourseName(courseName)
          usedNameFragment = true
          break
        }
      }

      if (!courseName || courseName.length < 2) {
        parsingIssues.push({ line: i + 1, reason: 'Empty subject name after cleaning', rawLine })
        continue
      }

      // Parse grade
      let { rawGrade, finalGrade, gradePointFound, gradeLetterFound } = parseGradeTokens(trailingTokens, profile)

      // Lookahead: if grade was missing on current line, check next line for grade/credit continuation tokens
      let consumedNextLine = false
      if (!gradePointFound && !gradeLetterFound && i + 1 < tableLines.length) {
        const nextRaw = tableLines[i + 1]
        if (nextRaw && typeof nextRaw === 'string') {
          const nextLine = stripBorderArtifacts(nextRaw).trim()
          const nextWords = nextLine.split(/\s+/).filter(w => w.length > 0)
          const nextHasCode = nextWords.some(w => isCourseCode(w))

          const nextIsHeader = REGEX.tableHeader.test(nextLine)
          const nextIsFooter = REGEX.tableFooter.test(nextLine)
          const nextIsNoise  = /semester|sem|term|roll|hall|ticket|exam|university|college|page|date|gpa|marksheet|transcript|course\s*code|subject\s*name/i.test(nextLine)

          if (!nextHasCode && !nextIsHeader && !nextIsFooter && !nextIsNoise && nextLine.length > 0) {
            const nextClean = nextLine.replace(/[|\[\]\/:\-═─│]/g, ' ').replace(/\s{2,}/g, ' ').trim()
            const nextTokens = nextClean.split(' ').filter(t => t && t.length > 0)
            const nextGradeRes = parseGradeTokens(nextTokens, profile)

            if (nextGradeRes.gradePointFound || nextGradeRes.gradeLetterFound) {
              rawGrade = nextGradeRes.rawGrade
              finalGrade = nextGradeRes.finalGrade
              gradePointFound = nextGradeRes.gradePointFound
              gradeLetterFound = nextGradeRes.gradeLetterFound
              trailingTokens.push(...nextTokens)
              consumedNextLine = true
            }
          }
        }
      }

      // Parse credits — look from end of trailing tokens, skip grade token
      let rawCredits = null
      for (let k = trailingTokens.length - 1; k >= 0; k--) {
        const tok = (trailingTokens[k] || '').replace(/\|+$/, '').trim()
        if (!tok) continue
        // Skip if this IS the grade token
        if (tok.toUpperCase() === rawGrade.toUpperCase()) continue
        // Accept if it looks like a credit token
        const tokLower = tok.toLowerCase()
        const creditOCR = ['wo', 'so', 'soo', 'red', '000', '100', '200', '300', '400']
        if (/\d/.test(tok) || creditOCR.includes(tokLower)) {
          rawCredits = tok
          break
        }
      }
      // If still null and there are multiple trailing tokens, try last position
      if (!rawCredits && trailingTokens.length > 1) {
        rawCredits = trailingTokens[trailingTokens.length - 1]
      }

      const { credits, usedFuzzyCredit, usedCreditHeuristic } = parseCredits(
        rawCredits, courseName, profile?.creditRange || [0, 6]
      )

      if (!gradePointFound && !gradeLetterFound) {
        parsingIssues.push({ line: i + 1, reason: 'No grade found', rawLine })
      }

      // Build subject
      const subject = createSubject({
        name: courseName,
        rawCredits,
        rawGrade,
        confidence: 0,
        originalLine: rawLine
      })
      subject.code = foundCode
      subject.credits = credits
      subject.finalGrade = finalGrade

      subjects.push(subject)
      confidenceContexts.push({
        usedNameFragment,
        usedCreditHeuristic,
        usedFuzzyCredit,
        gradePointFound,
        gradeLetterFound
      })

      if (consumedNextLine) {
        i++
      }

    } catch (rowErr) {
      // Never crash the loop — log and continue
      parsingIssues.push({
        line: i + 1,
        reason: `Unexpected error: ${rowErr.message}`,
        rawLine: tableLines[i]
      })
    }
  }

  return { subjects, parsingIssues, confidenceContexts }
}

// ─── Main Entry Point ─────────────────────────────────────────────────────────

const parseRules = (tableLines, rawText, profile) => {
  // Legacy call signature support: parseRules(rawText)
  if (typeof tableLines === 'string' && !rawText) {
    const legacyText = tableLines
    const legacyLines = legacyText.split('\n').map(l => l.trim()).filter(l => l.length > 0)
    const AUTONOMOUS = require('./profiles/AUTONOMOUS')
    return parseRules(legacyLines, legacyText, AUTONOMOUS)
  }

  if (!tableLines || tableLines.length === 0) {
    return buildEmptyResult(profile)
  }

  resetIdCounter()

  const allLines = (rawText || '')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0)

  let semesterCandidates = extractSemesterCandidates(allLines.length > 0 ? allLines : tableLines)
  let semesterNumber     = semesterCandidates.length > 0 ? semesterCandidates[0].num : null
  let semesterLabel      = semesterCandidates.length > 0 ? semesterCandidates[0].label : (semesterNumber ? SEMESTER_LABELS[semesterNumber] : null)

  const { subjects, parsingIssues, confidenceContexts } = extractSubjectsFromTable(tableLines, profile)

  // Fallback: If top header scanning missed semester number due to OCR blur/crop, infer from course code digits
  if (!semesterNumber && subjects.length > 0) {
    const codeDigits = subjects
      .map(s => s.code ? (s.code.match(/22[A-Z]{2}(\d)/i)?.[1] || s.code.match(/[A-Z]{2}(\d)\d{2}/i)?.[1]) : null)
      .filter(Boolean)
    if (codeDigits.length > 0) {
      const counts = {}
      codeDigits.forEach(d => counts[d] = (counts[d] || 0) + 1)
      const topDigit = parseInt(Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0], 10)
      if (topDigit >= 1 && topDigit <= 8) {
        semesterNumber = topDigit
        const romanLabels = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII']
        semesterLabel = romanLabels[topDigit - 1] || String(topDigit)
        semesterCandidates = [{ num: topDigit, label: semesterLabel }]
      }
    }
  }

  flagDuplicates(subjects)

  return {
    semesterNumber,
    semesterLabel,
    subjects,
    ...DEFAULT_PIPELINE_STATE,
    metadata: {
      profileId:           profile?.id       || 'UNKNOWN',
      university:          profile?.university || 'UNKNOWN',
      regulation:          profile?.regulation || 'UNKNOWN',
      totalLines:          tableLines.length,
      parsedSubjects:      subjects.length,
      failedSubjects:      parsingIssues.length,
      duplicateSubjects:   subjects.filter(s => s.duplicate).length,
      semesterCandidates,
      parsingIssues,
      confidenceContexts,
      parserVersion:       PARSER_VERSION
    }
  }
}

const buildEmptyResult = (profile) => ({
  semesterNumber: null,
  semesterLabel:  null,
  subjects:       [],
  ...DEFAULT_PIPELINE_STATE,
  metadata: {
    profileId:           profile?.id       || 'UNKNOWN',
    university:          profile?.university || 'UNKNOWN',
    regulation:          profile?.regulation || 'UNKNOWN',
    totalLines:          0,
    parsedSubjects:      0,
    failedSubjects:      0,
    duplicateSubjects:   0,
    semesterCandidates:  [],
    parsingIssues:       [],
    confidenceContexts:  [],
    parserVersion:       PARSER_VERSION
  }
})

module.exports = {
  parseRules,
  extractSemesterCandidates,
  isCourseCode,
  parseGradeTokens,
  parseCredits,
  PARSER_VERSION
}
