const mongoose = require('mongoose')
const Notification = require('../models/Notification')

/**
 * Creates a new notification for a student.
 * Non-blocking: will not crash the calling flow if notification fails.
 */
const createNotification = async ({
  userId,
  type = 'system',
  eventKey,
  title,
  message,
  icon = '🔔',
  priority = 'normal',
  route = null,
  entityId = null,
  metadata = {}
}) => {
  if (!userId || !title || !message) {
    return null
  }

  try {
    const notification = await Notification.create({
      user: userId,
      type,
      eventKey: eventKey || `evt-${type}-${Date.now()}`,
      title: String(title).trim(),
      message: String(message).trim(),
      icon,
      priority,
      route,
      entityId: entityId ? String(entityId) : null,
      metadata
    })
    return notification
  } catch (error) {
    console.error('Notification Creation Notice (non-fatal):', error.message)
    return null
  }
}

/**
 * Creates a notification only if one with the same eventKey does not already exist for this user.
 * Prevents spam / duplicate events.
 */
const createNotificationIfNotExists = async ({
  userId,
  type = 'system',
  eventKey,
  title,
  message,
  icon = '🔔',
  priority = 'normal',
  route = null,
  entityId = null,
  metadata = {}
}) => {
  if (!userId || !eventKey || !title || !message) {
    return null
  }

  try {
    const existing = await Notification.findOne({ user: userId, eventKey })
    if (existing) {
      return existing
    }
    return await createNotification({
      userId,
      type,
      eventKey,
      title,
      message,
      icon,
      priority,
      route,
      entityId,
      metadata
    })
  } catch (error) {
    console.error('Notification Dedup Notice (non-fatal):', error.message)
    return null
  }
}

/**
 * Retrieves paginated notifications for an authenticated student.
 */
const getUserNotifications = async (userId, { page = 1, limit = 20, unreadOnly = false } = {}) => {
  const query = { user: userId }
  if (unreadOnly) {
    query.isRead = false
  }

  const p = Math.max(parseInt(page, 10) || 1, 1)
  const l = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100)
  const skip = (p - 1) * l

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(l)
      .lean(),
    Notification.countDocuments(query),
    Notification.countDocuments({ user: userId, isRead: false })
  ])

  return {
    notifications,
    unreadCount,
    pagination: {
      page: p,
      limit: l,
      total,
      hasMore: skip + notifications.length < total
    }
  }
}

/**
 * Retrieves unread notification count for an authenticated student.
 */
const getUnreadCount = async (userId) => {
  try {
    return await Notification.countDocuments({ user: userId, isRead: false })
  } catch (err) {
    console.error('Failed to get unread count:', err)
    return 0
  }
}

/**
 * Marks a specific notification as read.
 * Guarantees strict user isolation (returns null if notification does not belong to user).
 */
const markNotificationRead = async (userId, notificationId) => {
  if (!mongoose.Types.ObjectId.isValid(notificationId)) {
    return null
  }

  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { $set: { isRead: true, readAt: new Date() } },
    { new: true }
  )

  return notification
}

/**
 * Marks all unread notifications as read for the authenticated student.
 */
const markAllNotificationsRead = async (userId) => {
  const result = await Notification.updateMany(
    { user: userId, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  )
  return result
}

/**
 * Deletes a specific notification belonging to the student.
 */
const deleteNotification = async (userId, notificationId) => {
  if (!mongoose.Types.ObjectId.isValid(notificationId)) {
    return null
  }
  return await Notification.findOneAndDelete({ _id: notificationId, user: userId })
}

module.exports = {
  createNotification,
  createNotificationIfNotExists,
  getUserNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification
}
