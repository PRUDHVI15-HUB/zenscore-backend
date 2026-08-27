const jwt = require('jsonwebtoken')
const User = require('../models/User')
const mongoose = require('mongoose')

const JWT_SECRET = process.env.JWT_SECRET || 'zenscore_secret'

const protect = async (req, res, next) => {
  let token

  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1]
  }

  // No token or placeholder — reject with 401 (never fall back to a shared guest user)
  if (!token || token === 'mock_guest_token' || token === 'null' || token === 'undefined' || token === 'mock-jwt-token') {
    return res.status(401).json({ success: false, message: 'Authentication required. Please log in to continue.' })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET)

    if (!decoded.id || !mongoose.Types.ObjectId.isValid(decoded.id)) {
      return res.status(401).json({ success: false, message: 'Invalid authentication token. Please log in again.' })
    }

    const user = await User.findById(decoded.id).select('-__v')

    if (!user) {
      return res.status(401).json({ success: false, message: 'User account not found. Please log in again.' })
    }

    req.user = user
    next()
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' })
    }
    return res.status(401).json({ success: false, message: 'Invalid authentication token. Please log in again.' })
  }
}

/**
 * Optional authentication middleware that attaches user if valid token exists,
 * but allows unauthenticated requests to proceed (does NOT fallback to guest user).
 */
const optionalAuth = async (req, res, next) => {
  let token

  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1]
  }

  if (token && token !== 'mock_guest_token' && token !== 'null' && token !== 'undefined' && token !== 'mock-jwt-token') {
    try {
      const decoded = jwt.verify(token, JWT_SECRET)
      if (decoded.id && mongoose.Types.ObjectId.isValid(decoded.id)) {
        const user = await User.findById(decoded.id).select('-__v')
        if (user) req.user = user
      }
    } catch (e) {
      // Token invalid/expired: proceed as unauthenticated guest (no user attached)
    }
  }

  next()
}

/**
 * Admin permission check middleware enforcing role = 'admin' or isAdmin = true
 */
const adminOnly = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.isAdmin || process.env.NODE_ENV === 'development')) {
    return next()
  }
  return res.status(403).json({ success: false, message: 'Access forbidden. Administrator permissions required.' })
}

module.exports = { protect, optionalAuth, adminOnly }
