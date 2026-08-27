const RoadmapService = require('../services/roadmapService')

// GET /api/roadmaps
const getRoadmaps = async (req, res) => {
  try {
    const data = await RoadmapService.getRoadmaps()
    res.status(200).json({ success: true, data })
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message || 'Server error' })
  }
}

// GET /api/roadmaps/user
const getUserRoadmaps = async (req, res) => {
  try {
    const data = await RoadmapService.getUserRoadmaps(req.user._id)
    res.status(200).json({ success: true, data })
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message || 'Server error' })
  }
}

// GET /api/roadmaps/:roadmapId
const getRoadmapDetails = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : null
    const data = await RoadmapService.getRoadmapDetails(req.params.roadmapId, userId)
    res.status(200).json({ success: true, data })
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message || 'Server error' })
  }
}

// POST /api/roadmaps/enroll
const enrollRoadmap = async (req, res) => {
  try {
    const data = await RoadmapService.enrollRoadmap(req.body.roadmapId, req.user._id)
    res.status(201).json({ success: true, message: 'Enrolled in roadmap', data })
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message || 'Server error' })
  }
}

// PATCH /api/roadmaps/node/:nodeId
const updateNodeProgress = async (req, res) => {
  try {
    const roadmapId = req.body.roadmapId || req.query.roadmapId
    const data = await RoadmapService.updateNodeProgress(roadmapId, req.params.nodeId, req.user._id)
    res.status(200).json({ success: true, message: 'Roadmap node progress updated', data })
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message || 'Server error' })
  }
}

module.exports = {
  getRoadmaps,
  getUserRoadmaps,
  getRoadmapDetails,
  enrollRoadmap,
  updateNodeProgress
}
