const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/authMiddleware')
const {
  getStudentProfile,
  updateStudentProfile,
  updateProfileSection,
  resetStudentProfile,
  getProfileStatus
} = require('../controllers/studentProfileController')

// All Student Profile routes are protected by JWT authentication
router.use(protect)

router.get('/', getStudentProfile)
router.patch('/', updateStudentProfile)
router.get('/status', getProfileStatus)
router.post('/reset', resetStudentProfile)
router.patch('/:section', updateProfileSection)

module.exports = router
