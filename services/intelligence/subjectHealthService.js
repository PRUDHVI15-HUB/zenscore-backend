const {
  WEAK_SUBJECT_GRADE_THRESHOLD,
  WEAK_SUBJECT_ATTENDANCE_THRESHOLD,
  EXCELLENT_GRADE_THRESHOLD,
  EXCELLENT_ATTENDANCE_THRESHOLD
} = require('../../constants/academicConstants')

/**
 * Computes health category for a subject.
 * @param {Object} sub - Subject record
 * @param {string} semesterStatus - 'Completed' or 'Current'
 * @returns {'Excellent' | 'Healthy' | 'Needs Work'}
 */
const computeSubjectHealth = (sub, semesterStatus = 'Completed') => {
  const grade = sub.finalGrade !== undefined && sub.finalGrade !== null ? Number(sub.finalGrade) : 0
  const attendance = sub.attendance !== undefined && sub.attendance !== null ? Number(sub.attendance) : 100

  // Passed subjects in a completed semester are finalized & healthy
  if (semesterStatus === 'Completed' && (grade >= 4.0 || sub.result === 'PASS')) {
    return grade >= EXCELLENT_GRADE_THRESHOLD ? 'Excellent' : 'Healthy'
  }

  if (grade >= EXCELLENT_GRADE_THRESHOLD && attendance >= EXCELLENT_ATTENDANCE_THRESHOLD) return 'Excellent'
  if (grade < 4.0 || (semesterStatus === 'Current' && (grade < 6.0 || attendance < WEAK_SUBJECT_ATTENDANCE_THRESHOLD))) return 'Needs Work'
  return 'Healthy'
}

/**
 * Checks if a subject is weak/high-risk.
 * In a Completed semester, ONLY failed subjects (grade < 4.0 / result === 'FAIL') are backlogs needing re-exams.
 * In a Current semester, low attendance or low grade is a hazard.
 * @param {Object} sub
 * @param {string} semesterStatus
 * @returns {boolean}
 */
const isWeakSubject = (sub, semesterStatus = 'Completed') => {
  const grade = sub.finalGrade !== undefined && sub.finalGrade !== null ? Number(sub.finalGrade) : 0
  const attendance = sub.attendance !== undefined && sub.attendance !== null ? Number(sub.attendance) : 100
  const isFailed = (grade > 0 && grade < 4.0) || sub.result === 'FAIL'

  if (semesterStatus === 'Completed') {
    return isFailed
  }

  return isFailed || (grade > 0 && grade < 6.0) || (attendance < WEAK_SUBJECT_ATTENDANCE_THRESHOLD)
}

module.exports = {
  computeSubjectHealth,
  isWeakSubject
}
