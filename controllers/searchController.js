const { executeSearch } = require('../services/search/searchService')

/**
 * GET /api/search
 * Global Contextual Search Endpoint
 * Query Params:
 *  - q: search query string (minimum 2 characters)
 *  - context: current page module context (e.g. 'dashboard', 'academics', 'careers', 'skills', 'courses', 'jobs', 'productivity', 'ai-tutor')
 *  - limit: maximum number of returned results (default: 15)
 */
const globalSearch = async (req, res, next) => {
  try {
    const userId = req.user._id
    const { q, context = 'dashboard', limit = 15 } = req.query

    if (!q || typeof q !== 'string' || q.trim().length < 2) {
      return res.json({
        success: true,
        query: q || '',
        context,
        totalResults: 0,
        results: []
      })
    }

    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 15, 1), 50)

    const searchResponse = await executeSearch({
      userId,
      query: q,
      context,
      limit: parsedLimit
    })

    return res.json({
      success: true,
      ...searchResponse
    })
  } catch (error) {
    console.error('Global Search Error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to complete search query',
      error: error.message
    })
  }
}

module.exports = { globalSearch }
