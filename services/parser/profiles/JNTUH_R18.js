/**
 * JNTUH R18 Regulation Parser Profile
 * Covers JNTU Hyderabad, R18 regulation (2018–2022).
 * Course codes: 18CS0401, 18EC0101 etc.
 */
const JNTUH_R18 = {
  id: 'JNTUH_R18',
  university: 'JNTUH',
  universityName: 'Jawaharlal Nehru Technological University Hyderabad',
  regulation: 'R18',
  semesterPattern: 'ROMAN_DASH',
  gradeScale: '10_POINT_LETTER',
  creditRange: [0, 6],

  courseCodePattern: /\b1[89][A-Za-z0-9]{2,4}[0-9A-Za-z]{3,4}\b/,
  courseCodeMinLength: 7,
  courseCodeMaxLength: 12,

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

  pointToGrade: Object.freeze({
    10: 'O', 9: 'A+', 8: 'A', 7: 'B+', 6: 'B', 5: 'C', 4: 'P', 0: 'F'
  }),

  detectionSignals: [
    /jntuh/i,
    /r18/i,
    /r-18/i,
    /\b1[89][A-Za-z0-9]{5,8}\b/
  ],

  tableHeaders: ['course code', 'subject', 'credits', 'grade', 's.no', 'sl.no'],
  tableFooters: ['sgpa', 'cgpa', 'earned credits', 'controller', 'verified by'],

  noisePatterns: [
    /jawaharlal\s*nehru/i,
    /jntu/i,
    /r18\s*regulation/i
  ]
}

module.exports = JNTUH_R18
