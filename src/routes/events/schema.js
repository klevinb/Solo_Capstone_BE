const { Schema } = require('mongoose');
const mongoose = require('mongoose');

const EventSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  image: [
    {
      type: String,
    },
  ],
  description: {
    type: String,
    required: true,
  },
  performer: {
    type: String,
    default: '',
  },
  organizer: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  participants: [{ type: Schema.Types.ObjectId, ref: 'Profile' }],
});

EventSchema.static('checkParticipants', async function (id, userId) {
  const user = await EventModel.findOne({
    _id: id,
    participants: mongoose.Types.ObjectId(userId),
  });
  return user;
});

EventSchema.static('addParticipant', async function (id, userId) {
  await EventModel.findByIdAndUpdate(
    { _id: id },
    {
      $addToSet: { participants: userId },
    }
  );
});

EventSchema.static('removeParticipant', async function (id, userId) {
  await EventModel.findByIdAndUpdate(
    { _id: id },
    {
      $pull: { participants: mongoose.Types.ObjectId(userId) },
    }
  );
});

EventSchema.methods.toJSON = function () {
  const data = this;
  const obj = data.toObject();
  delete obj.__v;

  return obj;
};

const EventModel = mongoose.model('Event', EventSchema);

module.exports = EventModel;
