/**
 * Standardized logger for the ZenScore AI Job Provider Pipeline
 */

const LOG_LEVELS = {
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  SUCCESS: 'SUCCESS'
}

const formatMessage = (level, providerName, stage, message) => {
  const timestamp = new Date().toISOString()
  const pName = (providerName || 'GLOBAL').toUpperCase()
  return `[${timestamp}] [Provider:${pName}] [${stage}] ${level}: ${message}`
}

const providerLogger = {
  info: (providerName, stage, message) => {
    console.log(formatMessage(LOG_LEVELS.INFO, providerName, stage, message))
  },
  warn: (providerName, stage, message) => {
    console.warn(formatMessage(LOG_LEVELS.WARN, providerName, stage, message))
  },
  error: (providerName, stage, message, err = null) => {
    console.error(formatMessage(LOG_LEVELS.ERROR, providerName, stage, message))
    if (err && err.stack) {
      console.error(`Stack trace: ${err.stack}`)
    }
  },
  success: (providerName, stage, message) => {
    console.log(formatMessage(LOG_LEVELS.SUCCESS, providerName, stage, message))
  }
}

module.exports = providerLogger
