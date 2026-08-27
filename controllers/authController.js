const jwt = require('jsonwebtoken')
const admin = require('../config/firebase')
const User = require('../models/User')
const { sendWelcomeEmail } = require('../services/email/resendService')

const generateJWT = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'zenscore_secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  })
}

// POST /api/auth/firebase-login
const firebaseLogin = async (req, res) => {
  const { idToken } = req.body

  if (!idToken) {
    return res.status(401).json({
      success: false,
      message: 'Firebase ID token is required. Please log in.',
    })
  }

  try {
    // 1. Verify Firebase token with Admin SDK
    const decoded = await admin.auth().verifyIdToken(idToken)
    const { uid, name, email, picture } = decoded

    if (!uid) {
      return res.status(401).json({ success: false, message: 'Invalid Firebase token: missing user ID.' })
    }

    const cleanEmail = email ? email.toLowerCase().trim() : ''

    // 2. Find existing user by firebaseUid OR email
    let user = null
    if (cleanEmail) {
      user = await User.findOne({
        $or: [
          { firebaseUid: uid },
          { email: cleanEmail }
        ]
      }).catch(() => null)
    } else {
      user = await User.findOne({ firebaseUid: uid }).catch(() => null)
    }

    let isNewUser = false

    if (!user) {
      isNewUser = true
      try {
        user = await User.create({
          firebaseUid: uid,
          name: name || (cleanEmail ? cleanEmail.split('@')[0] : 'Student'),
          email: cleanEmail || `user_${uid}@zenscore.ai`,
          profileImage: picture || '',
        })

        // Non-blocking Welcome Email delivery for newly created users
        sendWelcomeEmail({
          name: user.name,
          email: user.email
        }).catch(err => {
          console.error(`Welcome email failed: ${err?.message || err}`)
        })
      } catch (e) {
        console.error('[authController] User.create initial attempt failed:', e?.message)
        // Fallback: try finding user by email or uid one more time
        user = await User.findOne({
          $or: [
            { firebaseUid: uid },
            { email: cleanEmail }
          ]
        }).catch(() => null)

        if (!user) {
          return res.status(500).json({ success: false, message: 'Failed to create user account. Please try again.' })
        }
      }
    } else {
      // If user existed by email but firebaseUid wasn't linked yet, link it
      if (!user.firebaseUid || user.firebaseUid !== uid) {
        user.firebaseUid = uid
        if (picture && !user.profileImage) user.profileImage = picture
        await user.save().catch(err => console.warn('[authController] Sync firebaseUid warning:', err?.message))
      }
    }

    const token = generateJWT(user._id)
    return res.status(200).json({
      success: true,
      token,
      isNewUser,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage || picture || '',
        skills: user.skills || [],
      },
    })
  } catch (error) {
    console.error('[authController] Firebase token verification failed:', error?.message)

    // Attempt to read unverified payload for development fallback (e.g. emulator)
    if (process.env.NODE_ENV === 'development') {
      try {
        const parts = idToken.split('.')
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'))
          const devUid = payload.user_id || payload.sub
          const devEmail = payload.email ? payload.email.toLowerCase().trim() : ''
          const devName = payload.name || (devEmail ? devEmail.split('@')[0] : 'Dev User')
          if (devUid) {
            let user = await User.findOne({
              $or: [{ firebaseUid: devUid }, { email: devEmail }]
            }).catch(() => null)
            if (!user) {
              user = await User.create({ firebaseUid: devUid, name: devName, email: devEmail }).catch(() => null)
            }
            if (user) {
              const token = generateJWT(user._id)
              return res.status(200).json({ success: true, token, user: { id: user._id, name: user.name, email: user.email } })
            }
          }
        }
      } catch (e) {}
    }

    return res.status(401).json({ success: false, message: 'Firebase token verification failed. Please log in again.' })
  }
}

// GET /api/auth/me
const getMe = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated.' })
  }
  res.status(200).json({ success: true, user: req.user })
}

module.exports = { firebaseLogin, getMe }
