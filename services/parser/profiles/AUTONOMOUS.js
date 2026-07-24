/**
 * AUTONOMOUS Generic Parser Profile
 * Fallback profile for autonomous colleges and unrecognized universities.
 * Uses broad heuristics for course code detection and grade parsing.
 */
const AUTONOMOUS = {
  id: 'AUTONOMOUS',
  university: 'AUTONOMOUS',
  universityName: 'Autonomous College',
  regulation: 'UNKNOWN',
  semesterPattern: 'MIXED',        // Accepts both roman and arabic semester numbering
  gradeScale: '10_POINT_LETTER',
  creditRange: [0, 6],

  /**
   * Broad course code pattern: alphanumeric 5-12 chars containing both letters and digits.
   * Permissive by design — used as last resort.
   */
  courseCodePattern: /\b[A-Za-z0-9]{5,12}\b/,
  courseCodeMinLength: 5,
  courseCodeMaxLength: 12,

  gradeMap: Object.freeze({
    'O': 10, 'S': 10,
    'A+': 9,
    'A': 8,
    'B+': 7,
    'B': 6,
    'C': 5,
    'P': 4,
    'F': 0,
    // Percentage-based aliases
    'EX': 10, 'EXCELLENT': 10,
    'VG': 9, 'VERY GOOD': 9,
    'GOOD': 8,
    'PASS': 4,
    'FAIL': 0
  }),

  pointToGrade: Object.freeze({
    10: 'O', 9: 'A+', 8: 'A', 7: 'B+', 6: 'B', 5: 'C', 4: 'P', 0: 'F'
  }),

  detectionSignals: [],   // Matches everything when other profiles fail

  tableHeaders: ['subject', 'course', 'credits', 'grade', 'marks', 'result', 'status'],
  tableFooters: ['total', 'sgpa', 'cgpa', 'gpa', 'percentage', 'aggregate', 'principal'],

  noisePatterns: []
}

module.exports = AUTONOMOUS
