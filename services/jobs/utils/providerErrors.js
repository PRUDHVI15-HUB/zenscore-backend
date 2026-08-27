/**
 * Custom Error classes for the ZenScore AI Job Provider Architecture
 */

class ProviderError extends Error {
  constructor(message, providerName = 'Unknown') {
    super(message)
    this.name = this.constructor.name
    this.providerName = providerName
    Error.captureStackTrace(this, this.constructor)
  }
}

class ProviderNotFoundError extends ProviderError {
  constructor(providerName) {
    super(`Job provider '${providerName}' is not registered in the ProviderRegistry.`, providerName)
  }
}

class ProviderValidationError extends ProviderError {
  constructor(message, providerName, errors = []) {
    super(message, providerName)
    this.errors = errors
  }
}

class ProviderFetchError extends ProviderError {
  constructor(message, providerName, originalError = null) {
    super(`Fetch failed for provider '${providerName}': ${message}`, providerName)
    this.originalError = originalError
  }
}

class NormalizationError extends ProviderError {
  constructor(message, providerName, rawJob = null) {
    super(`Normalization error for provider '${providerName}': ${message}`, providerName)
    this.rawJob = rawJob
  }
}

module.exports = {
  ProviderError,
  ProviderNotFoundError,
  ProviderValidationError,
  ProviderFetchError,
  NormalizationError
}
