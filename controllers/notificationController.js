const {
  getUserNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification
} = require('../services/notificationService')

/**
 * GET /api/notifications
 * Retrieves user's notifications with pagination & unread count
 */
const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user._id
    const { page = 1, limit = 20, unreadOnly = 'false' } = req.query
    const isUnreadOnly = unreadOnly === 'true' || unreadOnly === true

    const data = await getUserNotifications(userId, {
      page,
      limit,
      unreadOnly: isUnreadOnly
    })

    return res.status(200).json({
      success: true,
      ...data
    })
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/notifications/unread-count
 * Fast endpoint for unread badge count
 */
const getUnreadNotificationCount = async (req, res, next) => {
  try {
    const userId = req.user._id
    const unreadCount = await getUnreadCount(userId)
    return res.status(200).json({
      success: true,
      unreadCount
    })
  } catch (error) {
    next(error)
  }
}

/**
 * PATCH /api/notifications/:id/read
 * Marks single notification as read
 */
const markRead = async (req, res, next) => {
  try {
    const userId = req.user._id
    const { id } = req.params

    const updated = await markNotificationRead(userId, id)
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found or unauthorized'
      })
    }

    const unreadCount = await getUnreadCount(userId)

    return res.status(200).json({
      success: true,
      notification: updated,
      unreadCount
    })
  } catch (error) {
    next(error)
  }
}

/**
 * PATCH /api/notifications/read-all
 * Marks all notifications as read for authenticated student
 */
const markAllRead = async (req, res, next) => {
  try {
    const userId = req.user._id
    await markAllNotificationsRead(userId)

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      unreadCount: 0
    })
  } catch (error) {
    next(error)
  }
}

/**
 * DELETE /api/notifications/:id
 * Deletes a notification belonging to authenticated student
 */
const removeNotification = async (req, res, next) => {
  try {
    const userId = req.user._id
    const { id } = req.params

    const deleted = await deleteNotification(userId, id)
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found or unauthorized'
      })
    }

    const unreadCount = await getUnreadCount(userId)

    return res.status(200).json({
      success: true,
      message: 'Notification deleted',
      unreadCount
    })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getNotifications,
  getUnreadNotificationCount,
  markRead,
  markAllRead,
  removeNotification
}
