const express = require('express');
const userRoutes = require('./users');
const eventRoutes = require('./events');

const router = express.Router();

router.use('/users', userRoutes);
router.use('/events', eventRoutes);

module.exports = router;
