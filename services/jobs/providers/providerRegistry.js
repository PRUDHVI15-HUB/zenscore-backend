const MockProvider = require('./providers/MockProvider')
const AdzunaProvider = require('./providers/AdzunaProvider')
const JoobleProvider = require('./providers/JoobleProvider')
const GreenhouseProvider = require('./providers/GreenhouseProvider')

/**
 * Provider Registry maintaining the list of available External Job Providers.
 * 
 * To add a new job provider:
 * 1. Create your Provider class extending BaseProvider inside services/jobs/providers/providers/
 * 2. Register it below in this dictionary mapping its string key to its class constructor.
 */
const providerRegistry = {
  mock: MockProvider,
  adzuna: AdzunaProvider,
  jooble: JoobleProvider,
  greenhouse: GreenhouseProvider

  // Future External Providers will plug in here cleanly:
  // greenhouse: GreenhouseProvider,
  // lever: LeverProvider,
  // remoteok: RemoteOKProvider,
  // arbeitnow: ArbeitnowProvider
}

/**
 * Check if a provider name is registered
 * @param {string} providerName
 * @returns {boolean}
 */
const isProviderRegistered = (providerName) => {
  if (!providerName || typeof providerName !== 'string') return false
  return Object.prototype.hasOwnProperty.call(providerRegistry, providerName.toLowerCase().trim())
}

/**
 * Retrieve the Provider class for a registered key
 * @param {string} providerName
 * @returns {Function|null} Provider class constructor
 */
const getProviderClass = (providerName) => {
  if (!isProviderRegistered(providerName)) return null
  return providerRegistry[providerName.toLowerCase().trim()]
}

module.exports = {
  providerRegistry,
  isProviderRegistered,
  getProviderClass
}
