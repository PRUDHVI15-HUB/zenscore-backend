const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/authMiddleware')
const {
  getNotifications,
  getUnreadNotificationCount,
  markRead,
  markAllRead,
  removeNotification
} = require('../controllers/notificationController')

// All routes are strictly protected by JWT auth
router.use(protect)

router.get('/', getNotifications)
router.get('/unread-count', getUnreadNotificationCount)
router.patch('/read-all', markAllRead)
router.patch('/:id/read', markRead)
router.delete('/:id', removeNotification)

module.exports = router
