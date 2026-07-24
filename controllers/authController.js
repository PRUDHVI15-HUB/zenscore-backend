const jwt = require('jsonwebtoken')
const admin = require('../config/firebase')
const User = require('../models/User')

const generateJWT = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  })
}

// POST /api/auth/firebase-login
const firebaseLogin = async (req, res) => {
  const { idToken } = req.body

  if (!idToken) {
    return res.status(400).json({ success: false, message: 'Firebase ID token is required.' })
  }

  try {
    // 1. Verify Firebase token
    const decoded = await admin.auth().verifyIdToken(idToken)
    const { uid, name, email, picture } = decoded

    // 2. Find or create user in MongoDB
    let user = await User.findOne({ firebaseUid: uid })

    if (!user) {
      user = await User.create({
        firebaseUid: uid,
        name: name || 'ZenScore User',
        email,
        profileImage: picture || '',
      })
    }

    // 3. Generate JWT
    const token = generateJWT(user._id)

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        cgpa: user.cgpa,
        skills: user.skills,
      },
    })
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid Firebase token.', error: error.message })
  }
}

// GET /api/auth/me
const getMe = async (req, res) => {
  res.status(200).json({ success: true, user: req.user })
}

module.exports = { firebaseLogin, getMe }
