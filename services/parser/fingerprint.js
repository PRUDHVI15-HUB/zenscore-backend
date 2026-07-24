/**
 * Fingerprint Service
 * Computes SHA-256 hash of uploaded file buffer and checks for duplicate
 * import sessions belonging to the authenticated user.
 *
 * Enables: "This semester was already imported" detection before OCR starts,
 * saving processing time and preventing accidental duplicate records.
 */
const crypto = require('crypto')

/**
 * Generates a SHA-256 hex fingerprint from a file buffer.
 * Works identically for PDF and image uploads.
 *
 * @param {Buffer} buffer - File buffer from multer
 * @returns {string} SHA-256 hex string (64 chars)
 */
const generateFingerprint = (buffer) => {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw new Error('Valid file buffer required for fingerprinting.')
  }
  return crypto.createHash('sha256').update(buffer).digest('hex')
}

/**
 * Checks whether a file with this hash was already imported by this user.
 * Only checks sessions with status 'Confirmed' — pending/expired sessions
 * do not count as real duplicates.
 *
 * @param {string} userId - Authenticated user's MongoDB ObjectId string
 * @param {string} fileHash - SHA-256 hex fingerprint
 * @returns {Promise<{ isDuplicate: boolean, existingSession: Object|null }>}
 */
const checkDuplicate = async (userId, fileHash) => {
  const ImportSession = require('../models/ImportSession')

  const existing = await ImportSession.findOne({
    user: userId,
    fileHash: fileHash,
    status: 'Confirmed'
  }).select('_id semesterNumber university academicYear createdAt parsedData.semesterNumber').lean()

  if (existing) {
    return {
      isDuplicate: true,
      existingSession: {
        sessionId: existing._id,
        semesterNumber: existing.semesterNumber || existing.parsedData?.semesterNumber,
        university: existing.university,
        academicYear: existing.academicYear,
        importedAt: existing.createdAt
      }
    }
  }

  return { isDuplicate: false, existingSession: null }
}

module.exports = {
  generateFingerprint,
  checkDuplicate
}
