const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true,
    default: 'user'
  },
  content: {
    type: String,
    default: ''
  },
  attachments: [{
    id: { type: String },
    name: { type: String },
    size: { type: String },
    type: { type: String },
    isImage: { type: Boolean, default: false },
    dataUrl: { type: String },
    content: { type: String }
  }],
  timestamp: {
    type: String,
    default: () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  },
  isStreaming: {
    type: Boolean,
    default: false
  }
}, { _id: true, timestamps: true })

const tutorConversationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    trim: true,
    default: 'New Chat',
    maxlength: 120
  },
  messages: [messageSchema],
  projectId: {
    type: String,
    default: null,
    index: true
  },
  isPinned: {
    type: Boolean,
    default: false
  }
}, { timestamps: true })

// Compound indexes for fast user-scoped sorting and filtering
tutorConversationSchema.index({ user: 1, updatedAt: -1 })
tutorConversationSchema.index({ user: 1, projectId: 1 })
tutorConversationSchema.index({ user: 1, isPinned: -1, updatedAt: -1 })

module.exports = mongoose.model('TutorConversation', tutorConversationSchema)
