const express = require('express')
const router = express.Router()
const { firebaseLogin, getMe } = require('../controllers/authController')
const { protect } = require('../middleware/authMiddleware')

router.post('/firebase-login', firebaseLogin)
router.get('/me', protect, getMe)

module.exports = router
