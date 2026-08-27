/**
 * contextCompressor.js — Token-Efficient Context Serializer
 * Strips undefined/null values, removes internal MongoDB boilerplate,
 * and formats the student context into clean, readable JSON for the LLM.
 */

/**
 * Recursively clean an object to remove null, undefined, or empty collections
 * @param {*} obj
 * @returns {*} Cleaned object
 */
function pruneEmpty(obj) {
  if (Array.isArray(obj)) {
    const cleaned = obj.map(pruneEmpty).filter(v => v !== null && v !== undefined && v !== '')
    return cleaned.length > 0 ? cleaned : null
  }

  if (obj !== null && typeof obj === 'object') {
    const cleaned = {}
    let hasKeys = false
    for (const [key, value] of Object.entries(obj)) {
      const pruned = pruneEmpty(value)
      if (pruned !== null && pruned !== undefined && pruned !== '') {
        cleaned[key] = pruned
        hasKeys = true
      }
    }
    return hasKeys ? cleaned : null
  }

  return obj
}

/**
 * Compress the routed context object into a dense, token-efficient JSON string
 * @param {Object} routedContext
 * @returns {string} Clean JSON string
 */
function compressContext(routedContext) {
  if (!routedContext || Object.keys(routedContext).length === 0) {
    return 'No specific student context recorded yet.'
  }

  const cleaned = pruneEmpty(routedContext)
  if (!cleaned) return 'No student context available.'

  return JSON.stringify(cleaned, null, 2)
}

module.exports = {
  compressContext,
  pruneEmpty
}
