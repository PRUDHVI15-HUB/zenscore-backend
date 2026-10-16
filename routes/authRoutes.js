const express = require('express')
const router = express.Router()
const { firebaseLogin, getMe, demoLogin } = require('../controllers/authController')
const { protect } = require('../middleware/authMiddleware')

router.post('/firebase-login', firebaseLogin)
router.post('/demo-login', demoLogin)
router.get('/me', protect, getMe)

module.exports = router

