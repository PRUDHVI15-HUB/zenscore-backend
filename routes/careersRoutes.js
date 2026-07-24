const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/authMiddleware')
const { getCareerPaths, getRoles, getSkillGap } = require('../controllers/careersController')

router.use(protect)

router.get('/paths', getCareerPaths)
router.get('/roles', getRoles)
router.post('/skill-gap', getSkillGap)

module.exports = router
