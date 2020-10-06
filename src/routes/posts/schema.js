const { Schema } = require('mongoose');
const mongoose = require('mongoose');

const PostSchema = new Schema({
  text: {
    type: String,
    required: true,
  },
  image: {
    type: String,
  },
  user: { type: Schema.Types.ObjectId, ref: 'Profile' },
});

const PostModel = mongoose.model('Post', PostSchema);

module.exports = PostModel;
