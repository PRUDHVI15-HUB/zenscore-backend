/**
 * memoryService.js — Two-Level Memory Management
 * Level 1: Authoritative MongoDB Student Data (handled by studentSnapshotService)
 * Level 2: Conversational Memory & Dynamic Session Goals
 */

const StudentProfile = require('../../../models/StudentProfile')

/**
 * Extracts explicit user goals or deadlines from user messages
 * e.g., "I have DBMS exam on Friday", "Preparing for Amazon interview"
 * @param {string} userMessage
 * @returns {Object|null} Extracted preference or null
 */
function extractUserPreferences(userMessage) {
  if (!userMessage || typeof userMessage !== 'string') return null

  const msg = userMessage.toLowerCase()

  // Detect upcoming exam mentions
  const examMatch = msg.match(/(?:i have|got|my)\s+([a-z0-9\s]{2,20}?)\s+(?:exam|test|viva|quiz|midterm|internal|final)\s+(?:on|this|next)?\s*([a-z0-9\s]{2,15})?/i)
  if (examMatch) {
    return {
      type: 'UPCOMING_EXAM',
      subject: examMatch[1].trim(),
      timeframe: examMatch[2] ? examMatch[2].trim() : 'Upcoming',
      recordedAt: new Date().toISOString()
    }
  }

  // Detect focus goal mentions (e.g. "Focusing on Backend for next 2 weeks")
  const focusMatch = msg.match(/(?:focusing on|aiming for|targeting)\s+([a-z0-9\s]{2,25})/i)
  if (focusMatch) {
    return {
      type: 'ACTIVE_GOAL',
      goal: focusMatch[1].trim(),
      recordedAt: new Date().toISOString()
    }
  }

  return null
}

/**
 * Load persistent student preferences from StudentProfile
 * @param {string|ObjectId} userId
 * @returns {Promise<Array>} List of active preferences/goals
 */
async function loadStudentPreferences(userId) {
  if (!userId) return []

  try {
    const profile = await StudentProfile.findOne({ user: userId }).select('aiSummary').lean()
    return profile?.aiSummary?.data?.activeGoals || []
  } catch {
    return []
  }
}

/**
 * Persist an extracted user preference or active goal to StudentProfile
 * @param {string|ObjectId} userId
 * @param {Object} preference
 */
async function saveStudentPreference(userId, preference) {
  if (!userId || !preference) return

  try {
    const profile = await StudentProfile.findOne({ user: userId })
    if (profile) {
      const currentGoals = profile.aiSummary?.data?.activeGoals || []
      // Deduplicate by type and subject/goal
      const updated = [
        preference,
        ...currentGoals.filter(g => g.subject !== preference.subject && g.goal !== preference.goal)
      ].slice(0, 5) // keep max 5 active goals

      profile.aiSummary = {
        status: 'active',
        lastUpdated: new Date(),
        data: {
          ...(profile.aiSummary?.data || {}),
          activeGoals: updated
        }
      }
      await profile.save()
    }
  } catch (err) {
    console.warn('[MemoryService] Preference save notice:', err?.message)
  }
}

/**
 * Trims conversation history to keep the context window compact and fast.
 * Keeps the last N turns and sanitizes any client-side noise.
 * @param {Array<Object>} messages
 * @param {number} maxTurns - Max turns to keep (default 6)
 * @returns {Array<Object>} Trimmed messages
 */
function trimConversationHistory(messages, maxTurns = 6) {
  if (!Array.isArray(messages)) return []

  const clean = []
  for (const m of messages) {
    if (!m || typeof m.content !== 'string') continue
    // Skip client-injected system markers
    if (m.content.startsWith('[System: ') || m.role === 'system') continue

    const sanitized = m.content.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '').trim()
    if (sanitized) {
      clean.push({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: sanitized
      })
    }
  }

  // Keep last maxTurns messages
  return clean.slice(-maxTurns)
}

module.exports = {
  extractUserPreferences,
  loadStudentPreferences,
  saveStudentPreference,
  trimConversationHistory
}
