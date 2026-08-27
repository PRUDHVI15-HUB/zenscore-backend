const { getProviderClass, isProviderRegistered } = require('./providerRegistry')
const { ProviderNotFoundError } = require('../utils/providerErrors')
const providerLogger = require('../utils/providerLogger')

/**
 * Factory class responsible for instantiating External Job Providers.
 * Implements Factory Pattern & Dependency Injection.
 */
class ProviderFactory {
  /**
   * Instantiates a registered Job Provider by name.
   * @param {string} providerName - Unique string identifier (e.g., 'mock', 'adzuna')
   * @returns {BaseProvider} Instance of requested provider
   * @throws {ProviderNotFoundError} If provider is not registered
   */
  static create(providerName) {
    if (!providerName || typeof providerName !== 'string') {
      throw new ProviderNotFoundError('INVALID_NAME')
    }

    const cleanName = providerName.toLowerCase().trim()

    if (!isProviderRegistered(cleanName)) {
      providerLogger.error('FACTORY', 'CREATE', `Provider '${cleanName}' not found in registry.`)
      throw new ProviderNotFoundError(cleanName)
    }

    const ProviderClass = getProviderClass(cleanName)
    const providerInstance = new ProviderClass()

    providerLogger.info(cleanName, 'FACTORY', `Instantiated provider '${providerInstance.getProviderName()}' (v${providerInstance.getProviderVersion()}).`)
    return providerInstance
  }
}

module.exports = ProviderFactory
