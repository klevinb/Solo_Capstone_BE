const { Schema } = require('mongoose');
const mongoose = require('mongoose');

const UserSchema = new Schema({
  username: {
    type: String,
    required: true,
  },
  socketId: {
    type: String,
    required: true,
  },
});

const UserModel = mongoose.model('User', UserSchema);

module.exports = UserModel;
