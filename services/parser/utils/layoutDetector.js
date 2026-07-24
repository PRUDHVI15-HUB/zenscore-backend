const { REGEX } = require('./regex')
const { LAYOUTS } = require('./constants')
const { isNoiseLine } = require('./cleanText')

/**
 * Identifies the structural layout pattern of transcript rows with confidence levels.
 * @param {Array<string>} lines - Text lines
 * @returns {Object} Layout object: { layout, layoutConfidence }
 */
const detectLayout = (lines) => {
  let inlineMatches = 0
  let verticalMatches = 0
  let mixedMatches = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (isNoiseLine(line)) continue

    const isPureGrade = REGEX.grade.test(line)
    const isPureCredit = REGEX.credits.test(line)

    if (isPureGrade || isPureCredit) {
      if (isPureGrade) {
        const prevLine = i - 1 >= 0 ? lines[i - 1] : ''
        const nextLine = i + 1 < lines.length ? lines[i + 1] : ''
        
        // VERTICAL: Name -> Grade -> Credits
        if (
          prevLine && nextLine &&
          !REGEX.grade.test(prevLine) && !REGEX.credits.test(prevLine) &&
          REGEX.credits.test(nextLine)
        ) {
          verticalMatches++
        }
        // MIXED: Name -> Credits -> Grade
        else if (i - 2 >= 0) {
          const prevPrevLine = lines[i - 2]
          if (
            prevLine && prevPrevLine &&
            REGEX.credits.test(prevLine) &&
            !REGEX.grade.test(prevPrevLine) && !REGEX.credits.test(prevPrevLine)
          ) {
            mixedMatches++
          }
        }
      }
      continue
    }

    if (REGEX.inlineGrade.test(line) && REGEX.inlineCredits.test(line)) {
      inlineMatches++
    }
  }

  const totalMatches = inlineMatches + verticalMatches + mixedMatches
  if (totalMatches === 0) {
    return {
      layout: LAYOUTS.UNKNOWN,
      layoutConfidence: 0
    }
  }

  // Determine dominant layout and its relative confidence
  if (inlineMatches > 0 && inlineMatches >= verticalMatches && inlineMatches >= mixedMatches) {
    return {
      layout: LAYOUTS.INLINE,
      layoutConfidence: Math.round((inlineMatches / totalMatches) * 100)
    }
  }
  if (verticalMatches > 0 && verticalMatches >= mixedMatches) {
    return {
      layout: LAYOUTS.VERTICAL,
      layoutConfidence: Math.round((verticalMatches / totalMatches) * 100)
    }
  }
  if (mixedMatches > 0) {
    return {
      layout: LAYOUTS.MIXED,
      layoutConfidence: Math.round((mixedMatches / totalMatches) * 100)
    }
  }

  return {
    layout: LAYOUTS.UNKNOWN,
    layoutConfidence: 0
  }
}

module.exports = {
  detectLayout
}
