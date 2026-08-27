/**
 * Contract Interface for all External Job Providers in ZenScore AI.
 * 
 * Every job provider (Adzuna, Greenhouse, Lever, RemoteOK, Arbeitnow, etc.)
 * must implement these methods.
 * 
 * @interface JobProviderInterface
 */
class JobProviderInterface {
  /**
   * Fetches raw job listings from the external source / API.
   * @param {Object} [params] - Query options (e.g. page, location, query, limit)
   * @returns {Promise<Array<Object>>} Array of raw provider job objects
   */
  async fetchJobs(params = {}) {
    throw new Error('Method fetchJobs() must be implemented.')
  }

  /**
   * Normalizes a single raw provider job object into the canonical ZenScore AI job schema.
   * @param {Object} rawJob - Raw job payload from external provider
   * @returns {Object} Normalized canonical job object
   */
  normalize(rawJob) {
    throw new Error('Method normalize() must be implemented.')
  }

  /**
   * Validates the normalized job record before ingestion.
   * @param {Object} normalizedJob - Canonical job object
   * @returns {Object} { valid: boolean, errors: string[] }
   */
  validate(normalizedJob) {
    throw new Error('Method validate() must be implemented.')
  }

  /**
   * Returns the unique string identifier for this provider (e.g., 'adzuna', 'greenhouse', 'mock').
   * @returns {string}
   */
  getProviderName() {
    throw new Error('Method getProviderName() must be implemented.')
  }

  /**
   * Returns the provider integration version string (e.g. '1.0.0').
   * @returns {string}
   */
  getProviderVersion() {
    return '1.0.0'
  }
}

module.exports = JobProviderInterface
