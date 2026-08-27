const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/authMiddleware')
const { globalSearch } = require('../controllers/searchController')

// GET /api/search - Authenticated Global Contextual Search
router.get('/', protect, globalSearch)

module.exports = router
