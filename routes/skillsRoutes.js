const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/authMiddleware')
const { getCategories, getSkillByCategory } = require('../controllers/skillsController')

router.use(protect)

router.get('/categories', getCategories)
router.get('/:category', getSkillByCategory)

module.exports = router
