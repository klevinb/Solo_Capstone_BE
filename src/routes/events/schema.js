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
  },
  organizer: {
    type: String,
    required: true,
  },
});

EventSchema.methods.toJSON = function () {
  const data = this;
  const obj = data.toObject();
  delete obj.__v;

  return obj;
};

const EventModel = mongoose.model('Event', EventSchema);

module.exports = EventModel;
