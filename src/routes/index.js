const express = require('express');
const userRoutes = require('./users');
const eventRoutes = require('./events');
const postsRoutes = require('./posts');
const messagesRoutes = require('./socketio/messages');

const router = express.Router();

router.use('/users', userRoutes);
router.use('/events', eventRoutes);
router.use('/posts', postsRoutes);
router.use('/messages', messagesRoutes);

module.exports = router;
