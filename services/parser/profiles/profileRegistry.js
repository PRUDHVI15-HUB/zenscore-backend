/**
 * Profile Registry
 * Central lookup table for all university parser profiles.
 * Add new profiles here — no other file needs modification.
 *
 * Profiles are evaluated in ORDER during auto-detection.
 * More specific profiles (like JNTUH_R22) should appear before generic fallbacks.
 */
const JNTUH_R22  = require('./JNTUH_R22')
const JNTUH_R18  = require('./JNTUH_R18')
const AUTONOMOUS = require('./AUTONOMOUS')

/** Ordered list — most specific first, generic fallback last */
const PROFILES = [
  JNTUH_R22,
  JNTUH_R18,
  AUTONOMOUS   // Always last — catches everything else
]

/**
 * Retrieve a parser profile by its ID string.
 * @param {string} id - Profile ID (e.g. "JNTUH_R22", "AUTONOMOUS")
 * @returns {Object|null} Profile object or null if not found
 */
const getProfile = (id) => {
  return PROFILES.find(p => p.id === id) || null
}

/**
 * List all registered profiles (excluding the AUTONOMOUS fallback).
 * @returns {Array<Object>} Array of profile objects
 */
const listProfiles = () => {
  return PROFILES.filter(p => p.id !== 'AUTONOMOUS')
}

/**
 * Get the generic fallback profile.
 * @returns {Object} AUTONOMOUS profile
 */
const getFallbackProfile = () => {
  return AUTONOMOUS
}

module.exports = {
  PROFILES,
  getProfile,
  listProfiles,
  getFallbackProfile
}
