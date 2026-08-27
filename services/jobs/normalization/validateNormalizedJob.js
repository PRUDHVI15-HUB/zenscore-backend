/**
 * Validates normalized canonical job objects against required fields and quality rules.
 * 
 * @param {Object} normalizedJob - Canonical job object
 * @returns {Object} { valid: boolean, errors: string[] }
 */
const validateNormalizedJob = (normalizedJob) => {
  if (!normalizedJob || typeof normalizedJob !== 'object') {
    return { valid: false, errors: ['Job record must be a non-null object'] }
  }

  const errors = []

  if (!normalizedJob.title || !normalizedJob.title.trim()) {
    errors.push('Missing or empty title')
  }

  if (!normalizedJob.company || !normalizedJob.company.trim()) {
    errors.push('Missing or empty company name')
  }

  if (!normalizedJob.location || !normalizedJob.location.trim()) {
    errors.push('Missing or empty location')
  }

  if (!normalizedJob.applyLink || !normalizedJob.applyLink.trim()) {
    errors.push('Missing or empty application link')
  }

  if (!normalizedJob.externalId || !normalizedJob.externalId.trim()) {
    errors.push('Missing or empty provider externalId')
  }

  if (!normalizedJob.source || !normalizedJob.source.trim()) {
    errors.push('Missing or empty provider source identifier')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

module.exports = validateNormalizedJob
