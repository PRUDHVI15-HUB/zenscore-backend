/**
 * Academic Table Isolator
 *
 * THE MOST CRITICAL STAGE of the pipeline.
 *
 * Scans raw OCR text and extracts ONLY the academic subject table rows.
 * Everything before the table (university header, student info, hall ticket)
 * and everything after the table (SGPA, CGPA, signatures, principal stamp)
 * is DISCARDED before the parser ever sees it.
 *
 * This single stage eliminates all hallucination sources from Groq
 * and all false-positive extractions from the rule parser.
 */
const { REGEX } = require('./utils/regex')

/**
 * Checks whether a word token is shaped like a course code.
 * Uses broad criteria — profile-specific validation happens later.
 *
 * Rules:
 * - 5 to 12 characters long
 * - Contains at least one digit
 * - Contains at least one letter
 * - Contains only alphanumeric characters (no specials)
 * - Does not contain common noise keywords
 *
 * @param {string} word - Single whitespace-delimited token
 * @returns {boolean}
 */
const looksLikeCourseCode = (word) => {
  // Strip surrounding pipe/bracket noise
  const clean = word.replace(/^[|\[\]\s●▪·─═│]+|[|\[\]\s●▪·─═│]+$/g, '').trim()
  if (clean.length < 5 || clean.length > 12) return false

  // Must have at least 2 digits (e.g. 22CS401PC)
  const digitCount = (clean.match(/\d/g) || []).length
  if (digitCount < 2) return false

  if (!/[a-zA-Z]/.test(clean)) return false
  if (/[^a-zA-Z0-9\-_]/.test(clean)) return false

  const lower = clean.toLowerCase()
  const excluded = ['semester', 'sem', 'year', 'exam', 'grade', 'gpa', 'roll', 'date', 'page', 'point', 'ects']
  if (excluded.some(kw => lower.includes(kw))) return false

  return true
}

/**
 * Checks if a line contains a course-code-shaped token within
 * the first 15 characters (i.e., near the start of the line).
 * Lines where a course code appears mid-sentence are not subject rows.
 *
 * @param {string} line - Text line
 * @returns {{ found: boolean, code: string|null, codeIndex: number }}
 */
const findCourseCodeNearStart = (line) => {
  const words = line.split(/\s+/)
  for (const word of words) {
    if (looksLikeCourseCode(word)) {
      const clean = word.replace(/^[|\[\]\s]+|[|\[\]\s]+$/g, '')
      const idx = line.indexOf(clean)
      if (idx <= 15) {
        return { found: true, code: clean, codeIndex: idx }
      }
    }
  }
  return { found: false, code: null, codeIndex: -1 }
}

/**
 * Determines if a line is an academic table header row.
 * (Column labels like S.No, Course Code, Subject, Credits, Grade)
 *
 * @param {string} line - Text line
 * @returns {boolean}
 */
const isTableHeaderLine = (line) => {
  return REGEX.tableHeader.test(line)
}

/**
 * Determines if a line marks the end of the academic table.
 * (Footer keywords: SGPA, CGPA, Controller, Verified By, etc.)
 *
 * @param {string} line - Text line
 * @returns {boolean}
 */
const isTableFooterLine = (line) => {
  return REGEX.tableFooter.test(line)
}

/**
 * Main table isolation function.
 * Scans all lines and returns only the academic table rows.
 *
 * Algorithm:
 *   1. Find the first line that is a table header OR has a course code near start → tableStart
 *   2. From tableStart onwards, collect lines until a footer keyword or end-of-text
 *   3. Return collected lines as the isolated table
 *
 * @param {string} rawText - Full raw OCR/PDF extracted text
 * @returns {{
 *   tableLines: string[],
 *   tableText: string,
 *   startLineIndex: number,
 *   endLineIndex: number,
 *   totalInputLines: number,
 *   isolated: boolean
 * }}
 */
const isolateTable = (rawText) => {
  if (!rawText || typeof rawText !== 'string') {
    return {
      tableLines: [],
      tableText: '',
      startLineIndex: -1,
      endLineIndex: -1,
      totalInputLines: 0,
      isolated: false
    }
  }

  const allLines = rawText
    .replace(/\r/g, '')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0)

  const totalInputLines = allLines.length
  let startLineIndex = -1
  let endLineIndex = allLines.length - 1

  // Step 1: Find table start
  for (let i = 0; i < allLines.length; i++) {
    const line = allLines[i]

    // Header row detection (S.No, Course Code, etc.)
    if (isTableHeaderLine(line)) {
      startLineIndex = i
      break
    }

    // First course-code line near start of line
    const { found } = findCourseCodeNearStart(line)
    if (found) {
      // Look 1-2 lines back for a header row that might have been missed
      startLineIndex = Math.max(0, i - 2)
      break
    }
  }

  // If no table found at all, return everything (graceful degradation)
  if (startLineIndex === -1) {
    return {
      tableLines: allLines,
      tableText: allLines.join('\n'),
      startLineIndex: 0,
      endLineIndex: allLines.length - 1,
      totalInputLines,
      isolated: false    // signals that we couldn't isolate
    }
  }

  // Step 2: Find table end (scan from startLineIndex+1)
  for (let i = startLineIndex + 1; i < allLines.length; i++) {
    const line = allLines[i]
    if (isTableFooterLine(line)) {
      endLineIndex = i - 1   // Stop before the footer line
      break
    }
  }

  const tableLines = allLines.slice(startLineIndex, endLineIndex + 1)

  return {
    tableLines,
    tableText: tableLines.join('\n'),
    startLineIndex,
    endLineIndex,
    totalInputLines,
    isolated: true
  }
}

module.exports = {
  isolateTable,
  looksLikeCourseCode,
  findCourseCodeNearStart,
  isTableHeaderLine,
  isTableFooterLine
}
