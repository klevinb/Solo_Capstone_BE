const express = require('express');
const MessageModel = require('./schema');
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

module.exports = router;
