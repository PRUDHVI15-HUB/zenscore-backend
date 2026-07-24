const { REGEX } = require('./regex')

/**
 * Normalizes carriage returns, strips control characters, collapses empty rows, and trims lines.
 * @param {string} text - Input text
 * @returns {string} Cleaned text
 */
const cleanText = (text) => {
  if (!text) return ''
  return text
    .replace(/\r/g, '')
    .replace(/[^\x20-\x7E\n]/g, '')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n')
}

/**
 * Checks if a line contains metadata garbage text.
 * @param {string} line - Line text
 * @returns {boolean} True if noise
 */
const isNoiseLine = (line) => {
  return REGEX.noise.some(pattern => pattern.test(line))
}

module.exports = {
  cleanText,
  isNoiseLine
}
