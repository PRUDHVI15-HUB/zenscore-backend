const providerLogger = require('../utils/providerLogger')

/**
 * Normalizes provider-specific raw job payloads into canonical ZenScore AI Job Schema.
 * Served as the single normalization entry point across all providers.
 * 
 * @param {Object} rawJob - Raw job payload from external source
 * @param {BaseProvider} providerInstance - Concrete provider instance
 * @returns {Object} Canonical normalized job object
 */
const normalizeJob = (rawJob, providerInstance) => {
  if (!rawJob) return null

  const providerName = providerInstance ? providerInstance.getProviderName() : 'unknown'

  try {
    // 1. Delegate to provider's custom normalize method if available
    let normalized = null
    if (providerInstance && typeof providerInstance.normalize === 'function') {
      normalized = providerInstance.normalize(rawJob)
    }

    if (!normalized) {
      providerLogger.warn(providerName, 'NORMALIZE', 'Provider did not return normalized object, falling back to default mapping.')
      normalized = {
        title: rawJob.title || rawJob.job_title || 'Software Opportunity',
        company: rawJob.company || rawJob.company_name || 'Hiring Company',
        location: rawJob.location || 'Remote',
        workMode: rawJob.workMode || 'Remote',
        employmentType: rawJob.employmentType || 'Full-Time',
        experience: rawJob.experience || '0-2 years',
        salary: rawJob.salary || 'Competitive',
        category: rawJob.category || 'Software Development',
        requiredSkills: rawJob.requiredSkills || [],
        description: rawJob.description || '',
        applyLink: rawJob.applyLink || rawJob.url || '#',
        deadline: rawJob.deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        source: providerName,
        externalId: rawJob.id || rawJob.externalId || String(Date.now())
      }
    }

    // 2. Enforce defaults and sanitization
    return {
      title: (normalized.title || 'Untitled Position').trim(),
      company: (normalized.company || 'Unknown Company').trim(),
      location: (normalized.location || 'Remote').trim(),
      workMode: normalized.workMode || 'Remote',
      employmentType: normalized.employmentType || 'Full-Time',
      experience: normalized.experience || '0-2 years',
      salary: normalized.salary || 'Competitive',
      category: normalized.category || 'Engineering',
      requiredSkills: Array.isArray(normalized.requiredSkills) ? normalized.requiredSkills : [],
      description: normalized.description || '',
      applyLink: normalized.applyLink || '#',
      deadline: normalized.deadline ? new Date(normalized.deadline) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      source: normalized.source || providerName,
      externalId: String(normalized.externalId || Date.now())
    }
  } catch (err) {
    providerLogger.error(providerName, 'NORMALIZE', `Failed to normalize job: ${err.message}`, err)
    return null
  }
}

module.exports = normalizeJob
