const mongoose = require('mongoose')
const TutorConversation = require('../models/TutorConversation')

/**
 * Validate MongoDB ObjectId safely
 */
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === String(id)
}

/**
 * GET /api/ai-tutor/conversations
 * Fetch all conversations belonging to the authenticated user.
 */
const getConversations = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authenticated user required' })
    }

    const { projectId } = req.query
    const filter = { user: userId }
    if (projectId) {
      filter.projectId = projectId
    }

    const conversations = await TutorConversation.find(filter)
      .sort({ isPinned: -1, updatedAt: -1 })
      .select('_id title projectId isPinned createdAt updatedAt messages')
      .lean()

    // Transform for frontend compatibility (map _id to id)
    const formatted = conversations.map(c => ({
      id: c._id.toString(),
      _id: c._id.toString(),
      title: c.title || 'New Chat',
      projectId: c.projectId || null,
      pinned: Boolean(c.isPinned),
      isPinned: Boolean(c.isPinned),
      createdAt: c.createdAt ? new Date(c.createdAt).getTime() : Date.now(),
      updatedAt: c.updatedAt ? new Date(c.updatedAt).getTime() : Date.now(),
      messages: Array.isArray(c.messages) ? c.messages : []
    }))

    return res.status(200).json({
      success: true,
      data: formatted,
      count: formatted.length
    })
  } catch (err) {
    console.error('[AITutorConversationController] getConversations error:', err)
    return res.status(500).json({ success: false, error: 'Failed to retrieve conversations' })
  }
}

/**
 * POST /api/ai-tutor/conversations
 * Create a new conversation for the authenticated user.
 */
const createConversation = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authenticated user required' })
    }

    const { title, messages, projectId, isPinned, id } = req.body

    const cleanTitle = typeof title === 'string' && title.trim() ? title.trim().slice(0, 120) : 'New Chat'
    const conversationData = {
      user: userId,
      title: cleanTitle,
      messages: Array.isArray(messages) ? messages : [],
      projectId: projectId || null,
      isPinned: Boolean(isPinned)
    }

    // If client supplied a valid ObjectId (e.g., from pre-allocated local session), use it if not exists
    if (id && isValidObjectId(id)) {
      conversationData._id = id
    }

    const conversation = await TutorConversation.create(conversationData)

    return res.status(201).json({
      success: true,
      data: {
        id: conversation._id.toString(),
        _id: conversation._id.toString(),
        title: conversation.title,
        projectId: conversation.projectId,
        pinned: conversation.isPinned,
        isPinned: conversation.isPinned,
        messages: conversation.messages,
        createdAt: new Date(conversation.createdAt).getTime(),
        updatedAt: new Date(conversation.updatedAt).getTime()
      }
    })
  } catch (err) {
    console.error('[AITutorConversationController] createConversation error:', err)
    return res.status(500).json({ success: false, error: 'Failed to create conversation' })
  }
}

/**
 * GET /api/ai-tutor/conversations/:id
 * Retrieve a single conversation by ID with strict user ownership scoping.
 */
const getConversationById = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id
    const { id } = req.params

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, error: 'Invalid conversation ID format' })
    }

    const conversation = await TutorConversation.findOne({ _id: id, user: userId }).lean()

    if (!conversation) {
      return res.status(404).json({ success: false, error: 'Conversation not found or unauthorized' })
    }

    return res.status(200).json({
      success: true,
      data: {
        id: conversation._id.toString(),
        _id: conversation._id.toString(),
        title: conversation.title,
        projectId: conversation.projectId,
        pinned: conversation.isPinned,
        isPinned: conversation.isPinned,
        messages: conversation.messages || [],
        createdAt: new Date(conversation.createdAt).getTime(),
        updatedAt: new Date(conversation.updatedAt).getTime()
      }
    })
  } catch (err) {
    console.error('[AITutorConversationController] getConversationById error:', err)
    return res.status(500).json({ success: false, error: 'Failed to retrieve conversation' })
  }
}

/**
 * PATCH /api/ai-tutor/conversations/:id
 * Update title, messages, pinned status, or project association with user scoping.
 */
const updateConversation = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id
    const { id } = req.params

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, error: 'Invalid conversation ID format' })
    }

    const { title, messages, projectId, isPinned, pinned } = req.body

    const updateFields = {}
    if (title !== undefined && typeof title === 'string') {
      updateFields.title = title.trim().slice(0, 120) || 'New Chat'
    }
    if (messages !== undefined && Array.isArray(messages)) {
      updateFields.messages = messages
    }
    if (projectId !== undefined) {
      updateFields.projectId = projectId || null
    }
    if (isPinned !== undefined || pinned !== undefined) {
      updateFields.isPinned = isPinned !== undefined ? Boolean(isPinned) : Boolean(pinned)
    }

    const updated = await TutorConversation.findOneAndUpdate(
      { _id: id, user: userId },
      { $set: updateFields },
      { new: true, runValidators: true }
    ).lean()

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Conversation not found or unauthorized' })
    }

    return res.status(200).json({
      success: true,
      data: {
        id: updated._id.toString(),
        _id: updated._id.toString(),
        title: updated.title,
        projectId: updated.projectId,
        pinned: updated.isPinned,
        isPinned: updated.isPinned,
        messages: updated.messages || [],
        createdAt: new Date(updated.createdAt).getTime(),
        updatedAt: new Date(updated.updatedAt).getTime()
      }
    })
  } catch (err) {
    console.error('[AITutorConversationController] updateConversation error:', err)
    return res.status(500).json({ success: false, error: 'Failed to update conversation' })
  }
}

/**
 * DELETE /api/ai-tutor/conversations/:id
 * Delete a conversation with strict user-scoped ownership check.
 */
const deleteConversation = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id
    const { id } = req.params

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, error: 'Invalid conversation ID format' })
    }

    const deleted = await TutorConversation.findOneAndDelete({ _id: id, user: userId })

    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Conversation not found or unauthorized' })
    }

    return res.status(200).json({
      success: true,
      message: 'Conversation deleted successfully',
      id
    })
  } catch (err) {
    console.error('[AITutorConversationController] deleteConversation error:', err)
    return res.status(500).json({ success: false, error: 'Failed to delete conversation' })
  }
}

module.exports = {
  getConversations,
  createConversation,
  getConversationById,
  updateConversation,
  deleteConversation
}
