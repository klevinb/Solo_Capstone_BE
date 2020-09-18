const { Schema } = require('mongoose');
const mongoose = require('mongoose');

const MessageSchema = new Schema({
  from: {
    type: String,
    required: true,
  },
  to: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
});

const MessageModel = mongoose.model('Message', MessageSchema);

module.exports = MessageModel;
