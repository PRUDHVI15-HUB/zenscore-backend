/**
 * JNTUH R22 Regulation Parser Profile
 * Covers JNTU Hyderabad, R22 regulation (2022 onwards).
 * Course codes: 22CS401PC, 22ENA10MC, 22C5402PC (OCR variant)
 */
const JNTUH_R22 = {
  id: 'JNTUH_R22',
  university: 'JNTUH',
  universityName: 'Jawaharlal Nehru Technological University Hyderabad',
  regulation: 'R22',
  semesterPattern: 'ROMAN_DASH',           // I-I, I-II, II-I … IV-II
  gradeScale: '10_POINT_LETTER',           // O=10, A+=9, A=8, B+=7, B=6, C=5, P=4, F=0
  creditRange: [0, 6],                     // 0 allowed for audit/mandatory courses

  /**
   * Course code pattern for JNTUH R22.
   * Format: 2-digit year + 2-4 alphanumeric dept chars + 2-3 digits + 2 alphanumeric suffix
   * Handles OCR noise: digits replacing letters (S→5, O→0, etc.)
   */
  courseCodePattern: /\b[2-9][0-9][A-Za-z0-9]{2,4}[0-9A-Za-z]{2,3}[A-Za-z0-9]{2}\b/,

  /** Minimum course code length */
  courseCodeMinLength: 7,
  /** Maximum course code length */
  courseCodeMaxLength: 12,

  /** Grade letter → grade point mapping */
  gradeMap: Object.freeze({
    'O': 10, 'S': 10,
    'A+': 9,
    'A': 8,
    'B+': 7,
    'B': 6,
    'C': 5,
    'P': 4,
    'F': 0
  }),

  /** Grade point → letter grade mapping (for reconstruction from numeric) */
  pointToGrade: Object.freeze({
    10: 'O', 9: 'A+', 8: 'A', 7: 'B+', 6: 'B', 5: 'C', 4: 'P', 0: 'F'
  }),

  /** Signals in raw text that suggest this profile */
  detectionSignals: [
    /jntu\s*hyderabad/i,
    /jntuh/i,
    /r22/i,
    /autonomous/i,
    /\b22[A-Za-z0-9]{5,8}\b/   // R22-style course code
  ],

  /** Table header keywords for this university */
  tableHeaders: ['course code', 'subject', 'credits', 'grade', 's.no', 'sl.no'],

  /** Footer keywords that signal end of the academic table */
  tableFooters: ['sgpa', 'cgpa', 'earned credits', 'controller', 'verified by', 'principal'],

  /** Extra noise patterns specific to this university */
  noisePatterns: [
    /jawaharlal\s*nehru/i,
    /jntu/i,
    /university\s*college/i,
    /r22\s*regulation/i
  ]
}

module.exports = JNTUH_R22
