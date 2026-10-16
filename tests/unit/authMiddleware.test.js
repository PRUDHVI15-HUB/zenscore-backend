const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const { protect, optionalAuth, adminOnly } = require('../../middleware/authMiddleware')
const User = require('../../models/User')

jest.mock('../../models/User')

describe('Authentication Middleware (protect, optionalAuth, adminOnly) - Unit Tests', () => {
  const JWT_SECRET = process.env.JWT_SECRET || 'zenscore_secret'
  let mockReq
  let mockRes
  let nextFn

  beforeEach(() => {
    mockReq = { headers: {} }
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    }
    nextFn = jest.fn()
    jest.clearAllMocks()
  })

  test('protect: rejects request with 401 when Authorization header is completely missing', async () => {
    mockReq.headers = {}
    await protect(mockReq, mockRes, nextFn)

    expect(mockRes.status).toHaveBeenCalledWith(401)
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.stringContaining('Authentication required')
      })
    )
    expect(nextFn).not.toHaveBeenCalled()
  })

  test('protect: rejects request with 401 when token is invalid', async () => {
    mockReq.headers = { authorization: 'Bearer invalid-malformed-token-xyz' }
    await protect(mockReq, mockRes, nextFn)

    expect(mockRes.status).toHaveBeenCalledWith(401)
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.stringContaining('Invalid authentication token')
      })
    )
    expect(nextFn).not.toHaveBeenCalled()
  })

  test('protect: rejects request with 401 when token has expired', async () => {
    const expiredToken = jwt.sign(
      { id: new mongoose.Types.ObjectId().toString(), email: 'expired@student.edu' },
      JWT_SECRET,
      { expiresIn: '-1s' }
    )

    mockReq.headers = { authorization: `Bearer ${expiredToken}` }
    await protect(mockReq, mockRes, nextFn)

    expect(mockRes.status).toHaveBeenCalledWith(401)
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.stringContaining('Session expired')
      })
    )
    expect(nextFn).not.toHaveBeenCalled()
  })

  test('protect: successfully attaches user and calls next() when valid token is supplied', async () => {
    const validUserId = new mongoose.Types.ObjectId()
    const validToken = jwt.sign(
      { id: validUserId.toString(), email: 'valid@student.edu' },
      JWT_SECRET,
      { expiresIn: '1h' }
    )

    const mockUserDoc = { _id: validUserId, email: 'valid@student.edu', role: 'student' }
    User.findById = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUserDoc)
    })

    mockReq.headers = { authorization: `Bearer ${validToken}` }
    await protect(mockReq, mockRes, nextFn)

    expect(mockReq.user).toEqual(mockUserDoc)
    expect(nextFn).toHaveBeenCalled()
    expect(mockRes.status).not.toHaveBeenCalled()
  })

  test('adminOnly: rejects non-admin users with 403', () => {
    const origEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'

    mockReq.user = { role: 'student', isAdmin: false }
    adminOnly(mockReq, mockRes, nextFn)

    expect(mockRes.status).toHaveBeenCalledWith(403)
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.stringContaining('Administrator permissions required')
      })
    )
    expect(nextFn).not.toHaveBeenCalled()

    process.env.NODE_ENV = origEnv
  })
})
