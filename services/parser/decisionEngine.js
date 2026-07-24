/**
 * Main Decision Engine function.
 * Evaluates parsing confidence and routes routing decision (RULE_PARSER or GROQ).
 * @param {Object} sharedContract - The pipeline shared contract
 * @returns {Object} Audited contract containing routing choices
 */
const decidePipelineRoute = (sharedContract) => {
  if (!sharedContract) return null

  // Ensure absolute immutability by cloning the object
  const contract = JSON.parse(JSON.stringify(sharedContract))

  const semesterNumber = contract.semesterNumber
  const subjects = contract.subjects || []
  const totalSubjects = subjects.length

  // 1. Calculate actual points earned in each category (Internal Refinement 1)
  const hasSemester = semesterNumber !== null && Number.isInteger(semesterNumber) && semesterNumber >= 1 && semesterNumber <= 8
  const semesterScore = hasSemester ? 20 : 0
  const subjectsScore = totalSubjects > 0 ? 20 : 0

  let validCreditsCount = 0
  let validGradesCount = 0
  let invalidCreditsCount = 0
  let unmappedGradesCount = 0
  let missingNamesCount = 0
  let duplicateCount = 0

  subjects.forEach(sub => {
    // Valid credits are integers between 1 and 6
    const isValCredit = sub.credits !== null && Number.isInteger(sub.credits) && sub.credits >= 1 && sub.credits <= 6
    if (isValCredit) {
      validCreditsCount++
    } else {
      invalidCreditsCount++
    }

    // Valid grades are numerical between 0 and 10
    const isValGrade = sub.finalGrade !== null && typeof sub.finalGrade === 'number' && sub.finalGrade >= 0 && sub.finalGrade <= 10
    if (isValGrade) {
      validGradesCount++
    } else {
      unmappedGradesCount++
    }

    // Missing subject name
    if (!sub.name || !String(sub.name).trim()) {
      missingNamesCount++
    }

    // Duplicates
    if (sub.duplicate === true) {
      duplicateCount++
    }
  })

  // Proportional scores based on valid items
  const creditsScore = totalSubjects > 0 ? Math.round((validCreditsCount / totalSubjects) * 30) : 0
  const gradesScore = totalSubjects > 0 ? Math.round((validGradesCount / totalSubjects) * 30) : 0

  // Calculate penalties for optional deductions not already accounted for by category scores
  let penalties = 0

  // Missing names (not captured in credits or grades)
  penalties += missingNamesCount * 10

  // Duplicate subject indicator
  penalties += duplicateCount * 2

  // Parser structural/layout extraction issues
  const metadataIssuesCount = contract.metadata && contract.metadata.parsingIssues 
    ? contract.metadata.parsingIssues.length 
    : 0
  penalties += metadataIssuesCount * 2

  // Compute final confidence score
  const basePositiveScore = semesterScore + subjectsScore + creditsScore + gradesScore
  let totalConfidence = basePositiveScore - penalties

  // Keep total confidence bound between 0 and 100
  totalConfidence = Math.max(0, Math.min(100, totalConfidence))

  // Determine routing based on threshold 80 (Internal Refinement 2)
  const shouldUseGroq = totalConfidence < 80
  const decision = shouldUseGroq ? 'GROQ' : 'RULE_PARSER'
  const nextStage = shouldUseGroq ? 'GROQ_REPAIR' : 'IMPORT_SESSION'

  // Update contract attributes
  contract.confidence = totalConfidence
  
  if (!contract.metadata) {
    contract.metadata = {}
  }

  contract.metadata.decision = decision
  contract.metadata.shouldUseGroq = shouldUseGroq
  contract.metadata.nextStage = nextStage
  
  contract.metadata.confidenceBreakdown = {
    semester: semesterScore,
    subjects: subjectsScore,
    credits: creditsScore,
    grades: gradesScore,
    penalties,
    total: totalConfidence
  }

  return contract
}

module.exports = {
  decidePipelineRoute
}
