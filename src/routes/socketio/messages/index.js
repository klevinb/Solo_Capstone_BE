const express = require('express');
const MessageModel = require('./schema');
const ProfileModel = require('../../users/schema');
const { isUser } = require('../../../utilities/middlewares');

const router = express.Router();

router.get('/', isUser, async (req, res, next) => {
  try {
    const messages = await MessageModel.find({});
    res.status(200).send(messages);
  } catch (error) {
    console.log(error);
    next(error);
  }
});

router.get('/me', isUser, async (req, res, next) => {
  try {
    const users = await ProfileModel.find({
      'messages.username': req.user.username,
      'messages.count': { $gt: 0 },
    });
    res.status(200).send(users);
  } catch (error) {
    console.log(error);
    next(error);
  }
});

module.exports = router;
