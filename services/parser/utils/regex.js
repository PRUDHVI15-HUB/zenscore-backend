/**
 * Regex patterns for the Transcript Intelligence Engine.
 *
 * v3.2 Critical Fixes:
 *  - tableHeader: removed 'pass', 'fail', 'status' — these appear in EVERY data row
 *    (the "P" status column) and were causing all subject rows to be SKIPPED
 *  - noise: removed 'examination' and 'b.tech' — these appear in "BTECH IV SEMESTER,R22"
 *    which is the only line containing the semester number
 *  - Added 'btech iv semester' / 'b.tech (?:i+v?|v?i+) semester' patterns to
 *    semester regex for JNTUH-style "BTECH IV SEMESTER,R22 REGULAR" lines
 *  - tableFooter: tightened to only stop on clear post-table lines
 */
const REGEX = {
  /**
   * Semester detection.
   * Handles:
   *  - JNTU roman-dash: I-I, II-I, IV-II, etc.
   *  - Ordinal: "1st Semester", "2nd Semester"
   *  - Numeric: "Semester 4", "Sem 3"
   *  - "BTECH IV SEMESTER,R22 REGULAR" (JNTUH grade card header)
   *  - "B.TECH III-I SEMESTER" style headers
   */
  semester: new RegExp(
    // JNTU roman-dash format: IV-I, II-II, III-I, etc.
    '(?:(?:iv|vi{0,2}|i{1,3})\\s*-\\s*(?:ii|i))\\b' +
    // "BTECH IV SEMESTER" / "B.TECH IV SEMESTER" header (JNTUH grade card)
    '|(?:b\\.?tech|m\\.?tech|b\\.?e|b\\.?sc)\\s+(?:iv|vi{0,2}|i{1,3})\\s+semester' +
    // Standard "Semester N" / "N Semester"
    '|(?:semester|sem|term)\\s*(?:-|\\s)?\\s*([1-8])\\b' +
    '|([1-8])\\s*(?:st|nd|rd|th)\\s*(?:semester|sem|term)' +
    // Roman before/after "semester"
    '|(?:semester|sem|term)\\s*(?:-|\\s)?\\s*\\b(iv|vi{0,2}|i{1,3})\\b' +
    '|\\b(iv|vi{0,2}|i{1,3})\\s*(?:semester|sem|term)',
    'i'
  ),

  /** Matches pure single-line grades */
  grade: /^(?:\b(A\+|B\+|[A-F|O|S])(?!\w)|\b\d{1,3}\s*%\b|\b\d{1,3}\s*\/\s*\d{2,4}\b|\b\d{1,2}(?:\.\d{1,2})?\b)$/i,

  /** Matches grades when found inline */
  inlineGrade: /(?:\b(A\+|B\+|[A-F|O|S])(?!\w)|\b\d{1,3}\s*%\b|\b\d{1,3}\s*\/\s*\d{2,4}\b|\b\d{1,2}(?:\.\d{1,2})?\b)/i,

  /** Matches pure single-line credits (0–6) */
  credits: /^\b([0-6])\b$/,

  /** Matches credits inline */
  inlineCredits: /(?:\b(?:credits|credit|cr|c)\s*:\s*([0-6])\b|\b([0-6])\s*(?:credits|credit|cr)\b|\b([0-6])\b)/i,

  /**
   * Academic table header line indicators.
   *
   * CRITICAL FIX: 'pass', 'fail', 'status', 'result' REMOVED.
   * These words appear in every data row (the status column shows "P" which
   * Tesseract OCR sometimes reads as "Pass") and were causing ALL subject rows
   * to be treated as header rows and skipped by the parser.
   *
   * Only match true column-label patterns that won't appear in data rows.
   */
  tableHeader: /\b(?:s\.?\s*no|sl\.?\s*no|course\s*code|subject\s*(?:name|code)|name\s*of\s*the\s*course|grade\s*secured|grade\s*point)\b/i,

  /**
   * Footer boundary — stops table collection.
   *
   * CRITICAL FIX: 'pass'/'fail' removed (present in data rows).
   * 'SGPA'/'CGPA' kept — these reliably signal end of table.
   */
  tableFooter: /\b(?:sgpa|cgpa|semester\s*grade\s*point\s*average|cumulative\s*grade\s*point|subjects?\s*registered|appeared|passed|controller\s*of\s*examinations|principal|verified\s*by|signature|medium\s*of\s*instruction)\b/i,

  /**
   * Noise metadata lines discarded from processing.
   *
   * CRITICAL FIX:
   *  - 'examination' REMOVED — "Examination : BTECH IV SEMESTER,R22 REGULAR"
   *    contains the semester number and must NOT be discarded
   *  - 'b.tech' and 'm.tech' REMOVED — same reason
   *  - 'autonomous' REMOVED — was killing profile detection signals
   *  - Tightened patterns to only discard truly irrelevant lines
   */
  noise: [
    /\broll\s*(?:no|number)\b/i,
    /\bhall\s*ticket\b/i,
    /\buniversity\s+(?:name|of)\b/i,          // Only "University of X" not all university mentions
    /\bregistration\s*(?:no|number)\b/i,
    /\bpage\s*\d\b/i,
    /\bmarksheet\b/i,
    /\btranscript\s*(?:number|id)\b/i,        // Only "Transcript ID", not all transcript mentions
    /\bfather'?s?\s*name\b/i,
    /\bmother'?s?\s*name\b/i,
    /\bstudent\s*name\b/i,
    /\bmedium\s*of\s*instruction\b/i,
    /\bgrade\s*card\b/i,
    /\bqr\s*code\b/i,
    /\bcontroller\s*of\s*examinations?\b/i,
    /\bprincipal\b/i,
    /\bverified\s*by\b/i,
    /\bsignature\b/i
  ]
}

module.exports = {
  REGEX
}
