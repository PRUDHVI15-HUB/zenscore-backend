const JobProviderInterface = require('./interfaces/JobProviderInterface')
const { ProviderFetchError, NormalizationError } = require('../utils/providerErrors')
const providerLogger = require('../utils/providerLogger')

/**
 * Abstract BaseProvider class that all external Job Providers must extend.
 * Implements common provider behavior, error wrapping, and lifecycle logging.
 * 
 * @extends JobProviderInterface
 */
class BaseProvider extends JobProviderInterface {
  constructor(providerName = 'abstract-base') {
    super()
    this.providerName = providerName
  }

  getProviderName() {
    return this.providerName
  }

  getProviderVersion() {
    return '1.0.0'
  }

  async fetchJobs(params = {}) {
    providerLogger.warn(this.getProviderName(), 'FETCH', 'fetchJobs() not overridden in subclass')
    throw new ProviderFetchError('fetchJobs() must be overridden by concrete provider class', this.getProviderName())
  }

  normalize(rawJob) {
    providerLogger.warn(this.getProviderName(), 'NORMALIZE', 'normalize() not overridden in subclass')
    throw new NormalizationError('normalize() must be overridden by concrete provider class', this.getProviderName(), rawJob)
  }

  validate(normalizedJob) {
    if (!normalizedJob || typeof normalizedJob !== 'object') {
      return { valid: false, errors: ['Normalized job must be an object'] }
    }

    const errors = []
    if (!normalizedJob.title) errors.push('Missing required field: title')
    if (!normalizedJob.company) errors.push('Missing required field: company')
    if (!normalizedJob.externalId) errors.push('Missing required field: externalId')

    return {
      valid: errors.length === 0,
      errors
    }
  }
}

module.exports = BaseProvider
