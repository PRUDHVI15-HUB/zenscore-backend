const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/authMiddleware')
const {
  followCompany,
  unfollowCompany,
  getFollowedCompanies,
  isFollowingCompany,
  toggleCompanyNotifications,
  getCompanyProfile
} = require('../controllers/followedCompaniesController')

// Public company profile GET endpoint
router.get('/:company/profile', getCompanyProfile)

// Protected company follow endpoints
router.use(protect)

router.get('/following', getFollowedCompanies)
router.get('/:company/is-following', isFollowingCompany)
router.post('/:company/follow', followCompany)
router.delete('/:company/follow', unfollowCompany)
router.patch('/:company/notifications', toggleCompanyNotifications)

module.exports = router
